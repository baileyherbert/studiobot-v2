import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Url } from 'url';
const entities = require("html-entities").AllHtmlEntities;

let breeds: string[] = [
    "affenpinscher",
    "african",
    "airedale",
    "akita",
    "appenzeller",
    "basenji",
    "beagle",
    "bluetick",
    "borzoi",
    "bouvier",
    "boxer",
    "brabancon",
    "briard",
    "bulldog-boston",
    "bulldog-french",
    "bullterrier-staffordshire",
    "cairn",
    "cattledog-australian",
    "chihuahua",
    "chow",
    "clumber",
    "cockapoo",
    "collie-border",
    "coonhound",
    "corgi-cardigan",
    "cotondetulear",
    "dachshund",
    "dalmatian",
    "dane-great",
    "deerhound-scottish",
    "dhole",
    "dingo",
    "doberman",
    "elkhound-norwegian",
    "entlebucher",
    "eskimo",
    "frise-bichon",
    "germanshepherd",
    "greyhound-italian",
    "groenendael",
    "hound-afghan",
    "hound-basset",
    "hound-blood",
    "hound-english",
    "hound-ibizan",
    "hound-walker",
    "husky",
    "keeshond",
    "kelpie",
    "komondor",
    "kuvasz",
    "labrador",
    "leonberg",
    "lhasa",
    "malamute",
    "malinois",
    "maltese",
    "mastiff-bull",
    "mastiff-english",
    "mastiff-tibetan",
    "mexicanhairless",
    "mix",
    "mountain-bernese",
    "mountain-swiss",
    "newfoundland",
    "otterhound",
    "papillon",
    "pekinese",
    "pembroke",
    "pinscher-miniature",
    "pointer-german",
    "pointer-germanlonghair",
    "pomeranian",
    "poodle-miniature",
    "poodle-standard",
    "poodle-toy",
    "pug",
    "puggle",
    "pyrenees",
    "redbone",
    "retriever-chesapeake",
    "retriever-curly",
    "retriever-flatcoated",
    "retriever-golden",
    "ridgeback-rhodesian",
    "rottweiler",
    "saluki",
    "samoyed",
    "schipperke",
    "schnauzer-giant",
    "schnauzer-miniature",
    "setter-english",
    "setter-gordon",
    "setter-irish",
    "sheepdog-english",
    "sheepdog-shetland",
    "shiba",
    "shihtzu",
    "spaniel-blenheim",
    "spaniel-brittany",
    "spaniel-cocker",
    "spaniel-irish",
    "spaniel-japanese",
    "spaniel-sussex",
    "spaniel-welsh",
    "springer-english",
    "stbernard",
    "terrier-american",
    "terrier-australian",
    "terrier-bedlington",
    "terrier-border",
    "terrier-dandie",
    "terrier-fox",
    "terrier-irish",
    "terrier-kerryblue",
    "terrier-lakeland",
    "terrier-norfolk",
    "terrier-norwich",
    "terrier-patterdale",
    "terrier-russell",
    "terrier-scottish",
    "terrier-sealyham",
    "terrier-silky",
    "terrier-tibetan",
    "terrier-toy",
    "terrier-westhighland",
    "terrier-wheaten",
    "terrier-yorkshire",
    "vizsla",
    "weimaraner",
    "whippet",
    "wolfhound-irish"
]

export class Dog extends Command {
    constructor() {
        super({
            name: 'dog',
            description: 'Displays a random image of a dog.',
            arguments: [
                {
                    name: 'breed',
                    description: 'The type of dog to get an image of.',
                    options: breeds,
                    error: true,
                    default: '',
                }
            ]
        });
    }

    async execute(input: Input) {
        let breed = input.getArgument('breed') as string;
        let breedUrl = 'https://dog.ceo/api/breed';
        let cuteUrl = 'https://some-random-api.ml/img/dog';
        let url : string;
        if(breed == '') {
            url = cuteUrl;
        }
        else{
            url = `${breedUrl}/${encodeURIComponent(breed)}/images/random`;
        }

        console.log(url);
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching image...`) as Message;

        //Fetch from API
        request(url, async (err, response, body) => {
            //Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get image, try again later.`);
                return;
            }

            //Parse the body
            let parsed = <ApiResponse>JSON.parse(body);
            console.log(parsed);
            let parsedBody = parsed.message==null ? parsed.link : parsed.message;

            // Delete the loading message
            try { await message.delete(); } catch(err) {}

            input.channel.send({
                embed: {
                    color: 3447003,
                    image:
                    {
                        url: parsedBody
                    }
            }
            });

        });
    }
}

type ApiResponse = {
    message: Url;
    link: Url;
};

// type ApiResponseCute = {

// };
