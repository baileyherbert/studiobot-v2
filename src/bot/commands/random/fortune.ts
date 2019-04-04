import { Command, Input } from '@api';

const fortunes = readPublicFile('random/fortunes.txt').split(/\r?\n/);

export class Fortune extends Command {
    constructor() {
        super({
            name: 'fortune',
            description: 'Displays a random fortune cookie message.'
        });
    }

    execute(input: Input) {
        let rnd = Math.floor(Math.random() * fortunes.length);

        input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Fortune cookie** (#${1 + rnd})`,
                description: fortunes[rnd]
            }
        });
    }
}
