import { Command, Input } from '@api';
import { Emoji } from '@bot/libraries/emoji';
import { Message, TextChannel, Collection, Snowflake } from 'discord.js';

const remarks = [
    'Back to better times.',
    'Like they never happened.',
    'Not even a trace.',
    'That looks better.',
    'The shine won\'t last long.'
];

export class Clear extends Command {
    constructor() {
        super({
            name: 'clear',
            description: 'Clears messages from the current channel.',
            permission: 'manageMessages',
            arguments: [
                {
                    name: 'amount',
                    description: 'The number of messages to clear.',
                    patterns: /(\d+|all)/,
                    required: true,
                    usage: 'amount|all',
                    eval: (input: string) => {
                        if (input.equalsIgnoreCase('all')) return true;
                        if (parseInt(input) <= 0) return false;
                        if (parseInt(input) >= 1000) throw new Error('Amount must be 1,000 or less.');
                        return true;
                    }
                },
                {
                    name: 'force',
                    description: 'Forces the deletion of old messages (much slower).',
                    options: ['force']
                }
            ]
        });
    }

    async execute(input: Input) {
        let amount = input.getArgument('amount') as string;
        let limit = amount.equalsIgnoreCase('all') ? null : parseInt(amount);
        let force = (input.getArgument('force') as string | undefined) != undefined;
        let message = await input.channel.send(`${Emoji.LOADING}  Getting ready...`) as Message;
        let messagesToDelete = await this.getMessages(input.channel as TextChannel, limit, input.message.id, force);
        let originalSize = messagesToDelete.length;
        let twoWeeksAgo = _.now() - (86400 * 7 * 1000) + 300000;
        let deletedTotal = 0;
        let errorCount = 0;

        // Handle cases where all of the messages are older than two weeks
        if (messagesToDelete.length == 0) {
            await message.edit(`${Emoji.ERROR}  No messages left to delete.`);
            message.deleteAfter(5000);
            return;
        }

        // Add a fancy loading emoticon
        await message.edit(`${Emoji.LOADING}  Clearing ${messagesToDelete.length} messages (0%)...`);

        // Function for defining progress
        let updateProgress = async function() {
            let percent = Math.floor(100 * (deletedTotal / originalSize));
            return await message.edit(`${Emoji.LOADING}  Clearing ${originalSize - deletedTotal} messages (${percent}%)...`);
        }

        // Delete messages in chunks
        while (messagesToDelete.length > 0) {
            let chunk = messagesToDelete.slice(0, 99);
            let old = chunk.filter(message => message.createdTimestamp < twoWeeksAgo);
            messagesToDelete = messagesToDelete.slice(99);

            // Delete the chunk
            if (old.length < chunk.length) {
                let recent = chunk.filter(message => message.createdTimestamp >= twoWeeksAgo);
                await input.channel.bulkDelete(recent, true);
                deletedTotal += recent.length;
            }

            // Delete old messages manually
            if (old.length > 0) {
                let steps = 0;

                for (let i = 0; i < old.length; i++) {
                    let message = old[i];

                    try {
                        await message.delete();
                    }
                    catch (error) {
                        errorCount++;

                        if (errorCount >= 10) {
                            await message.edit(`${Emoji.ERROR}  Unable to delete messages.`);
                            message.deleteAfter(5000);
                            return;
                        }
                    }

                    await sleep(1000);
                    deletedTotal++;

                    if (++steps == 5) {
                        steps = 0;
                        await updateProgress();
                    }
                }
            }

            // Calculate a percentage
            if (messagesToDelete.length > 0) {
                await updateProgress();
            }
        }

        await message.edit(`${Emoji.SUCCESS}  Cleared ${originalSize} messages. ${_.sample(remarks)}`);
        message.deleteAfter(5000);
        input.message.deleteAfter(5000);
    }

    /**
     * Returns an array of messages to delete.
     */
    private async getMessages(channel: TextChannel, limit: number | null, before: string, forced: boolean) : Promise<Message[]> {
        let results : Message[] = [];
        let buffer : Collection<Snowflake, Message>;
        let twoWeeksAgo = !forced ? (_.now() - (86400 * 7 * 1000) + 300000) : 0;

        while ((buffer = await channel.fetchMessages({ before: before, limit: 100 })).size > 0) {
            let eligible = buffer.filter(message => message.createdTimestamp > twoWeeksAgo);

            eligible.forEach(msg => results.push(msg));

            if (eligible.last()) before = eligible.last().id;
            if (eligible.size < 100) break;
            if (limit && results.length >= limit) break;
        }

        return limit ? results.slice(0, limit) : results;
    }
}
