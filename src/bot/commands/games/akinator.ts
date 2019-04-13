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

        const data = await aki.start(regions[0]);

        //Fetch from API
        aki.start(regions[0], async (resolve: any, error: any) => {
            //Handle HTTP errors
            if (error) {
                await input.channel.send(`${Emoji.ERROR}  Failed to get response, try again later.`);
                return;
            }

            //The Reactions to be added to the message
            let reactionToAnswer = {
                'y': resolve.answers[0],
                'n': resolve.answers[1],
                'd': resolve.answers[2],
                'p': resolve.answers[3],
                'pn': resolve.answers[4]
            };

            //The message to be displayed
            // let message = await input.channel.send({
            //     embed: {
            //         color: 3447003,
            //         title: 'Akinator',
            //         description: resolve.question,
            //         fields: [{
            //             name: `•  Yes (y) ${reactionToAnswer['y']}\n🇳 ${reactionToAnswer['n']}\n🇩 ${reactionToAnswer['d']}\n❔ ${reactionToAnswer['p']}\n❓ ${reactionToAnswer['pn']}`,
            //             value: `[⤶] Previous Question`
            //         }],
            //         footer: {
            //             text: `Question ${stepNumber + 1 }`
            //         }
            //     }
            // }) as Message;
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

                //Add Reactions
                // setImmediate(async () => {
                //     for (let i = 0; i < reactions.length; i++) {
                //         if (resolved) break;
                //         if (!message.editable) break;
                        
                //         try {
                //             await message.react(reactions[i]);
                //         }
                //         catch (error) {
                //             break;
                //         }
                //     }
                // });

                let data : any;

                if (reaction == 5) {
                    // .. go back
                    if (stepNumber == 0) {
                        console.log('Exiting akinator');
                        break;
                    }

                    data = await aki.back(region, resolve.session, resolve.signature, reaction, stepNumber);
                }
                else {
                    data = await aki.step(region, resolve.session, resolve.signature, reaction, stepNumber);
                }

                if (data.progress >= 85) {
                    try {
                        message.deleteAfter(10000);

                        const win = await aki.win(region, resolve.session, resolve.signature, stepNumber + 1);
                        const firstGuess = win.answers[0];
                        
                        let photo = firstGuess.absolute_picture_path;
                        let name = firstGuess.name;
                        let description = firstGuess.description;

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
                        console.log(error);
                    }

                    break;
                }

                if (error) {
                    console.log(error);
                }
                else {
                    stepNumber = data.nextStep;

                    //delete the previous message 
                    message.deleteAfter(600000);
                    
                    //Display the next message;
                    // message = await input.channel.send({
                    //     embed: {
                    //         color: 3447003,
                    //         title: 'Akinator',
                    //         description: data.nextQuestion,
                    //         thumbnail:{
                    //             url: _.sample(images)
                    //         },
                    //         fields: [{
                    //             name: ` 🇾 ${reactionToAnswer['y']}\n🇳 ${reactionToAnswer['n']}\n🇩 ${reactionToAnswer['d']}\n❔ ${reactionToAnswer['p']}\n❓ ${reactionToAnswer['pn']}`,
                    //             value: `[⤶] Previous Question`
                    //         },
                    //         {
                    //             name: `Certainty [${data.progress}%]`,
                    //             value: `${progressBarText(data.progress / 100, 20, false)}`
                    //         }],
                    //         footer: {
                    //             text: `Question ${stepNumber} `
                    //         }
                    //     }
                    // }) as Message;
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

            collector.on('end', collected => {
                //console.log(`Collected ${collected.size} items`)
            });

            // let listener = Reactions.listen(message, async reaction => {
            //     if (reaction.member == input.guild.member(Framework.getClient().user)) return;
            //     if (reaction.action == 'add') {
            //         if (reaction.member != input.member) return;
            //         if (reactions.indexOf(reaction.emoji) < 0) return;
                    
            //         listener.close();

            //         switch (reaction.emoji) {
            //             case reactions[0]: return resolve(0);
            //             case reactions[1]: return resolve(1);
            //             case reactions[2]: return resolve(2);
            //             case reactions[3]: return resolve(3);
            //             case reactions[4]: return resolve(4);
            //             case reactions[5]: return resolve(5);
            //         }
            //     }
            // });
        });
    }
}
