import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import * as fs from 'fs';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
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
        fs.readFileSync("public/images/birds");
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

