import { Command, Input } from '@api';

const facts = readPublicFile('random/cat-facts.txt').split(/\r?\n/);

export class CatFacts extends Command {
    constructor() {
        super({
            name: 'catfact',
            description: 'Displays a random cat fact.',
            aliases: ["cfact", "catfacts", "catf"]
        });
    }

    async execute(input: Input) {
        let rnd = Math.floor(Math.random() * facts.length);

        await input.channel.send({
            embed:
            {
                color: 3447003,
                title: `**Cat Fact** (#${1 + rnd})`,
                description: facts[rnd]
            }
        });
    }
}
