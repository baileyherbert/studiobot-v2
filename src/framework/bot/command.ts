import { GuildMember, Role } from 'discord.js';
import { Input } from '@core/api';
import { Logger } from './logger';
import { Argument } from '@core/internal/argument';
import { ParsedArgument } from '@core/internal/parser';
import { Documentation } from '@bot/libraries/documentation';
import { Message } from 'discord.js';

export abstract class Command {
    private logger: Logger;
    private options: CommandOptions;
    private arguments: Argument[];

    constructor(options: CommandOptions) {
        this.options = options;
        this.logger = new Logger('command:' + this.options.name);
        this.arguments = [];

        // Convert the arguments option to an array of argument objects
        if (this.options.arguments) {
            _.forEach(this.options.arguments, argument => {
                this.arguments.push(new Argument(argument));
            });
        }

        this.init();
    }

    /**
     * Initializes the command.
     */
    protected init() : any {

    }

    /**
     * Executes the command for the given input.
     */
    public execute(input: Input): any {
        input.channel.send('This command is not yet implemented.');
    }

    /**
     * Returns the logger instance for this command.
     */
    protected getLogger(): Logger {
        return this.logger;
    }

    /**
     * Returns the command's name.
     */
    public getName(): string {
        return this.options.name.toLowerCase();
    }

    /**
     * Returns an array of the command's aliases, including its name as the first element.
     */
    public getAliases(): string[] {
        let names = [this.getName().toLowerCase()];

        if (this.options.aliases) {
            this.options.aliases.forEach(alias => {
                names.push(alias.toLowerCase());
            });
        }

        return names;
    }

    /**
     * Returns whether the command matches the given alias or name (case-insensitive).
     */
    public hasAlias(alias: string): boolean {
        return this.getAliases().indexOf(alias.toLowerCase()) >= 0;
    }

    /**
     * Returns the command's help description.
     */
    public getDescription(): string {
        return this.options.description;
    }

    /**
     * Returns an array of the command's arguments.
     */
    public getArguments(): Argument[] {
        return this.arguments;
    }

    /**
     * Returns the permission flag for this command, or undefined if one is not configured.
     */
    public getPermission() : number | undefined {
        if (!this.options.permission) return;

        switch (this.options.permission) {
            case 'createInstantInvite': return 1 << 0;
            case 'kickMembers': return 1 << 1;
            case 'banMembers': return 1 << 2;
            case 'administrator': return 1 << 3;
            case 'manageChannels': return 1 << 4;
            case 'manageGuild': return 1 << 5;
            case 'addReactions': return 1 << 6;
            case 'viewAuditLog': return 1 << 7;
            case 'prioritySpeaker': return 1 << 8;

            case 'readMessages': return 1 << 10;
            case 'sendMessages': return 1 << 11;
            case 'sendTtsMessages': return 1 << 12;
            case 'manageMessages': return 1 << 13;
            case 'embedLinks': return 1 << 14;
            case 'attachFiles': return 1 << 15;
            case 'readMessageHistory': return 1 << 16;
            case 'mentionEveryone': return 1 << 17;
            case 'useExternalEmojis': return 1 << 18;

            case 'connect': return 1 << 20;
            case 'speak': return 1 << 21;
            case 'muteMembers': return 1 << 21;
            case 'deafenMembers': return 1 << 23;
            case 'moveMembers': return 1 << 24;
            case 'useVad': return 1 << 25;

            case 'changeNickname': return 1 << 26;
            case 'manageNicknames': return 1 << 27;
            case 'manageRoles': return 1 << 28;
            case 'manageWebhooks': return 1 << 29;
            case 'manageEmojis': return 1 << 30;
        }
    }

    /**
     * Returns usage for this command.
     */
    public getUsage() : string {
        return Documentation.getInlineUsage(this);
    }

    /**
     * Returns any custom usage configured by the command.
     */
    public getCustomUsage() : string | undefined {
        return this.options.usage;
    }
}

export type CommandOptions = {
    /**
     * The name of the command, which is used by users to call it.
     */
    name: string;

    /**
     * The description of the command as shown on the help page.
     */
    description: string;

    /**
     * A string array of additional names with which this command can be called.
     */
    aliases?: string[];

    /**
     * An array of arguments for this command.
     */
    arguments?: CommandArgument[];

    /**
     * The permission required for a user to run this command.
     */
    permission?: PermissionResolvable;

    /**
     * A string showing how to use the command.
     */
    usage?: string;
};

