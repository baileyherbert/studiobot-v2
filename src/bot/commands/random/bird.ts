import { Command, Input } from '@api';
import * as fs from 'fs';
import * as path from 'path';

export class Bird extends Command {
    constructor() {
        super({
            name: 'bird',
            description: 'Displays a random image of a bird.',
            aliases: ["birb"]
        });
    }

    async execute(input: Input) {
        let dirPath = pub('/images/birds/');
        let files = fs.readdirSync(dirPath);
        let buffer = fs.readFileSync(path.join(dirPath, _.sample(files)!));

        await input.channel.send({ file: buffer });
    };
}

