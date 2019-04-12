import { Command, Input, Listener } from '@api';
import { Emoji } from '@bot/libraries/emoji';
const aki = require('aki-api');
const entities = require("html-entities").AllHtmlEntities;

let regions : string[] = [
    'en',
    'en2',
    'ar',
    'cn',
    'de',
    'es',
    'fr',
    'il',
    'it',
    'jp',
    'kr',
    'nl',
    'pl',
    'pt',
    'ru',
    'tr'
];

export class Akinator extends Command {
    constructor() {
        super({
            name: 'akinator',
            description: 'Starts the akinator game.',
            aliases: ['aki'],
            arguments: [
                {
                    name: 'start',
                    description: 'The type of dog to get an image of.',
                    options: [],
                    error: true,
                    default: '',
                }
            ]
        });
    }

    async execute(input: Input) {

        const data = await aki.start(regions[0]);

        //Fetch from API
        aki.start(regions[0], async (resolve, error) => {
            //Handle HTTP errors
            if(error) {
                await input.channel.send(`${Emoji.ERROR}  Failed to get response, try again later.`);
                console.log(error);
                return;
            }
            else {
                console.log(resolve);
            }

            input.channel.send({
                embed: {
                    color: 3447003,
                    image:
                    {
                        url: ''
                    }
                }
            });
        });
    }
}

type ApiResponse = {  

 };
