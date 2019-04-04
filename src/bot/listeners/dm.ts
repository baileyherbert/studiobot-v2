import { Listener } from "@api";
import { Message } from "discord.js";
import { DirectMessage } from "@bot/libraries/dm";

export class DirectMessageListener extends Listener {
    onMessage(message: Message) {
        if (message.channel.type == 'dm') {
            DirectMessage.trigger(message);
        }
    }
}
