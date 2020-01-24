import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';
import request from 'request';
import { Emoji } from '@bot/libraries/emoji';
import { Message } from 'discord.js';
import { MessageAttachment } from 'discord.js';

export class Avatar extends Command {
    constructor() {
        super({
            name: 'avatar',
            description: 'Returns the full avatar for the specified user.',
            arguments: [
                {
                    name: 'user',
                    constraint: 'mention',
                    default: '@member',
                    error: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let user = input.getArgument('user') as GuildMember;
        let promise : Promise<Buffer> = new Promise((resolve, reject) => {
            let url = user.user.avatarURL({ format: 'png', dynamic: true })!;
            request(url, { encoding: null }, function(err, response, buffer) {
                if (err) return reject(err);
                resolve(buffer);
            });
        });

        // Post a loading message
        let message = await input.channel.send(`${Emoji.LOADING}  Retrieving avatar...`) as Message;

        // Get the buffer
        try {
            await input.channel.send(new MessageAttachment(await promise, 'Avatar.png'));
            await message.delete();
        }
        catch (err) {
            console.error(err);
            await message.edit(`${Emoji.ERROR}  Failed to download avatar, try again in a few moments.`);
            message.deleteAfter(6000);
        }
    }
}
