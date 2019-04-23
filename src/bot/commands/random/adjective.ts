import { Command, Input } from '@api';

const adjectives = readPublicFile('random/adjectives.txt').split(/\r?\n/);

export class Adjective extends Command {
    constructor() {
        super({
            name: 'adjective',
            description: 'Displays a random adjective.'
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * adjectives.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Adjective** (#${1 + rnd})`,
                description: adjectives[rnd]
            }
        });
    }
}
