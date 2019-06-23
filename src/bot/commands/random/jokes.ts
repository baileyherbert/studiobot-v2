import { Command, Input } from '@api';

const jokes = readPublicFile('random/jokes.txt').split(/\r?\n/);

export class Jokes extends Command{
    constructor() {
        super({
            name: 'joke',
            aliases: ['jokes'],
            description: 'Outputs a list of jokes from a list of arrrays'
        });

    }

    async execute(input: Input){
        let rnd = Math.floor(Math.random() * jokes.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Joke** (#${1 + rnd})`,
                description: jokes[rnd]
            }
        });
    }
}
