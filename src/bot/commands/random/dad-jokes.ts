import { Command, Input } from '@api';

const jokes = readPublicFile('random/dad-jokes.txt').split(/\r?\n\r?\n/);

export class DadJokes extends Command {
    constructor() {
        super({
            name: 'dadjoke',
            description: 'Displays a random image of a cat.',
            aliases: ["djoke", "djokes", "dadjokes"]
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * jokes.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Dad Joke** (#${1 + rnd})`,
                description: jokes[rnd]
            }
        });
    }
}
