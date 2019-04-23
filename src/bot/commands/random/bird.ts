import { Command, Input } from '@api';
import { ImagePack } from '@libraries/image-pack';

const pack = new ImagePack('birds');

export class Bird extends Command {
    constructor() {
        super({
            name: 'bird',
            description: 'Displays a random image of a bird.',
            aliases: ["birb"]
        });
    }

    async init() {
        if (!pack.isInstalled()) {
            pack.install();
        }
    }

    async execute(input: Input) {
        await input.channel.send('', {
            files: [pack.getRandomBuffer()]
        });
    };
}

