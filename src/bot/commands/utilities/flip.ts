import { Command, Input } from '@api';

const characters : {[original: string]: string} = {
    'a': 'ɐ',
    'b': 'q',
    'c': 'ɔ',
    'd': 'p',
    'e': 'ǝ',
    'f': 'ɟ',
    'g': 'ƃ',
    'h': 'ɥ',
    'i': 'ᴉ',
    'j': 'ɾ',
    'k': 'ʞ',
    'l': 'l',
    'm': 'ɯ',
    'n': 'u',
    'o': 'o',
    'p': 'd',
    'q': 'b',
    'r': 'ɹ',
    's': 's',
    't': 'ʇ',
    'u': 'n',
    'v': 'ʌ',
    'w': 'ʍ',
    'x': 'x',
    'y': 'ʎ',
    'z': 'z',
    'A': '∀',
    'B': 'q',
    'C': 'Ɔ',
    'D': 'p',
    'E': 'Ǝ',
    'F': 'Ⅎ',
    'G': 'פ',
    'H': 'H',
    'I': 'I',
    'J': 'ſ',
    'K': 'ʞ',
    'L': '˥',
    'M': 'W',
    'N': 'N',
    'O': 'O',
    'P': 'Ԁ',
    'Q': 'Q',
    'R': 'ɹ',
    'S': 'S',
    'T': '┴',
    'U': '∩',
    'V': 'Λ',
    'W': 'M',
    'X': 'X',
    'Y': '⅄',
    'Z': 'Z',
    '0': '0',
    '1': 'Ɩ',
    '2': 'ᄅ',
    '3': 'Ɛ',
    '4': 'ㄣ',
    '5': 'ϛ',
    '6': '9',
    '7': 'ㄥ',
    '8': '8',
    '9': '6',
    '.': '˙',
    ',': '\'',
    '!': '¡',
    '&': '⅋',
    '_': '‾',
    '?': '¿',
    '`': ',',
    '[': ']',
    '>': '<',
    '{': '}',
    '(': ')',
    '/': '\\'
};

export class Flip extends Command {
    constructor() {
        super({
            name: 'flip',
            description: 'Flips the given text upside down.',
            arguments: [
                {
                    name: 'text',
                    expand: true,
                    required: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let text = input.getArgument('text') as string;
        let output = '';

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            let backwards = Object.keys(characters).filter(i => characters[i].equals(char));

            if (char in characters) output += characters[char];
            else if (backwards.length > 0) output += backwards[0];
            else output += char;
        }

        await input.channel.send(output);
    }
}
