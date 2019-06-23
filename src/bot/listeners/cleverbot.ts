import { Listener } from "@api";
import { Message } from "discord.js";
import { Framework } from "@core/framework";

const CleverbotAPI = require('cleverbot-api');
let cleverbot : any;

export class CleverbotListener extends Listener
{

    onMessage(message: Message) {
        if (message.channel.type != 'text') return;
        if (message.member.user.bot) return;

        let myId = Framework.getClient().user.id;
        let exp = new RegExp('^<@!?' + myId + '>\\s+(.+)$');
        let matches = exp.exec(message.content);

        if (matches) {
            let content = matches[1];

            if (!cleverbot) {
                let key = Framework.getConfig().authentication.cleverbot.key;

                if (!key) {
                    this.getLogger().error('Cleverbot is not configured on this bot. To activate it, enter an API key.');
                    return;
                }

                cleverbot = new CleverbotAPI(key);
            }

            message.channel.startTyping();

            cleverbot.getReply({
                input: encodeURI(content)
            }, (error : Error, response : {input: string; output: string}) => {
                if (error) {
                    this.getLogger().error('Error occurred when running cleverscript:');
                    this.getLogger().error(error);
                    message.channel.stopTyping();
                    return;
                }

                setTimeout(() => {
                    if (response.output.trim().length == 0) {
                        response.output = 'I have nothing to say right now.';
                    }

                    message.channel.stopTyping();
                    message.channel.send(`:speech_balloon:  ${message.member} ${response.output}`);
                }, 1000);
            });
        }
    }

}
