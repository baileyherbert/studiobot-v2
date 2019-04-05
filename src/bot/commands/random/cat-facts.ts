import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
const entities = require("html-entities").AllHtmlEntities;

export class CatFact extends Command {
    constructor() {
        super({
            name: 'catfact',
            description: 'Displays a random cat fact.',
            aliases: ["cfact", "felinefact"]
        });
    }

    async execute(input: Input) {
        
        let url = 'https://catfact.ninja/fact?max_length=2000';

        console.log(url);
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        //Fetch from API
        request(url, async (err, {headers}, body) => {
            //Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get fact, try again later.`);
                return;
            }

            console.log(body);

            //Parse the body
            let parsed = (<ApiResponse>JSON.parse(body));

            console.log(parsed.fact);

            // Delete the loading message
            try { await message.delete(); } catch(err) {}

            input.channel.send({
                embed: {
                    color: 3447003,
                    Title: parsed.fact
            }
            });

        });
    }
}

type ApiResponse = {
    fact: string;
    length: number
};
