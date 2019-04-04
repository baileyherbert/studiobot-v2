import { Command, Input, Listener } from '@api';

export class Reverse extends Command {
    constructor() {
        super({
            name: 'reverse',
            description: 'Reverses the given text.',
            arguments: [
                {
                    name: 'text',
                    description: 'The text to reverse.',
                    expand: true,
                    required: true,
                }
            ]
        });
    }
    
    async execute(input : Input){
        let text = input.getArgument('text') as string;
        let reversed = text.split('').reverse().join('');

        input.channel.send(reversed)
    }
}
