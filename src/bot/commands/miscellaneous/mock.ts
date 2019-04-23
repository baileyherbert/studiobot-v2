import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';

export class Mock extends Command {
    constructor() {
        super({
            name: 'mock',
            description: 'Returns text mocking the target user\'s last message in the channel.',
            arguments: [
                {
                    name: 'user',
                    constraint: 'mention',
                    required: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let user = input.getArgument('user') as GuildMember;
        let lastMessage = user.lastMessage;

        if (user == input.member) {
            return await input.channel.send(`${Emoji.ERROR}  You can't mock yourself!`);
        }

        if (user.user.bot) {
            return await input.channel.send(`${Emoji.ERROR}  You can't mock a bot!`);
        }

        if (lastMessage && lastMessage.content.charAt(0) != input.guild.settings.prefix && lastMessage.content.length > 0) {
            let lastMessageText = lastMessage.content;
            let changed = "";

            for (let i = 0; i < lastMessageText.length; i++) {
                let char = lastMessageText[i];

                if (i % 2 === 0) {
                    char = char.toUpperCase();
                }
                else {
                    char = char.toLowerCase();
                }

                changed += char;
            }

            await input.channel.send(changed);
        }
        else {
            return await input.channel.send(`${Emoji.ERROR}  Can't find a message to mock!`);
        }
    }
}
