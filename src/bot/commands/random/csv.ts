import { Command, Input } from '@api';

export class CSV extends Command {
    constructor() {
        super({
            name: 'csv',
            aliases: ['pick', 'choose'],
            description: 'Picks one or more random entries from the given comma-separated list.',
            arguments: [
                {
                    name: 'amount',
                    description: 'Amount of entries to retrieve.',
                    constraint: 'number',
                    default: 1
                },
                {
                    name: 'list',
                    description: 'List of entries separated by commas.',
                    expand: true,
                    required: true,
                    eval: (input : string) => input.indexOf(',') > 0
                }
            ]
        });
    }

    async execute(input: Input) {
        let list = input.getArgument('list') as string;
        let amount = input.getArgument('amount') as number;
        let entries = list.split(/\s*,+\s*/);
        let elements = [];


        //Display the selected amount of list items
        if (amount > 0) {
            for (let i = 0; i < amount; i++) {
                elements[i] = entries[Math.floor(Math.random() * entries.length)];
            }

            await input.channel.send(elements.join(', '));
        }
    }
}
