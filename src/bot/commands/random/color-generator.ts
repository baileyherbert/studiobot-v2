import { Command, Input } from '@api';
import { Emoji } from '@bot/libraries/emoji';
import { RichEmbed } from 'discord.js';

export class Color extends Command {
    constructor() {
        super({
            name: 'color',
            description: 'Generates a random color, or provides information about the provided color',
            arguments: [
                {
                    name: 'color',
                    expand: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let color = input.getArgument('color') as string;

        try {
            let { r, g, b } = this.parse(color);
            let hex = this.hex(r, g, b);
            let url = `https://temp.bailey.sh/${r}/${g}/${b}/image.jpg`;

            await input.channel.send(new RichEmbed({
                author: {
                    name: hex,
                    icon_url: url
                },
                color: parseInt(hex.substring(1), 16)
            }));
        }
        catch (err) {
            await input.channel.send(`${Emoji.ERROR}  ${err.message}`);
        }
    }

    private parse(input: string) : {r:number, g:number, b:number} {
        let r : number = 0, g : number = 0, b : number = 0;
        let rgbExp = /(\d{0,3})[\s;,]+(\d{0,3})[\s;,]+(\d{0,3})/;

        if (!input) {
            return {
                r: _.random(0, 255),
                g: _.random(0, 255),
                b: _.random(0, 255)
            };
        }

        // Remove hashtag in beginning
        if (input.startsWith('#')) {
            input = input.substring(1);
        }

        // Parse three digit hex
        if (input.length == 3) {
            let parsed = input.split('');
            r = parseInt(parsed[0].repeat(2), 16);
            g = parseInt(parsed[1].repeat(2), 16);
            b = parseInt(parsed[2].repeat(2), 16);
        }

        // Parse six digit hexadecimal
        else if (input.length == 6) {
            r = parseInt(input.substring(0, 2), 16);
            g = parseInt(input.substring(2, 4), 16);
            b = parseInt(input.substring(4, 6), 16);
        }

        // Parse rgb
        else if (rgbExp.test(input)) {
            let matches = input.match(rgbExp) as any[];
            r = parseInt(matches[1]);
            g = parseInt(matches[2]);
            b = parseInt(matches[3]);
        }

        else {
            throw new Error('Invalid format');
        }

        // Handle errors
        if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('Invalid color');
        if (r < 0 || g < 0 || b < 0) throw new Error('Invalid color');
        if (r > 255 || g > 255 || b > 255) throw new Error('Invalid color');

        return { r: r, g: g, b: b };
    }

    private hex(r: number, g: number, b: number) {
        let str = '#';

        _.each([
            r.toString(16),
            g.toString(16),
            b.toString(16)
        ], hx => {
            if (hx.length == 1) hx = '0' + hx;
            str += hx.toUpperCase();
        });

        return str;
    }
}