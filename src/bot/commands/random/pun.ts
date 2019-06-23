import { Command, Input } from '@api';

const puns = readPublicFile('random/puns.txt').split(/\r?\n/);

export class Pun extends Command {
    constructor() {
        super({
            name: 'pun',
            description: 'Displays a random pun.'
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * puns.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Pun** (#${1 + rnd})`,
                description: puns[rnd]
            }
        });
    }
}
