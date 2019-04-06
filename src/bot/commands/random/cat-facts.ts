import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
const entities = require("html-entities").AllHtmlEntities;

export class CatFacts extends Command {
    constructor() {
        super({
            name: 'catfact',
            description: 'Displays a random cat fact.',
            aliases: ["cfact", "catfacts", "catf"]
        });
    }

    async execute(input: Input) {
        let url = 'https://catfact.ninja/fact?max_length=2000';
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching fact...`) as Message;

        //Fetch from API
        request(url, async (err, response, body) => {
            //Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get fact, try again later.`);
                return;
            }

            //Parse the body
            let parsed = (<ApiResponse>JSON.parse(body));

            // Delete the loading message
            message.deleteAfter(0);

            await input.channel.send({
                embed: {
                    color: 3447003,
                    title: 'Cat Fact',
                    description: parsed.fact
                }
            });
        });
    }
}

type ApiResponse = {
    fact: string,
    length: number;
};
