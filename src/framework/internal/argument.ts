import { CommandArgument, CommandConstraint } from "@core/bot/command";
import { GuildMember } from "discord.js";
import { Role } from "discord.js";
import { Guild } from "discord.js";
import { ParsedArgument } from "./parser";
import { Message } from "discord.js";

export class Argument {
    private options : CommandArgument;

    constructor(options: CommandArgument) {
        this.options = options;
    }

    /**
     * Returns the name of the argument.
     */
    public getName() : string {
        return this.options.name;
    }

    /**
     * Returns the description of the argument. If one is not available, returns `undefined`.
     */
    public getDescription() : string | undefined {
        return this.options.description;
    }

    /**
     * Returns true if this argument is required.
     */
    public getRequired() : boolean {
        return this.options.required || false;
    }

    /**
     * Returns the custom regular expression patterns for this argument. If you want to get the compiled expression for
     * parsing, use `getRegularExpression()`.
     */
    public getPatterns() : RegExp[] {
        let patterns = this.options.patterns || this.options.pattern;

        if (!patterns) {
            return [];
        }

        if (patterns instanceof Array) {
            return patterns as RegExp[];
        }

        return [patterns];
    }

    /**
     * Returns the compiled regular expression for this argument.
     */
    public getRegularExpression() : RegExp {
        if (this.getExpansive()) {
            return /(.+)/;
        }

        let expressions = this.getRegularExpressions();
        let compiled : string[] = [];

        _.each(expressions, expression => {
            compiled.push(expression.source);
        });

        let source = compiled.join('|');
        let expression = new RegExp(`(${source})`, 'i');

        return expression;
    }

