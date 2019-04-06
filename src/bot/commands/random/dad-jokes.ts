import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
import { monitorEventLoopDelay } from 'perf_hooks';
import { CookieJar } from 'tough-cookie';
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
        let headers = {
            'Accept': 'application/json',
            'User-Agent': 'Ember bot'
            //'X-API-KEY': apiKey,
        }

        //Fetch from API
        request({url, headers}, async (err, response, body) => {
            // Handle HTTP errors
            if (err) {
                this.getLogger().error(err);
                await message.edit(`${Emoji.ERROR}  Failed to get image, try again later.`);
                return;
            }

            // Parse the body
            let parsed = (<ApiResponse>JSON.parse(body));

            console.log(parsed.joke);
            console.log(parsed.id);

            // Delete the message if it can be deleted
            message.deleteAfter(0);

            // Send joke
            await input.channel.send({
                embed: {
                    color: 3447003,
                    title: `**Dad Joke**` ,
                    description: parsed.joke
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
