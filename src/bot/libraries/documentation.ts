import { Command } from "@api";
import { RichEmbed } from "discord.js";

/**
 * This class is a helper library to generate help and usage information for commands.
 */
export class Documentation {

    /**
     * Returns an overview of the command with its usage and description.
     */
    public static getCommandOverview(command: Command) {
        let usage = '`' + this.getInlineUsage(command) + '`';
        return `${command.getDescription()}\n\nUsage:  ${usage}`;
    }

    /**
     * Returns a list of arguments for the command with their type and default.
     */
    public static getArgumentList(command: Command) {
        let result = '';

        command.getArguments().forEach(arg => {
            let options = arg.getOptions();

            result += `•  \`${arg.getName()}\`` + (arg.getDescription() ? `  –  ${arg.getDescription()}` : '');
            result += '\n';

            if (options && options.length > 1 && options.length <= 6) {
                options.forEach((option : any) => {
                    let segment = `    ‣  \`${option}\`\n`;

                    if (result.length + segment.length <= 1024) {
                        result += segment;
                    }
                });
            }
        });

        return result.trim();
    }

    /**
     * Returns a list of arguments with full details, including type, default, description, and options.
     */
    public static getArgumentDetails(command: Command) {
        return this.getArgumentList(command);
    }

    /**
     * Returns the command's usage as a string in inline format, which can be surrounded with backticks for formatting.
     */
    public static getInlineUsage(command: Command) {
        let usage = command.getName();
        let args : string[] = [];

        command.getArguments().forEach(arg => {
            args.push(arg.getUsage());
        });

        return `${usage} ${args.join(' ')}`.trim();
    }

    /**
     * Returns a list of formatted aliases for the given command.
     */
    public static getAliasList(command: Command) {
        let aliases : string[] = [];

        command.getAliases().forEach(alias => {
            // Aliases include the command's actual name, so filter it out
            if (alias.equals(command.getName())) return;

            // Surround with inline code blocks
            aliases.push('`' + alias + '`');
        });

        return aliases.join(',  ');
    }

    /**
     * Returns a string with the full detailed help information for a command.
     */
    public static getCommandHelp(command: Command) : RichEmbed {
        let fields = [{
            name: 'Usage',
            value: '`' + this.getInlineUsage(command) + '`'
        }];

        // If there are arguments, add it to the fields
        if (command.getArguments().length > 0) {
            fields.push({
                name: 'Arguments',
                value: Documentation.getArgumentDetails(command)
            });
        }

        // If there are aliases, add them to the fields
        if (command.getAliases().length > 1) {
            fields.push({
                name: 'Aliases',
                value: Documentation.getAliasList(command)
            });
        }

        // Build the embed
        let embed = new RichEmbed({
            description: command.getDescription() + '\n',
            color: 0x1c7ed6,
            author: { name: 'Help for ' + command.getName() },
            fields: fields
        });

        return embed;
    }

}
