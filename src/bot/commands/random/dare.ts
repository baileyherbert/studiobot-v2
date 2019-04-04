import {Command, Input} from '@api';

const dare = readPublicFile('random/Dare.txt').split(/\r?\n\r?\n/);

export class dareClass extends Command {
    constructor(){
        super({
            name: 'dare',
            description: 'Returns a random Dare question'
        });
    }

    async execute(input: Input){
        let index = _.random(0, dare.length - 1);
        let line = dare[index];

        await input.channel.send('```\n' + line + '\n```');
    }
}