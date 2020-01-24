import { Command, Input } from '@api';
import request from 'request';
import { Emoji } from '@bot/libraries/emoji';
import { MessageEmbed } from 'discord.js';

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

        request(`http://api.urbandictionary.com/v0/define?term=${encoded}`, async (err, response, body) => {
            let parsed = JSON.parse(body);
            let items = parsed.list;

            if (items.length > 0) {
                let first = items[0];
                let definition = first.definition.replace(/\[([\w\s\d\.\-\']+)\]/g, '$1') as string;

                // Ensure the definition ends with a period
                if (/[a-zA-Z0-9]$/.test(definition)) definition += '.';

                // Ensure the definition does not exceed 2048 characters
                definition = _.truncate(definition.capitalize(), {
                    length: 2048,
                    omission: ' ...',
                    separator: ' '
                });

                // Send embed
                await input.channel.send(new MessageEmbed({
                    title: `${query.capitalize()}`,
                    author: {
                        icon_url: 'https://firebounty.com/image/635-urban-dictionary',
                        name: 'Urban Dictionary'
                    },
                    description: definition.capitalize(),
                    url: `https://www.urbandictionary.com/define.php?term=${encoded}`,
                    color: 0xf25a2c
                }));
            }
            else {
                await input.channel.send(`${Emoji.ERROR}  No definitions found.`);
            }
        });
    }
}
