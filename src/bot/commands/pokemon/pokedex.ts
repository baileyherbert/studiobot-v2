import { Command, Input } from '@api';
import { Emoji } from '@bot/libraries/emoji';
import * as request from 'request';
import { Response } from 'request';

export class Pokedex extends Command {

    constructor() {
        super({
            name: 'pokedex',
            aliases: ['dex', 'pokdex'],
            description: 'Find information about any pokemon!',
            arguments: [
                {
                    name: 'name',
                    description: 'The name of the pokemon to search.',
                    required: true,
                    expand: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let pokemon = input.getArgument('pokemon') as string;
        let url = 'https://pokeapi.co/api/v2/pokemon/';

        let requestURL = request((url + pokemon.toLowerCase()), async (error, response, body) => {
            if (error) {
                return input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve data for that pokemon.`);
            }

            if (response.statusCode != 200) {
                if (response.statusCode == 404) {
                    return input.channel.send(`${Emoji.ERROR}  Cannot find that pokemon.`);
                }

                return console.log('status code', response.statusCode);
            }

            let parsed = JSON.parse(body);

            if (!parsed) return;

            let image = parsed.sprites.front_default;
            let name = parsed.name
            let firstLetter = name.charAt(0).toUpperCase();
            let properName = name.substring(1, name.length);
            let flavorText = await this.getFlavorText(parsed.species.url);
            let type1 = parsed.types[0].type.name.toUpperCase();
            let type2 = '';
            if (parsed.types[1]) {
                type2 = ', ' + parsed.types[1].type.name.toUpperCase();
            }

            input.channel.send({
                embed:
                {
                    color: 3447003,
                    title: 'No. ' + parsed.id + ': ' + firstLetter + properName,
                    description: flavorText,
                    image: {
                        url: image
                    },
                    fields: [
                        {
                            name: 'Type:',
                            value: type1 + type2
                        },
                        {
                            name: 'Height:',
                            value: ((parsed.height*.1).toFixed(2)).toString() + ' Meters'
                        },
                        {
                            name: 'Weight:',
                            value: ((parsed.weight*.1).toFixed(2)).toString() + ' Kilograms'
                        }
                    ]
                }
            });
        });
    }

    private getFlavorText(url: string) : Promise<string> {
        return new Promise(resolve => {
            let requestURL = request((url), (error: any, response: Response, body: any) => {
                let parsed = JSON.parse(body);

                let text = '';

                let count = 0;
                while (true) {
                    if (!parsed.flavor_text_entries[count]) break;
                    if (parsed.flavor_text_entries[count].language.name != 'en') {
                        count++;
                    } else {
                        break;
                    }
                }

                text = (parsed.flavor_text_entries[count].flavor_text);

                resolve(text);
                return;
            });
        });
    }

}
