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
    private sessions: {[guildId: string]: boolean} = {};

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
        // Reserve
        if (input.channel.id in this.sessions) return;
        this.sessions[input.channel.id] = true;

        // Get arguments
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
            try {
                await message.edit(`${Emoji.ERROR}  No messages left to delete.`);
                message.deleteAfter(5000);
            }
            catch (error) {}

            delete this.sessions[input.channel.id];
            return;
        }

        // Add a fancy loading emoticon
        try {
            await message.edit(`${Emoji.LOADING}  Clearing ${messagesToDelete.length} messages (0%)...`);
        }
        catch (error) {
            message = await input.channel.send(`${Emoji.LOADING}  Clearing ${messagesToDelete.length} messages (0%)...`) as Message;
        }

        // Function for defining progress
        let updateProgress = async () => {
            let percent = Math.floor(100 * (deletedTotal / originalSize));
            let status = `${Emoji.LOADING}  Clearing ${originalSize - deletedTotal} messages (${percent}%)...`;

            try {
                await message.edit(status);
            }
            catch (error) {
                message = await input.channel.send(status) as Message;
            }

            delete this.sessions[input.channel.id];
            return;
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
                            try {
                                await message.edit(`${Emoji.ERROR}  Unable to delete messages.`);
                            }
                            catch (error) {
                                message = await input.channel.send(`${Emoji.ERROR}  Unable to delete messages.`) as Message;
                            }

                            delete this.sessions[input.channel.id];
                            message.deleteAfter(5000);
                            return;
                        }
                    }

                    await sleep(600);
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

        try {
            await message.edit(`${Emoji.SUCCESS}  Cleared ${originalSize} messages. ${_.sample(remarks)}`);
        }
        catch (error) {
            message = await input.channel.send(`${Emoji.SUCCESS}  Cleared ${originalSize} messages. ${_.sample(remarks)}`) as Message;
        }

        message.deleteAfter(5000);
        input.message.deleteAfter(5000);
        delete this.sessions[input.channel.id];
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
