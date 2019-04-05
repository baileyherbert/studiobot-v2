import { Command, Input, Listener } from '@api';
import { Message } from 'discord.js';
import * as fs from 'fs';
import { Emoji } from '@bot/libraries/emoji';

export class Bird extends Command {
    constructor() {
        super({
            name: 'bird',
            description: 'Displays a random image of a bird.',
            aliases: ["birb"]
        });
    }

    async execute(input: Input) {
       
        let dirPath = fs.readdirSync(pub('/images/birds'));
        let rndImage = Math.floor(Math.random() * dirPath.length);
        let buffer = fs.readFileSync(dirPath[rndImage]);
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        await input.channel.send({ file: [await buffer] });

        message.delete();
    };
}

