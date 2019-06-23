import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';

export class Balance extends Command {
    constructor() {
        super({
            name: 'balance',
            aliases: ['bal', 'money'],
            description: 'Returns the current balance for the specified user.',
            arguments: [
                {
                    name: 'user',
                    constraint: 'mention',
                    default: '@member',
                    error: true,
                    eval: (input: GuildMember, args, message) => {
                        return !input.user.bot;
                    }
                }
            ]
        });
    }

    execute(input: Input) {
        let user = input.getArgument('user') as GuildMember;
        input.channel.send(`:moneybag:  Current balance for ${user} is **$${user.settings.currency.toFixed(2)}**.`);
    }
}
