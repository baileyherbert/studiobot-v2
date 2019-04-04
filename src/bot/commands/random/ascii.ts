import { Command, Input } from '@api';

const ascii = readPublicFile('random/ascii.txt').split(/\r?\n\r?\n/);

export class asciiArt extends Command {
    constructor() {
        super({
            name: 'ascii',
            description: 'Returns a random ASCII art from the text file.'
        });
    }
    
    async execute(input: Input) {
        let index = _.random(0, ascii.length - 1);
        let line = ascii[index];

        await input.channel.send('```\n' + line + '\n```'); 
    }
}
