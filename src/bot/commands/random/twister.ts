import { Command, Input } from '@api';

const twisters = readPublicFile('random/twisters.txt').split(/\r?\n/);

export class TongueTwister extends Command {
    constructor() {
        super({
            name: 'tonguetwister',
            aliases: ['twister', 'tongue'],
            description: 'Returns a random tongue twister.'
        });
    }

    execute(input: Input) {
        let rnd = Math.floor(Math.random() * twisters.length);

        input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Tongue twister** (#${1 + rnd})`,
                description: twisters[rnd]
            }
        });
    }
}
