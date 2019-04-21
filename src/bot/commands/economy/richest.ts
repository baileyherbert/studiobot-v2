import { Command, Input } from '@api';
import { Economy } from '@bot/libraries/economy';
const Table = require('easy-utf8-table');

export class Richest extends Command {
    constructor() {
        super({
            name: 'richest',
            description: 'Returns a list of the top richest members of the server.',
            arguments: [
                {
                    name: 'limit',
                    description: 'The maximum number of entries to display (min: 5 max: 25).',
                    constraint: 'number',
                    default: 10,
                    error: true,
                    eval: (input: number) => input >= 5 && input <= 25
                }
            ]
        });
    }

    async execute(input: Input) {
        let limit = input.getArgument('limit') as number;
        let rows = await Economy.getAllBalances(input.guild);
        let display = _.slice(rows, 0, limit);

        let table = new Table();

        display.forEach((row, i) => {
            table.cell('#', i + 1);
            table.cell('Member', row.member.displayName);
            table.cell('Balance', `$${row.balance.toFixed(2)}`);
            table.newRow();
        });

        input.channel.send('```\n' + table + '\n```');
    }
}
