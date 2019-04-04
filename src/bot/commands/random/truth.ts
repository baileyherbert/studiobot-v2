import {Command, Input} from '@api';

const truth = readPublicFile('random/Truth.txt').split(/\r?\n\r?\n/);

export class truthClass extends Command {
    constructor(){
        super({
            name: 'truth',
            description: 'Returns a random Truth question'
        });
    }

    async execute(input: Input){
        let index = _.random(0, truth.length - 1);
        let line = truth[index];

        await input.channel.send('```\n' + line + '\n```');
    }
}