import { Command, Input, Listener } from '@api';
import { Message } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
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
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        let dirPath = pub('/images/birds/');
        let files = fs.readdirSync(dirPath);
        let buffer = fs.readFileSync(path.join(dirPath, _.sample(files)!));

        message.deleteAfter(0);
        await input.channel.send({ file: buffer });
    };
}

