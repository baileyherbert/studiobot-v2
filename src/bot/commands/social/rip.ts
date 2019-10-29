import { Command, Input } from '@api';
import { GuildMember} from 'discord.js';
import Jimp from 'jimp';
import * as FS from 'fs';

export class Rip extends Command {
    constructor(){
        super({
            name: 'rip',
            aliases: ['ripe', 'rest_in_spaghetti'],
            description: 'Erect tombstone for fallen guild members.',
            arguments: [{
                name: 'user',
                description: 'the fallen one',
                constraint: 'mention',
                required: true
            }]
        });
    }

    async execute(input: Input){
        let fallen = input.getArgument('user') as GuildMember;

        //Unused for now
        let textColor : string = '0x666666ff';
        let textFont : string = Jimp.FONT_SANS_32_BLACK;
        let subTextFont : string = Jimp.FONT_SANS_16_BLACK;

        let outputText : string = ':skull: F'
        let maximumAge = 100;

        let image : Jimp = await Jimp.read(pub('images/gravestone.jpg')) as Jimp;
        let font = await Jimp.loadFont(textFont);
        let subFont = await Jimp.loadFont(subTextFont);
        let currentYear = new Date().getFullYear();
        let birthYear = fallen.settings.birthYear || _.random(currentYear - maximumAge, currentYear);

        // Save the birth year persistently
        if (!fallen.settings.birthYear) {
            fallen.settings.birthYear = birthYear;
            fallen.settings.save();
        }

        //For whatever reason \n isn't recognized when using Jimp's print function.
        this.AddTextToImage(image, font, `${fallen.displayName}`, 32, -52);
        this.AddTextToImage(image, subFont, `${birthYear} - ${currentYear}`, 16, -6);

        // Send the image
        input.channel.send(outputText, {
            files: [await image.getBufferAsync(Jimp.MIME_JPEG)]
        });
    }

    private AddTextToImage(image: Jimp, font: any, fallen: string, height: number, offset: number) {
        image.print(font, 0, (image.getHeight() / 2) + offset, {
            text: fallen,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, image.getWidth(), height);
    }

    private ApplyTintToMessage(image: Jimp, tintColor: string, tintIntensity: number) {
        image = image.color([
            { apply: 'mix', params: [tintColor, tintIntensity] }
        ]);
        return image;
    }
}
