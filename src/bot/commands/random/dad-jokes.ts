import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
const entities = require("html-entities").AllHtmlEntities;

export class DadJokes extends Command {
    constructor() {
        super({
            name: 'dadjoke',
            description: 'Displays a random image of a cat.',
            aliases: ["djoke", "djokes", "dadjokes"]
        });
    }

    async execute(input: Input) {
        
        let url = `https://icanhazdadjoke.com/`;

        console.log(url);
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        //Fetch from API
        request(url, async (err, response, body) => {
            //Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get image, try again later.`);
                return;
            }

            console.log(body);

            //Parse the body
            let parsed = (<ApiResponse>JSON.parse(body));

            console.log(parsed.joke);
            console.log(parsed.id);
            // Delete the loading message
            try { await message.delete(); } catch(err) {}

            input.channel.send({
                embed: {
                    color: 3447003,
                    image:
                    {
                        url: `https://icanhazdadjoke.com/j/${parsed.id}.png`
                    }
            }
            });

        });
    }
}

type ApiResponse = {
    id: string;
    joke: string;
    status: number;
    
};
