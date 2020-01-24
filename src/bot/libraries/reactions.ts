import { Message, MessageReaction, GuildMember, Emoji, User } from "discord.js";

export class Reactions {

    private static listening: {[messageId: string]: Contract} = {};

    /**
     * Listens for reactions on the given message and triggers the callback when they are added or removed.
     */
    public static listen(message: Message, fn: (reaction: Reaction) => any) : ReactionListener {
        let listener = new ReactionListener(() => {
            if (message.id in this.listening) {
                let index = this.listening[message.id].callbacks.indexOf(fn);
                if (index >= 0) this.listening[message.id].callbacks.splice(index, 1);
                if (this.listening[message.id].callbacks.length == 0) delete this.listening[message.id];
            }
        });

        if (message.id in this.listening) {
            this.listening[message.id].callbacks.push(fn);
            this.listening[message.id].expires = _.now() + 1800000;
        }

        this.listening[message.id] = {
            message: message,
            callbacks: [fn],
            expires: _.now() + 1800000
        };

        return listener;
    }

    /**
     * Invokes a reaction and fires it as an event if listened to.
     */
    public static invoke(action: 'add' | 'remove', message: Message, reaction: MessageReaction, user: User) {
        if (message.id in this.listening) {
            this.listening[message.id].callbacks.forEach(fn => {
                fn({
                    action: action,
                    member: message.guild!.members.get(user.id) as GuildMember,
                    message: message,
                    emoji: (reaction.emoji as Emoji).toString()
                });
            });
        }
    }

    /**
     * Adds emoji reactions to a message in the given order.
     */
    public static async addReactions(message: Message, emojis: string[]) {
        let promises = [];
        let fn = (i: number) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    message.reactCustom(emojis[i]).then(resolve, resolve);
                }, i * 500);
            });
        };

        for (let i = 0; i < emojis.length; i++) {
            promises.push(fn(i));
        }

        await Promise.all(promises);
    }

    /**
     * Cleans the internal listener store. Used internally.
     */
    public static clean() {
        _.each(this.listening, (listening, id) => {
            if (listening.expires <= _.now()) {
                delete this.listening[id];
            }
        });
    }

}

export class ReactionListener {
    private closeListener : () => any;

    constructor(fn: () => any) {
        this.closeListener = fn;
    }

    public close() {
        this.closeListener();
    }
}

type Reaction = {
    action: 'add' | 'remove',
    message: Message,
    member: GuildMember,
    emoji: string
}

type Contract = {
    message: Message;
    callbacks: ((reaction: Reaction) => any)[];
    expires: number;
}

function cleanup() {
    Reactions.clean();
    setTimeout(cleanup, 10000);
}

cleanup();
