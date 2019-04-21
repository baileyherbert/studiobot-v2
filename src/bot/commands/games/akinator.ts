import { Command, Input, Listener } from '@api';
import { Emoji } from '@bot/libraries/emoji';
import { Message } from 'discord.js';
import { Reactions } from '@bot/libraries/reactions';
import { Timer } from '@bot/libraries/utilities/timer';
import { Framework } from '@core/framework';
import { progressBarText } from '@bot/libraries/utilities/progress-bar';
const aki = require('aki-api');
const entities = require("html-entities").AllHtmlEntities;

let regions: string[] = [
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

let images: string[] = [
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/defi.png?v90',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/inspiration_legere.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/etonnement.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/serein.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/vrai_decouragement.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/inspiration_forte.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/confiant.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/mobile.png',
    'https://en.akinator.com/bundles/elokencesite/images/akitudes_670x1096/surprise.png',
]

let reactions = ['🇾', '🇳', '🇩', '❔', '❓', '↩'];

export class Akinator extends Command {
    constructor() {
        super({
            name: 'akinator',
            description: 'Starts the akinator game.',
            aliases: ['aki'],
            arguments: [
                {
                    name: 'language',
                    description: 'Select your preferred language',
                    options: regions,
                    error: true,
                    default: regions[0]
                }
            ]
        });
    }

    async execute(input: Input) {
        let region = input.getArgument('language') as string;
        let stepNumber = 0;

        // Fetch from API
        aki.start(region, async (resolve: Resolve, error: any) => {
            // Handle HTTP errors
            if (error) {
                this.getLogger().error(`Failed to start akinator: ${error}`);
                await input.channel.send(`${Emoji.ERROR}  Failed to get response, try again later.`);
                return;
            }

            // Log session information
            this.getLogger().debug(`Started akinator game with session ${resolve.session} and signature ${resolve.signature}.`);

            // Send the initial message
            let message = await input.channel.send({
                embed: {
                    color: 0x499df5,
                    thumbnail: { url: _.sample(images) },
                    fields: [{
                        name: `${input.member.displayName}, Question ${stepNumber + 1}`,
                        value: `**${resolve.question}**\nyes (**y**) / no (**n**) / idk (**i**) / probably (**p**) / probably not (**pn**)\nback (**b**)`,
                    }]
                }
            }) as Message;

            // Main loop
            while (true) {
                let reaction = await this.getResponse(input);
                let data : any;

                if (reaction == 5) {
                    // Go back
                    if (stepNumber == 0) {
                        break;
                    }

                    data = await aki.back(region, resolve.session, resolve.signature, reaction, stepNumber);
                }
                else {
                    // Next step
                    try {
                        data = await aki.step(region, resolve.session, resolve.signature, reaction, stepNumber);
                    }
                    catch (error) {
                        this.getLogger().error(`Error when stepping akinator: ${error}`);
                        return;
                    }
                }

                // If we are 85%+ certain on who the character is, display it
                if (data.progress >= 85) {
                    try {
                        message.deleteAfter(10000);

                        const win = await aki.win(region, resolve.session, resolve.signature, stepNumber + 1);
                        const firstGuess = win.answers[0];

                        let photo = firstGuess.absolute_picture_path;
                        let name = firstGuess.name;
                        let description = firstGuess.description;

                        //console.log(photo);
                        //console.log(description);

                        await input.channel.send({
                            embed: {
                                color: 0x499df5,
                                image: { url: photo },
                                fields: [
                                    {
                                      "name": `${input.member.displayName}, is this your character?`,
                                      "value": `Name: **${name}**\nFrom: **${description}**`
                                    }
                                ]
                            }
                        }) as Message;
                    }
                    catch (error) {
                        this.getLogger().error(`Error when finalizing akinator win: ${error}`);
                        return;
                    }

                    break;
                }

                // Set next step number
                stepNumber = data.nextStep;

                // Delete the previous message
                message.deleteAfter(600000);

                message = await input.channel.send({
                    embed: {
                        color: 0x499df5,
                        thumbnail: { url: _.sample(images) },
                        fields: [{
                            name: `${input.member.displayName}, Question ${stepNumber + 1}`,
                            value: `**${data.nextQuestion}**\nyes (**y**) / no (**n**) / idk (**i**) / probably (**p**) / probably not (**pn**)\nback (**b**)`,
                        }]
                    }
                }) as Message;
            }
        });
    }

    private getResponse(input: Input) : Promise<number> {
        return new Promise(resolve => {
            let filter = (m: Message) => (/^(y|n|i|p|pn|b)$/i.test(m.content) && m.member == input.member);
            let collector = input.channel.createMessageCollector(filter, { time: 60000 });

            collector.on('collect', m => {
                let responses = ['y', 'n', 'i', 'p', 'pn', 'b'];
                let index = responses.indexOf(m.content.trim().toLowerCase());

                if (index >= 0) {
                    m.deleteAfter(600000);
                    collector.stop();
                    return resolve(index);
                }
            });
        });
    }
}

type Resolve = {
    session: string;
    signature: string;
    question: string;
    answers: string[];
};
