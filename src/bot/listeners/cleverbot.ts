import { Listener } from "@api";
import { Message } from "discord.js";
import { Framework } from "@core/framework";
import { Cleverbot } from '@bot/libraries/cleverbot';
import { Emoji } from '@bot/libraries/emoji';
import chalk from 'chalk';

export class CleverbotListener extends Listener
{

    private conversations : { [channelId: string]: Cleverbot } = {};

    /**
     * Triggers whenever the bot sees a new message anywhere it has access to.
     *
     * @param message
     */
    async onMessage(message: Message) {
        let member = message.member;

        if (message.channel.type != 'text') return;
        if (!member) return;
        if (member.user.bot) return;

        let myId = Framework.getClient().user!.id;
        let exp = new RegExp('^<@!?' + myId + '>\\s+(.+)$');
        let matches = exp.exec(message.content);

        if (matches) {
            let content = matches[1];
            let conversation = this.getConversation(message.channel.id);

            // Debugging
            let serverId = (Framework.getEnvironment() == 'production') ? `${chalk.gray(message.guild!.name)}: ` : '';
            Framework.getLogger().info(`${serverId}${member.user.tag} said: ${content}`);

            // If we don't get a conversation back, then the bot isn't capable of talking
            if (!conversation) {
                this.getLogger().error('Cleverbot is not configured on this bot. To activate it, enter an API key.');
                return await message.channel.send(`${Emoji.ERROR}  Sorry, but my owner hasn't configured me to do that yet!`);
            }

            // Tell the user(s) that we are getting a reply
            message.channel.startTyping();

            // Send the message and get a response
            try {
                let response = await conversation.send(content);
                await sleep(1000);

                // Handle cases where there is an empty response (random cleverscript bug)
                if (response.length == 0) response = 'I have nothing to say right now.';

                // Send the response
                message.channel.stopTyping();
                await message.channel.send(`:speech_balloon:  ${message.member} ${response}`);

                // Debugging
                Framework.getLogger().info(`${serverId}Responded to ${member.user.tag}: ${response}`);
            }
            catch (error) {
                this.getLogger().error('Error occurred when running cleverscript:');
                this.getLogger().error(error);
                message.channel.stopTyping();
            }
        }
    }

    /**
     * Retrieves the `Cleverbot` instance for the given channel, creating one if necessary.
     *
     * @param channelId
     */
    private getConversation(channelId: string) {
        if (channelId in this.conversations) {
            return this.conversations[channelId];
        }

        let key = Framework.getConfig().authentication.cleverbot.key;
        if (!key) return;

        return this.conversations[channelId] = new Cleverbot(key);
    }

}
