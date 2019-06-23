import {Command, Input} from '@api';
import {Emoji} from '@bot/libraries/emoji';
import {Message} from 'discord.js';
import {Timer} from "@libraries/utilities/timer";

export class Countdown extends Command {
    constructor() {
        super({
            name: 'countdown',
            description: 'Shows a countdown for x seconds.',
            arguments: [
                {
                    name: 'time',
                    constraint: 'number',
                    required: true,
                    eval: (n: number) => {
                        return n >= 2 && n < 300;
                    }
                }
            ]
        });
    }

    async execute(input: Input) {
        let startTime = parseInt(input.getArgument('time') as string);

        let tickRate = startTime / 60;

        // Count down
        let countdownMessage = await input.channel.send(`_ _\n${Emoji.LOADING} Timer ends in **${startTime}** seconds...`) as Message;

        let countdown = new Timer(startTime, async function (remaining) {
            await countdownMessage.edit(`_ _\n${Emoji.LOADING} Timer ends in **${remaining}** seconds...`);
        }, tickRate);

        countdown.run();
        await countdown.wait();
        await countdownMessage.edit(`${Emoji.SUCCESS}  **${startTime} second${startTime > 1 ? 's' : ''} have lapsed**`);

        countdownMessage.deleteAfter(6000);
    }
}
