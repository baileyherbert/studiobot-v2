import { Command, Input } from '@api';
import { Emoji } from '@libraries/emoji';

export class Between extends Command {
    constructor() {
        super({
            name: 'between',
            description: 'Generates a random number between `x` and `y`, `Min: 0` `Max: 1000` ',
            arguments: [
                {
                    name: 'x',
                    description: 'The minimum value.',
                    constraint: 'number',
                    required: true,
                    eval: (input: number) => {
                        if (input < 0) {
                            throw new Error('`x` must be 0 or greater.');
                        }
                        return true;
                    }
                },
                {
                    name: 'y',
                    description: 'The maximum value.',
                    constraint: 'number',
                    required: true,
                    eval: (input: number) => {
                        if (input > 1000) {
                            throw new Error('`y` must be 1000 or less.');
                        }
                        return true;
                    }
                }
            ]
        });
    }

    async execute(input: Input) {
        let x = input.getArgument('x') as number;
        let y = input.getArgument('y') as number;

        if (x > y) {
            await input.channel.send(Emoji.ERROR + " `x` cannot be greater than `y`: `between <x> <y>`");
        }
        else {
            let rnd = Math.floor((Math.random() * y) + x);
            await input.channel.send(rnd);
        }
    }
}
