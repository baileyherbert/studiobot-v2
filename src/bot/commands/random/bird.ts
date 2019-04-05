import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import * as fs from 'fs';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
import { pathMatch } from 'tough-cookie';
const entities = require("html-entities").AllHtmlEntities;

export class Bird extends Command {
    constructor() {
        super({
            name: 'bird',
            description: 'Displays a random image of a bird.',
            aliases: ["birb"]
        });
    }

    async execute(input: Input) {
        let dirPath : string = '/public/images/birds';
        let images = fs.readdir(dirPath, 'binary', (err, files) => {
            if(err){
                console.log(files.join)
            }
        });
        let rnd = Math.floor(Math.random() * images.length);


        fs.readFile(dirPath, "binary" );
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        input.channel.send({
            embed: {
                color: 3447003,
                image:
                {

                }
            }
        });

    };
}

