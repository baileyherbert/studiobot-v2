import { Command, Input } from '@api';

export class Roll extends Command {
    constructor() {
        super({
            name: 'roll',
            description: 'Rolls a six-sided dice.',
            arguments: [
                {
                    name: 'sides',
                    description: 'The number of sides to roll.',
                    constraint: 'number',
                    default: 6,
                    eval: (input: number) => input >= 3 && input <= 1000
                }
            ]
        });
    }

    async execute(input: Input) {
        let sides = input.getArgument('sides') as number;
        let roll = _.random(1, sides);

        await input.channel.send(`:game_die:  Rolled **${roll}**.`);
    }
}
