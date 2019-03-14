import { Command, Input } from '@api';

const lenny = readPublicFile('random/lenny.txt').split(/\r?\n/);

export class Lenny extends Command {
    constructor() {
        super({
            name: 'lenny',
            description: 'Displays a random lenny face.'
        });
    }

    async execute(input: Input) {

        if (_.random(1,5) == 5) {
            await input.channel.send("( ͡° ͜ʖ ͡°)");
            return;
        }

        let rnd = Math.floor(Math.random() * lenny.length);

        input.channel.send(lenny[rnd]);

    }
}
