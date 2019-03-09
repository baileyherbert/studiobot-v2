import {Command, Input} from '@api';
import {TextChannel} from 'discord.js';
import {UserPoll} from "@libraries/utilities/create_poll";
import {Emoji} from "@libraries/emoji";

export class Poll extends Command {
    constructor() {
        super({
            name: 'poll',
            description: 'Lets members vote on between 2-6 options',
            arguments: [
                {
                    name: 'question',
                    constraint: 'string',
                    required: true,
                },
                {
                    name: 'choices',
                    required: true,
                    expand: true,
                    pattern: /(.+,)+.+/
                }
            ]
        });
    }

    async execute(input: Input) {
        let title = 'Server Poll';
        let prompt = input.getArgument('question') as string;
        prompt = prompt.replace(/"(.+)"/, '$1');
        let optionString = (input.getArgument('choices') as string);
        let options = optionString.split(',', 6);

        if (options.length < 2) {
            await input.channel.send(`${Emoji.ERROR} There must be more that one option to create a poll`);
            return;
        }

        let err1 = false;
        let err2 = false;
        _.each(options, async opt => {
            if (opt.length < 1) err1 = true;
            if (optionString.split(opt, 3).length > 2) err2 = true;
        });

        if (err1) {
            await input.channel.send(`${Emoji.ERROR} Choices cannot be empty.`);
            return;
        }

        if (err2) {
            await input.channel.send(`${Emoji.ERROR} Choices must be unique.`);
            return;
        }

        let poll = new UserPoll(input.channel as TextChannel, title, prompt, options, 3);
        await poll.createPoll();
    }
}
