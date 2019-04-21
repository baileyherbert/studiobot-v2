import { Command, Input } from '@api';

export class Invite extends Command {
    constructor() {
        super({
            name: 'invite',
            description: 'Returns a link to invite the bot to another server.'
        });
    }

    async execute(input: Input) {
        await input.channel.send(
            `:love_letter:  You can add me to another server with the following link!\n` +
            '<https://discordapp.com/api/oauth2/authorize?client_id=538379661902872587&permissions=1610083414&scope=bot>'
        );
    }
}
