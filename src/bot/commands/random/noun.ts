import { Command, Input } from '@api';

const nouns = readPublicFile('random/nouns.txt').split(/\r?\n/);

export class Noun extends Command {
    constructor() {
        super({
            name: 'noun',
            description: 'Displays a random noun.'
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * nouns.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Noun** (#${1 + rnd})`,
                description: nouns[rnd]
            }
        });

    }
}
