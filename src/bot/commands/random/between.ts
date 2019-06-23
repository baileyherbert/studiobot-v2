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
                        if (input < -2147483648) throw new Error('The minimum value for `x` is -2147483648.');
                        if (input > 2147483647) throw new Error('The maximum value for `x` is 2147483647.');

                        return true;
                    }
                },
                {
                    name: 'y',
                    description: 'The maximum value.',
                    constraint: 'number',
                    required: true,
                    eval: (input: number) => {
                        if (input > 2147483647) throw new Error('The maximum value for `y` is 2147483647.');
                        if (input < -2147483648) throw new Error('The minimum value for `y` is -2147483648.');

                        return true;
                    }
                }
            ]
        });
    }

    async execute(input: Input) {
        let x = input.getArgument('x') as number;
        let y = input.getArgument('y') as number;

        // If x is greater than y, then swap them so x is always the lesser value
        if (x > y) {
            let tmp = x;
            x = y;
            y = tmp;
        }

        // Generate the random number
        let number : any = _.random(x, y);
        let precision = this.calculatePrecision(x, y);

        // If the user entered numbers with decimals, match the precision
        if (precision > 0) {
            number = (number as number).toFixed(precision);
        }

        // Send the random number
        await input.channel.send(number);
    }

    protected calculatePrecision(x: number, y: number) {
        let precision = 0;

        // Check decimal precision in `x`
        let matchesX = /^\d*\.(\d+)$/.exec(x.toString());
        if (matchesX && matchesX[1].length > precision) precision = matchesX[1].length;

        // Check decimal precision in `y`
        let matchesY = /^\d*\.(\d+)$/.exec(y.toString());
        if (matchesY && matchesY[1].length > precision) precision = matchesY[1].length;

        // Limit the precision to four decimals
        if (precision > 4) precision = 4;

        return precision;
    }
}
