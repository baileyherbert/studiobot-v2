import { Command, Input } from '@api';
import { ImagePack } from '@libraries/image-pack';

const pack = new ImagePack('dogs');

export class Dog extends Command {
    constructor() {
        super({
            name: 'dog',
            description: 'Displays a random image of a dog.',
            aliases: ['puppy', 'pup', 'dogs']
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
    }
}
