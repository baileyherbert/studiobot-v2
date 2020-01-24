import { Message, GuildMember, Guild, TextChannel, DMChannel, Role } from 'discord.js';
import { Command } from './command';
import { Parser } from '@core/internal/parser';
import { PartialMessage } from 'discord.js';

export class Input {

    public message: Message;
    public member: GuildMember;
    public guild: Guild;
    public channel: TextChannel | DMChannel;

    private command?: Command;
    private prefix: string = '';
    private commandName: string = '';
    private text: string = '';
    private args: Argument[] = [];
    private compatible: boolean = true;

    private error: Error|undefined;
    private resolver: Promise<void> | undefined;

    constructor(message: Message | PartialMessage) {
        // Extract basic message properties
        this.message = <Message>message;
        this.member = message.member!;
        this.guild = message.guild!;
        this.channel = message.channel!;

        // Start the parser
        this.parse();
    }

    /**
     * Parses the message.
     */
    private parse() {
        // Extract prefix
        this.prefix = this.message.content!.substring(0, 1);

        // Extract command name and text
        let content = this.message.content!.substring(1) + ' ';
        let space = content.indexOf(' ');
        this.commandName = content.substring(0, space);
        this.text = content.substring(space).trim();

        // Find a matching command
        let { Framework } = require('../framework');
        if (!(this.command = Framework.findCommand(this.commandName))) return;

        // Create the parser
        let parser = new Parser(this.command as Command, this.message, this.text);
        this.resolver = parser.resolve();

        // Check for errors
        this.error = parser.getError();
        this.compatible = (this.error == undefined);

        // Get arguments
        _.forEach(parser.getArguments(), parsed => {
            this.args.push({
                name: parsed.name,
                value: parsed.parsedValue
            });
        });
    }

    /**
     * Waits for the input to be ready. Used internally.
     */
    public async wait() {
        if (this.resolver) {
            await this.resolver;
        }
    }

    /**
     * Returns the name or alias of the called command as it was typed by the user. Does not include the prefix.
     */
    public getCommandName() : string {
        return this.commandName;
    }

    /**
     * Returns the command this input is referencing, or null if there is no match.
     */
    public getCommand() : Command | undefined {
        return this.command;
    }

    /**
     * Returns an error encountered during input parsing, if applicable.
     */
    public getError() : Error | undefined {
        return this.error;
    }

    /**
     * Returns the prefix used for this command.
     */
    public getPrefix() : string {
        return this.prefix;
    }

    /**
     * Returns the text provided after the command name as one string.
     */
    public getText() : string {
        return this.text;
    }

    /**
     * Returns the value of the specified argument. If the argument is optional and was not provided by the
     * user, then the default value for the argument is returned (`null` unless otherwise specified).
     */
    public getArgument(name: string) : (Role | GuildMember | string | number | null | boolean | undefined) {
        for (let i = 0; i < this.args.length; i++) {
            let arg = this.args[i];

            if (arg.name.toLowerCase() == name.toLowerCase()) {
                return arg.value;
            }
        }

        return undefined;
    }

    /**
     * Returns true if the input meets the requirements of the command (that is, all required arguments are
     * present in the input, and match the constraints).
     */
    public isProper() : boolean {
        return this.compatible;
    }

    /**
     * Returns true if the user is requesting help for this command. This method is used internally, and if `true`,
     * the command is never invoked.
     */
    public isRequestingHelp() : boolean {
        return (this.text.equalsIgnoreCase('help'));
    }

    /**
     * Generates an array of expressions for the given argument.
     */
    private generateExpressions(arg: any) : string[] {
        if (arg.expand) return ['^(.+)$'];

        if (arg.pattern) {
            let pattern = arg.pattern.toString();
            let lastSlash = pattern.lastIndexOf('/');
            pattern = pattern.substring(1, lastSlash);

            return ['^' + pattern + '(\\s|$)'];
        }

        if (arg.constraint) {
            return this.getConstraintExpressions(arg);
        }

        return ['^("[^"]+"|[^\\s"]+)(\\s|$)'];
    }

    /**
     * Generates the flags for a given argument.
     */
    private generateFlags(arg: any) : string | undefined {
        if (arg.expand) return undefined;

        if (arg.pattern) {
            let originalPattern = arg.pattern.toString();
            let lastSlash = originalPattern.lastIndexOf('/');
            let flags : string|undefined = undefined;

            if (lastSlash < (originalPattern.length - 1)) {
                flags = originalPattern.substring(lastSlash + 1);
            }

            return flags;
        }

        return 'i';
    }

    /**
     * Returns an array of constraint expressions for an argument.
     */
    private getConstraintExpressions(arg: any) : string[] {
        if (arg.constraint) {
            if (typeof arg.constraint == 'object') {
                let expressions: string[] = [];

                arg.constraint.forEach((constraint: string) => {
                    expressions.push(this.getConstraintExpression(constraint));
                });

                return expressions;
            }

            return [this.getConstraintExpression(arg.constraint)];
        }

        return [];
    }

    /**
     * Returns a constraint's expression as a string given its type.
     */
    private getConstraintExpression(constraint: string) {
        if (constraint == 'number') return '^(\\d+)(\\s|$)';
        if (constraint == 'alphanumeric') return '^([a-zA-Z0-9._-]+)(\\s|$)';
        if (constraint == 'char') return '^(.)(\\s|$)';
        if (constraint == 'mention') return '^(<@!?\\d+>)(\\s|$)';
        if (constraint == 'role') return '^(<@&\\d+>)(\\s|$)';
        if (constraint == 'boolean') return '^(yes|no|1|0|true|false|on|off)(\\s|$)';
        if (constraint == 'url') return '^((http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?)(\\\\s|$)';
        if (constraint == 'emoji') return '^((?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\u0023-\\u0039]\\ufe0f?\\u20e3|\\u3299|\\u3297|\\u303d|\\u3030|\\u24c2|\\ud83c[\\udd70-\\udd71]|\\ud83c[\\udd7e-\\udd7f]|\\ud83c\\udd8e|\\ud83c[\\udd91-\\udd9a]|\\ud83c[\\udde6-\\uddff]|[\\ud83c[\\ude01-\\ude02]|\\ud83c\\ude1a|\\ud83c\\ude2f|[\\ud83c[\\ude32-\\ude3a]|[\\ud83c[\\ude50-\\ude51]|\\u203c|\\u2049|[\\u25aa-\\u25ab]|\\u25b6|\\u25c0|[\\u25fb-\\u25fe]|\\u00a9|\\u00ae|\\u2122|\\u2139|\\ud83c\\udc04|[\\u2600-\\u26FF]|\\u2b05|\\u2b06|\\u2b07|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u231a|\\u231b|\\u2328|\\u23cf|[\\u23e9-\\u23f3]|[\\u23f8-\\u23fa]|\\ud83c\\udccf|\\u2934|\\u2935|[\\u2190-\\u21ff]))(\\s|$)';

        return '^("[^"]+"|[^\\s"]+)(\\s|$)';
    }

}

type Argument = {
    name: string;
    value: any;
}
