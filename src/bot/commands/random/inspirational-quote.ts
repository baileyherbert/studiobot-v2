import { Command, Input } from '@api';

const quotes = readPublicFile('random/inspirational-quotes.txt').split(/\r?\n/);

export class InspirationalQuote extends Command {
    constructor() {
        super({
            name: 'inspiration',
            aliases: ['inspire', 'inspirational'],
            description: 'Displays a random inspirational quote.'
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * quotes.length);
        let line = quotes[rnd];

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Inspiration** (#${1 + rnd})`,
                description: line
            }
        });
    }
}
