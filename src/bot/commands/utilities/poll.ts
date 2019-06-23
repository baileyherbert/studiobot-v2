import { Command, Input } from '@api';
import { TextChannel } from 'discord.js';
import { UserPoll } from '@libraries/utilities/create_poll';
import { Emoji } from '@libraries/emoji';

export class Poll extends Command {
    constructor() {
        super({
            name: 'poll',
            aliases: ['vote'],
            description: 'Lets members vote on between 2-6 options.',
            usage: 'poll [duration=30] <question>; <choice>; <choice>; ...',
            arguments: [
                {
                    name: 'duration',
                    description: 'The number of seconds the poll will last (between 15 and 300).',
                    constraint: 'number',
                    default: 30,
                    eval: (value: number) => {
                        if (value < 15) throw new Error('Duration must be at least 15 seconds.');
                        if (value > 300) throw new Error('Duration must be at most 300 seconds.');

                        return true;
                    }
                },
                {
                    name: 'question',
                    description: 'The question to start a poll for.',
                    pattern: /([^;]+);\s*/,
                    required: true
                },
                {
                    name: 'choices',
                    description: 'A list of choices separated by semicolons.',
                    required: true,
                    expand: true,
                    pattern: /(.+[,;])+.+/
                }
            ]
        });
    }

    async execute(input: Input) {
        let title = 'Server Poll';
        let duration = input.getArgument('duration') as number;
        let prompt = input.getArgument('question') as string;
        let choices = input.getArgument('choices') as string;

        // Remove the semicolon from the prompt
        prompt = prompt.replace(/;$/, '');

        // Split the options
        let options = choices.split(/[,;]/, 6);

        // Make sure there are at least two options
        if (options.length < 2) {
            await input.channel.send(`${Emoji.ERROR}  There must be more than one option to create a poll`);
            return;
        }

        let err1 = false;
        let err2 = false;

        _.each(options, opt => {
            if (opt.length < 1) err1 = true;
            if (choices.split(opt, 3).length > 2) err2 = true;
        });

        if (err1) {
            await input.channel.send(`${Emoji.ERROR}  Choices cannot be empty.`);
            return;
        }

        if (err2) {
            await input.channel.send(`${Emoji.ERROR}  Choices must be unique.`);
            return;
        }

        let poll = new UserPoll(input.channel as TextChannel, title, prompt, options, duration);
        await poll.createPoll();
    }
}
