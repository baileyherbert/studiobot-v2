import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Emoji } from '@bot/libraries/emoji';
import { Message } from 'discord.js';
import { RichEmbed } from 'discord.js';

export class UrbanDictionary extends Command {
    constructor() {
        super({
            name: 'urban',
            description: 'Looks up a definition from Urban Dictionary.',
            arguments: [
                {
                    name: 'query',
                    description: 'Word or phrase to search.',
                    expand: true,
                    required: true
                }
            ]
        });
    }

    async execute(input : Input){
        let query = input.getArgument('query') as string;
        let encoded = encodeURI(query);

        let loader = await input.channel.send(`${Emoji.LOADING}  Fetching definition...`) as Message;

        request(`http://api.urbandictionary.com/v0/define?term=${encoded}`, async (err, response, body) => {
            let parsed = JSON.parse(body);
            let items = parsed.list;

            if (items.length > 0) {
                let first = items[0];
                let definition = first.definition.replace(/\[([\w\s\d\.\-\']+)\]/g, '$1') as string;
                let example = first.example;
                let rating = Math.floor(0.5 + (100 * (first.thumbs_up / (first.thumbs_up + first.thumbs_down))));
                let fields = [];

                if (/[a-zA-Z0-9]$/.test(definition)) {
                    definition += '.';
                }

                if (example) {
                    fields.push({
                        name: '**Example**',
                        value: example.replace(/\[([\w\d\s\.\-\']+)\]/g, '$1')
                    });
                }

                if (loader.deletable) {
                    await loader.delete();
                }

                await input.channel.send(new RichEmbed({
                    title: `Definition of ${query.capitalize()}`,
                    description: definition.capitalize(),
                    url: `https://www.urbandictionary.com/define.php?term=${encoded}`,
                    color: 0x4f545c,
                    fields
                }));
            }
            else {
                if (loader.deletable) {
                    await loader.delete();
                }

                await input.channel.send(`${Emoji.ERROR}  No definitions found.`);
            }
        });
    }
}
