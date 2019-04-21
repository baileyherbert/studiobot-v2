import { Command, Input } from '@api';

export class Conflip extends Command {
    constructor() {
        super({
            name: 'coinflip',
            aliases: ['flip', 'coin'],
            description: 'Throws a coin that will land on either heads or tails.'
        });
    }

    async execute(input: Input) {
        let face = _.sample(['heads', 'tails']);
        await input.channel.send(`Landed on ${face}.`);
    }
}
