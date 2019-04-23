import { Command, Input } from '@api';
import { ImagePack } from '@libraries/image-pack';

const pack = new ImagePack('cats');

export class cat extends Command {
    constructor() {
        super({
            name: 'cat',
            description: 'Displays a random image of a cat.',
            aliases: ["neko", "nekko", "kitty", "feline"]
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

type ApiResponse = {
    breeds: string[];
    id: string;
    url: string;
}[];