    /**
     * Returns an array of regular expressions that this argument can match against.
     */
    private getRegularExpressions() : RegExp[] {
        if (this.options.options) return [this.getOptionsExpression() as RegExp];
        if (this.options.patterns) return this.getPatterns();
        if (this.options.constraint) return _.values(this.getConstraintExpressions());

        return [/("[^"]+"|[^\s"]+)/];
    }

    /**
     * Returns, if available, an array of acceptable values for this argument. If not available, returns `undefined`.
     */
    public getOptions() : string[] | number[] | undefined {
        return this.options.options;
    }

    /**
     * Returns true if this argument is expansive (it captures the rest of the arguments as one string).
     */
    public getExpansive() : boolean {
        return this.options.expand || false;
    }

    /**
     * Returns true if the argument should error when the value doesn't match. This is a little complicated. Basically,
     * if a value is provided by the user for this argument and it doesn't match, it will error. This is always `true`
     * for required arguments, but optional ones can choose between ignoring the value and erroring.
     *
     * Also, if a value is passed to an optional argument and doesn't match, but the value does match an argument which
     * follows, then it will not error even if this is `true`.
     */
    public getShouldError() : boolean {
        return this.options.required || (this.options.error || false);
    }

    /**
     * Returns, if available, a message the bot should reply with if the argument fails to match the value. This only
     * triggers if `getShouldError()` is `true`. If a message is not available, returns `undefined`.
     */
    public getErrorMessage() : string | undefined {
        return this.options.message;
    }

    /**
     * Returns the usage information for this argument.
     */
    public getUsage() : string {
        let components : string[] = [];
        let options = this.getOptions();
        components.push(this.getRequired() ? '<' : '[');

        if (options && options.length < 5) components.push((<string[]> this.getOptions()).join('|'));
        else if (_.isEqual(this.getConstraints(), ['mention'])) components.push('@' + this.getName());
        else components.push(this.getName());

        if (this.getDefaultValue() != undefined && this.getDefaultValue() != '') {
            let d = '' + this.getDefaultValue();
            if (d == '@mention' || d == '@member') d = 'you';
            components.push(' = ' + d);
        }

        components.push(this.getRequired() ? '>' : ']');
        return components.join('');
    }

    /**
     * Returns, if available, a function to evaluate the user's input for the argument. Returns `undefined` if not
     * available.
     *
     * When the evaluator is called, a boolean will be returned, with `true` meaning the input is valid. This should
     * not be called unless the value meets a constraint, fits the options, and passes all other checks.
     *
     * **Note:** You can throw an `Error` from this function and the bot will respond with the error's message. This
     * can help provide contextual feedback to the user when giving an incorrect value.
     */
    public getEvaluator() : ((input: any, args: ParsedArgument[], message: Message) => boolean) | undefined {
        return this.options.eval;
    }

    /**
     * Returns an array of constraints for this argument.
     */
    public getConstraints() : CommandConstraint[] {
        let constraint = this.options.constraint || [];

        if (typeof constraint == 'object') {
            return constraint;
        }

        return [constraint];
    }

    /**
     * Returns an array of regular expressions for the constraints of the argument.
     */
    public getConstraintExpressions() : {[constraint: string]: RegExp} {
        let expressions : {[constraint: string]: RegExp} = {};

        _.forEach(this.getConstraints(), constraint => {
            let expression : RegExp;

            switch (constraint) {
                case 'number': expression = /([\d.-]+)/; break;
                case 'alphanumeric': expression = /^([a-zA-Z0-9._-]+)/; break;
                case 'char': expression = /(.)/; break;
                case 'mention': expression = /(<@!?\d+>)/; break;
                case 'role': expression = /(<@&\d+>)/; break;
                case 'boolean': expression = /(yes|no|1|0|true|false|on|off)/; break;
                case 'url': expression = /((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?)/; break;
                case 'emoji': expression = /((?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]))/; break;
                default: expression = /("[^"]+"|[^\s"]+)/; break;
            }

            expressions[constraint] = new RegExp(expression.source, 'i');
        });

        return expressions;
    }

    /**
     * Returns an expression to match the argument's possible options.
     */
    public getOptionsExpression() : RegExp | undefined {
        if (this.options.options) {
            let prepared : string[] = [];

            _.forEach(this.options.options, opt => {
                prepared.push(`${opt}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            });

            return new RegExp('(' + prepared.join('|') + ')', 'i');
        }

        return undefined;
    }

    /**
     * Returns the default value for this argument. If one was not specified, returns `undefined`. This also may return
     * a string (`'@member'`) to refer to the calling guild member. You'll need to check for and convert that yourself.
     */
    public getDefaultValue() : string | number | null | GuildMember | Role | boolean | undefined {
        return this.options.default;
    }

    /**
     * Parses the given string to match the type of the argument's constraint. If no constraint is configured, returns
     * the given content as-is. The content is expected to have been validated against the argument's compiled regex.
     */
    public parse(content: string, guild?: Guild) : (string | number | null | GuildMember | Role | boolean | undefined) {
        let expressions = this.getConstraintExpressions();
        let match : (string | number | null | GuildMember | Role | boolean | undefined) = content;

        _.forEach(expressions, (expression, constraint) => {
            let matches = expression.exec(content);

            if (matches) {
                let value = matches[1];
                match = this.parseForConstraint(value, constraint, guild);

                return false;
            }
        });

        // Convert options to the correct character case
        if (this.getOptions()) {
            _.each(this.getOptions(), option => {
                if (typeof option == 'string') {
                    if (option.toLowerCase() == content.toLowerCase()) {
                        match = option;
                    }
                }
            });
        }

        return match;
    }

    /**
     * Parses the given string into the correct data format for the constraint. For example, if the constraint is a
     * mention, the given string will be in the format of <@123456789>. This will be converted to a GuildMember and
     * returned.
     */
    private parseForConstraint(content: string, constraint: string, guild?: Guild) : (string | number | null | GuildMember | Role | boolean | undefined) {
        let lower = content.toLowerCase();

        switch (constraint) {
            case 'number':
                return (content.indexOf('.') >= 0) ? parseFloat(content) : parseInt(content);
            case 'mention':
                return (guild) ? guild.members.get((/<@!?(\d+)>/.exec(content) as RegExpExecArray)[1]) : undefined;
            case 'role':
                return (guild) ? guild.roles.get((/<@&(\d+)>/.exec(content) as RegExpExecArray)[1]) : undefined;
            case 'boolean':
                return (lower == 'yes' || lower == '1' || lower == 'true' || lower == 'on');
        }

        return content;
    }

}
