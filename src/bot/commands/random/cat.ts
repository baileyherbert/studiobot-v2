import { Command, Input } from '@api';
import * as request from 'request';

export class cat extends Command {
    constructor() {
        super({
            name: 'cat',
            description: 'Displays a random image of a cat.',
            aliases: ["neko", "nekko", "kitty", "feline"]
        });
    }

    async execute(input: Input) {
        let url = 'https://api.thecatapi.com/v1/images/search';

        request(url, async (err, response, body) => {
            if (err) return;

            await input.channel.send({
                embed: {
                    color: 3447003,
                    image:
                    {
                        url: (<ApiResponse>JSON.parse(body))[0].url
                    }
                }
            });
        });
    }
}

type ApiResponse = {
    breeds: string[];
    id: string;
    url: string;
}[];
