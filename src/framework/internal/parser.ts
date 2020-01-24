import { Command } from "@core/bot/command";
import { Message } from "discord.js";
import { GuildMember } from "discord.js";
import { Role } from "discord.js";
import { Argument } from "./argument";
import { Guild } from "discord.js";
import { MemberBucket } from "@core/lib/database/member";
import { PartialMessage } from 'discord.js';

export class Parser {
    private command: Command;
    private message: Message | PartialMessage | undefined;
    private guild: Guild | undefined;
    private content: string;

    private compiledArguments: CompiledArgument[] = [];
    private compiledError: Error | undefined;

    private parsedContentBuffer : string;
    private parsedArguments: ParsedArgument[] = [];

    constructor(command: Command, message: Message | PartialMessage | undefined, content: string) {
        this.command = command;
        this.message = message;
        this.guild = message ? message.guild! : undefined;
        this.content = content.trim();

        // Build an array of arguments and their expressions
        this.parsedContentBuffer = content;
        this.compiledArguments = this.getCompiledArguments();

        // Parse the input and match them to the arguments
        this.parse();

        // Detect errors within optional arguments
        // This can get pretty tricky so I'm separating it from parse()
        if (!this.findErrors()) {
            // If everything is going okay so far, check argument evaluators
            this.evaluate();
        }
    }

    /**
     * Returns the error that occurred during parsing, or `undefined` if the parsing was successful.
     */
    public getError() : Error | undefined {
        let failed : ParsedArgument | undefined;

        _.forEach(this.parsedArguments, parsed => {
            if (parsed.error) {
                failed = parsed;
                return false;
            }
        });

        if (failed) {
            if (failed.required && !failed.value) {
                let an = /^[aeiou]/i.test(failed.name) ? 'an' : 'a';
                return new Error(failed.errorMessage || 'Please enter ' + an + ' ' + failed.name + '.');
            }

            return new Error(failed.errorMessage || 'Please enter a valid ' + failed.name + '.');
        }

        return undefined;
    }

    /**
     * Returns the parsed arguments as an array. Check for errors first using `getError()`.
     */
    public getArguments() : ParsedArgument[] {
        return this.parsedArguments;
    }

    /**
     * Parses the input using the compiled arguments and sets internal values.
     */
    private parse() {
        for (let i = 0; i < this.compiledArguments.length; i++) {
            let argument = this.compiledArguments[i];
            let regex = new RegExp(`^${argument.regex.source}(\\s|$)`, 'i');
            let an = /^[aeiou]/i.test(argument.name) ? 'an' : 'a';

            // We'll need to parse the following argument and build the correct values
            let parsed : ParsedArgument = {
                name: argument.name,
                value: undefined,
                error: false,
                required: argument.original.getRequired(),
                argument: argument.original
            };

            // Execute the regular expression
            let matches = regex.exec(this.parsedContentBuffer);

            // If we matched a value then extract and parse it
            if (matches != null) {
                parsed.value = matches[1];
                parsed.parsedValue = argument.original.parse(matches[1], this.guild);

                // Remove this argument from the buffer
                this.parsedContentBuffer = this.parsedContentBuffer.substring(matches[0].length).trim();

                // Handle invalid roles or mentions
                if ((parsed.required || parsed.argument.getShouldError()) && parsed.parsedValue == undefined) {
                    if (parsed.argument.getConstraints().indexOf('role') >= 0 || parsed.argument.getConstraints().indexOf('mention') >= 0) {
                        parsed.error = true;
                        parsed.errorMessage = `Please enter a valid ${argument.name}.`;
                    }
                }
            }

            // Otherwise get the default value, and if this is a required argument, we should error
            else {
                if (argument.original.getRequired()) {
                    parsed.error = true;
                    parsed.errorMessage = (this.parsedContentBuffer.length == 0) ?
                        `Please enter ${an} ${argument.name}.`:
                        `Please enter a valid ${argument.name}.`;
                }

                parsed.parsedValue = argument.original.getDefaultValue();

                if (parsed.parsedValue == '@member' && this.message) {
                    parsed.parsedValue = this.message.member;
                }
            }

            // Add the argument
            this.parsedArguments.push(parsed);

            // Stop compiling if the argument errored and should halt the command
            if (parsed.error && parsed.argument.getShouldError()) {
                break;
            }
        }
    }

    /**
     * Detects errors in optional arguments after parsing. Returns `false` if everything is okay, or `true` if there is
     * an error.
     */
    private findErrors() : boolean {
        _.forEach(this.parsedArguments, parsed => {
            if (!parsed.error && parsed.required && parsed.parsedValue == undefined) {
                let an = /^[aeiou]/i.test(parsed.name) ? 'an' : 'a';

                parsed.error = true;
                parsed.errorMessage = `Please enter ${an} ${parsed.name}.`;
                return;
            }

            if (this.parsedContentBuffer.length == 0) return;
            if (parsed.error || parsed.required || parsed.value) return;
            if (!parsed.argument.getShouldError()) return;

            parsed.error = true;
            return false;
        });

        return this.getError() ? true : false;
    }

    /**
     * Runs through argument evaluators to make sure their values are permissible.
     */
    private evaluate() {
        _.forEach(this.parsedArguments, parsed => {
            if (parsed.error || !parsed.value) return;
            let evaluator = parsed.argument.getEvaluator();

            if (evaluator) {
                try {
                    if (!evaluator(parsed.parsedValue, this.parsedArguments, this.message as Message)) {
                        parsed.error = true;
                        parsed.errorMessage = parsed.argument.getErrorMessage() || `Please enter a valid ${parsed.name}.`;
                    }
                }
                catch (error) {
                    parsed.error = true;
                    parsed.errorMessage = error.message;
                }
            }
        });
    }

    /**
     * Compiles the arguments in the command and returns them as an array.
     */
    private getCompiledArguments() : CompiledArgument[] {
        let args = this.command.getArguments();
        let compiled : CompiledArgument[] = [];

        _.forEach(args, arg => {
            let exp = arg.getRegularExpression();

            compiled.push({
                name: arg.getName(),
                original: arg,
                regex: exp
            })
        });

        return compiled;
    }

    /**
     * Resolves guild members in the parser, and ensures their settings are loaded.
     */
    public async resolve() {
        for (let i = 0; i < this.parsedArguments.length; i++) {
            let arg = this.parsedArguments[i];

            if (arg.parsedValue && arg.parsedValue instanceof GuildMember) {
                if (!arg.parsedValue.settings) {
                    arg.parsedValue.settings = new MemberBucket(arg.parsedValue.id, arg.parsedValue.guild.id);
                    await arg.parsedValue.settings.load();
                }
            }
        }
    }
}

export type ParsedArgument = {
    name: string;
    value: string | undefined;
    error: boolean;
    errorMessage?: string;
    required: boolean;
    argument: Argument;
    constraint?: string;
    parsedValue?: string | number | null | GuildMember | Role | boolean | undefined
};

type CompiledArgument = {
    name: string;
    original: Argument;
    regex: RegExp;
}
