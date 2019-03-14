import { Command, Input } from '@api';

const lenny = readPublicFile('random/lenny.txt').split(/\r?\n/);

export class Lenny extends Command {
    constructor() {
        super({
            name: 'lenny',
            description: 'Displays a random lenny face.'
        });
    }

    execute(input: Input) {
        let rnd = Math.floor(Math.random() * lenny.length);

        input.channel.send((lenny[rnd]);

    }
}
