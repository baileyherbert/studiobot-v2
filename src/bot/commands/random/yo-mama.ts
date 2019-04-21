import { Command, Input } from '@api';

const yoMama = readPublicFile('random/yo-mama.txt').split(/\r?\n/);

export class Noun extends Command {
    constructor() {
        super({
            name: 'yomama',
            aliases: ['yomomma', 'yomamma', 'yomoma', 'yomom'], 
            description: `Displays a random Yo' Mama joke.`
        });
    }

    execute(input: Input) {
        let rnd = Math.floor(Math.random() * yoMama.length);

        input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Yo' Mama Joke** (#${1 + rnd})`,
                description: yoMama[rnd]
            }
        });

    }
}
