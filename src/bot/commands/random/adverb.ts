import { Command, Input } from '@api';

const adverbs = readPublicFile('random/adverbs.txt').split(/\r?\n/);

export class Adverb extends Command {
    constructor() {
        super({
            name: 'adverb',
            description: 'Displays a random adverb.'
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * adverbs.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Adverb** (#${1 + rnd})`,
                description: adverbs[rnd]
            }
        });
    }
}
