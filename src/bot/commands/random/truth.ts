import { Command, Input } from '@api';

const truth = readPublicFile('random/truth.txt').split(/\r?\n/);

export class truthClass extends Command {
    constructor(){
        super({
            name: 'truth',
            description: 'Returns a random truth question'
        });
    }

    async execute(input: Input){
        let index = _.random(0, truth.length - 1);
        let line = truth[index];

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Truth** (#${1 + index})`,
                description: line
            }
        });
    }
}