type PermissionResolvable = 'createInstantInvite' | 'kickMembers' | 'banMembers' | 'administrator' | 'manageChannels' | 'manageGuild' |
                            'addReactions' | 'viewAuditLog' | 'prioritySpeaker' | 'readMessages' | 'sendMessages' |
                            'sendTtsMessages' | 'manageMessages' | 'embedLinks' | 'attachFiles' | 'readMessageHistory' | 'mentionEveryone' |
                            'useExternalEmojis' | 'connect' | 'speak' | 'muteMembers' | 'deafenMembers' | 'moveMembers' | 'useVad' |
                            'changeNickname' | 'manageNicknames' | 'manageRoles' | 'manageWebhooks' | 'manageEmojis';

export type CommandArgument = {
    /**
     * The name of the argument, which will be used by you to retrieve its value.
     */
    name: string;

    /**
     * A description of the argument, which will be displayed in the help page.
     */
    description?: string;

    /**
     * Whether or not this argument is required (default is `false`).
     */
    required?: boolean;

    /**
     * A custom regular expression to match this argument (default is `("[^"]+"|[^\\s"]+)` but this varies depending
     * on whether you've set a `constraint`).
     */
    patterns?: RegExp | RegExp[];

    /**
     * A custom regular expression to match this argument (default is `("[^"]+"|[^\\s"]+)` but this varies depending
     * on whether you've set a `constraint`).
     *
     * @alias `patterns`
     */
    pattern?: RegExp | RegExp[];

    /**
     * A constraint for the argument. This essentially changes the pattern to fit the constraint, but also
     * will make the argument return a matching data type. Use an array to accept multiple types in one argument.
     *
     * - `number` - decimals and integers
     * - `alphanumeric` - letters, numbers, periods, underscores, dashes
     * - `char` - a single character
     * - `mention` - a mention of a user, returns a `GuildMember`
     * - `emoji` - a utf-8 emoji character, returns a `string`
     * - `role` - a mention of a role, returns a `Role`
     * - `boolean` - one of `yes|no|true|false|1|0|on|off`, returns a `boolean`
     */
    constraint?: CommandConstraint | CommandConstraint[];

    /**
     * An enumeration of possible values this argument can be. If the user specifies a value not in this
     * enumeration, the argument fails to match.
     */
    options?: string[] | number[];

    /**
     * The default value of this argument.
     *
     * - For a `mention` constraint, you can set this as `'@member'` to default to the calling guild member.
     */
    default?: string | number | null | GuildMember | Role | boolean | undefined;

    /**
     * If set to true, the argument will "expand" and capture the rest of the text in the command as its value. In
     * other words, it doesn't separate the rest of the text by spaces. Default is `false`.
     *
     * **Note**  —  This overrides the pattern to `^(.+)$`
     */
    expand?: boolean;

    /**
     * If the argument is optional, this option is set to `true`, and the user provides a value which does not match
     * the argument's constraints, pattern, or options, then the command will be rejected.
     */
    error?: boolean;

    /**
     * Usage information for the argument, such as 'amount' or 'amount|all'. If not set explicitly, this will be
     * generated automatically from the argument's configuration. Note that the usage string will be surrounded by
     * either '<>' or '[]' to display whether it is required or not.
     */
    usage?: string;

    /**
     * A lambda function which will be called to evaluate the input during parsing. The `input` is passed in the first
     * parameter as a parsed value, and you should return a bool back (`true` if the value is valid).
     *
     * **Note:** This function only gets called if the value matches the constraints, patterns, and options specified in
     * your argument. So if you lock those down properly, you should know exactly what format the value of `input` will
     * be in and can trust it to be so.
     *
     * **Note #2:** You can throw an `Error` from this function and the bot will respond with the error's message. This
     * can help provide contextual feedback to the user when giving an incorrect value.
     */
    eval?: (input: any, args: ParsedArgument[], message: Message) => boolean;

    /**
     * The message to display if this argument fails. If not specified, the command's usage string will be displayed.
     * This only applies to arguments that are `required` or have `error` enabled.
     */
    message?: string;
};

export type CommandConstraint = 'number' | 'string' | 'alphanumeric' | 'char' | 'mention' | 'emoji' | 'role' | 'boolean' | 'url';
