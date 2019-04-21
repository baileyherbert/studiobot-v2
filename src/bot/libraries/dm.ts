import { GuildMember } from "discord.js";
import { Message, User } from "discord.js";

export class DirectMessage {
    private static collectors : Collector[] = [];

    /**
     * Collects the next direct message sent to the bot from the given member and triggers the callback. If the member
     * does not send a message within `expires` milliseconds, the collector is destroyed.
     */
    public static collectOnce(member: GuildMember, expires: number, fn: (message: Message) => any) {
        this.collect(member, 'once', expires, fn);
    }

    /**
     * Collects all direct messages sent to the bot from the given member and triggers the callback. After `expires`
     * milliseconds, the collector is destroyed.
     */
    public static collect(member: GuildMember, type: 'all' | 'once', expires: number, fn: (message: Message) => any, expireFn?: () => any) {
        this.collectors.push({
            user: member.user,
            type: type,
            expires: _.now() + expires,
            fn: fn,
            expireFn: expireFn
        });
    }

    /**
     * Returns a promise that waits for a once collector. If a message is collected, it resolves with that message.
     * If the collector expires, it rejects.
     */
    public static promise(member: GuildMember, expires: number) : Promise<Message> {
        return new Promise((resolve, reject) => {
            this.collect(member, 'once', expires, m => {
                resolve(m);
            }, () => {
                reject(new Error('Collector expired'));
            });
        });
    }

    /**
     * Triggers a collector event for the given direct message.
     */
    public static trigger(message: Message) {
        if (message.channel.type != 'dm') return;
        if (message.author.bot) return;

        let now = _.now();

        this.collectors.forEach(collector => {
            if (collector.expires > now) {
                if (collector.user == message.author) {
                    collector.fn(message);

                    if (collector.type == 'once') {
                        collector.expires = 0;
                    }
                }
            }
        });
    }

    /**
     * Removes expired collectors
     */
    public static cleanup() {
        this.collectors = this.collectors.filter(collector => {
            if (collector.expires <= _.now() && collector.expireFn) {
                collector.expireFn();
            }

            return collector.expires > _.now();
        });
    }
}

setInterval(DirectMessage.cleanup.bind(DirectMessage), 200);

type Collector = {
    user: User;
    type: 'once' | 'all';
    expires: number;
    fn: (message: Message) => any;
    expireFn?: () => any;
};
