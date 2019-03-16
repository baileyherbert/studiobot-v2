import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
const entities = require("html-entities").AllHtmlEntities;

export class cat extends Command {
    constructor() {
        super({
            name: 'cat',
            description: 'Displays a random image of a cat.',
            aliases: ["neko"]
        });
    }

    async execute(input: Input) {
        
        let url = 'https://api.thecatapi.com/v1/images/search';
        let apiKey = "8e60cd3d-fbf9-45b9-b1d2-d28b62ddf279";

        var headers = {
            'X-API-KEY': apiKey,
        }

        console.log(url);
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        //Fetch from API
        request(url, async (err, {headers}, body) => {
            //Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get image, try again later.`);
                return;
            }

            console.log(body);

            //Parse the body
            let parsed = (<ApiResponse>JSON.parse(body))[0];

            console.log(parsed.url);
            // Delete the loading message
            try { await message.delete(); } catch(err) {}

            input.channel.send({
                embed: {
                    color: 3447003,
                    image:
                    {
                        url: parsed.url
                    }
            }
            });

        });
    }
}

type ApiResponse = {
    breeds: string[];
    id: string;
    url: Url;
    
}[];
