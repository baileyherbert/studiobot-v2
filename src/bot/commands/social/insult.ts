import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';

const insults = readPublicFile('random/insults.txt').split(/\r?\n/);

export class Insult extends Command {
    constructor(){
        super({
            name: 'insult',
            aliases: ['mean'],
            description: 'Insult someone.',
            arguments: [
                {
                    name: 'user',
                    description: 'The scumbag to insult!!!!',
                    constraint: 'mention',
                    required: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let user : GuildMember = input.getArgument('user') as GuildMember;
        let insult = _.sample(insults);

        await input.channel.send(`${user}${insult}`);
    }
}
