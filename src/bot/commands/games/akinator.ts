import { Command, Input } from '@api';
import { Message } from 'discord.js';
import { Akinator } from '@libraries/akinator';

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

export class AkinatorGame extends Command {
    constructor() {
        super({
            name: 'akinator',
            description: 'Starts the akinator game.',
            aliases: ['aki']
        });
    }

    async execute(input: Input) {
        let akinator = new Akinator('en');

        // Start the session
        let step = await akinator.start();
        this.getLogger().debug(`Started akinator game with session ${step.session.sessionId} and signature ${step.session.sessionSignature}.`);

        // Send the initial message
        let message = await input.channel.send({
            embed: {
                color: 0x499df5,
                thumbnail: { url: _.sample(images) },
                fields: [{
                    name: `${input.member.displayName}, Question ${step.number}`,
                    value: `**${step.question}**\nyes (**y**) / no (**n**) / idk (**i**) / probably (**p**) / probably not (**pn**)\nback (**b**)`,
                }]
            }
        }) as Message;

        // Main game loop
        while (true) {
            let reaction = await this.getResponse(input);

            // Go back to the previous step
            if (reaction == 5) {
                if (step.number == 1) break;
                step = await akinator.previous();
            }

            // Or continue to the next step
            else {
                step = await akinator.next(reaction);
            }

            // If we are 85%+ certain on who the character is, display it
            if (step.certainty >= 85) {
                message.deleteAfter(10000);

                // Get the winner
                const win = await akinator.finish();
                let photo = win.photo_url;
                let name = win.name;
                let description = win.description;

                // Display the winner
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

                // Exit the loop
                break;
            }

            // Delete the previous message
            message.deleteAfter(600000);

            // Send a new message for the current question
            message = await input.channel.send({
                embed: {
                    color: 0x499df5,
                    thumbnail: { url: _.sample(images) },
                    fields: [{
                        name: `${input.member.displayName}, Question ${step.number}`,
                        value: `**${step.question}**\nyes (**y**) / no (**n**) / idk (**i**) / probably (**p**) / probably not (**pn**)\nback (**b**)`,
                    }]
                }
            }) as Message;
        }
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
