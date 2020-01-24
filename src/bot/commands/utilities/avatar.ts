import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';
import request from 'request';
import { Emoji } from '@bot/libraries/emoji';
import { Message } from 'discord.js';

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
            request(user.user.avatarURL({ format: 'png', dynamic: true, size: 2048 })!, { encoding: null }, function(err, response, buffer) {
                if (err) return reject(err);
                resolve(buffer);
            });
        });

        // Post a loading message
        let message = await input.channel.send(`${Emoji.LOADING}  Retrieving avatar...`) as Message;

        // Get the buffer
        try {
            input.channel.send({
                file: await promise
            });
            await message.delete();
        }
        catch (err) {
            await message.edit(`${Emoji.ERROR}  Failed to download avatar, try again in a few moments.`);
            message.deleteAfter(6000);
        }
    }
}
