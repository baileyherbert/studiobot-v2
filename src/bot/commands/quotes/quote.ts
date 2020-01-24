import { Command, Input } from '@api';
import { GuildMember } from 'discord.js';
import { TextChannel } from 'discord.js';
import { Message } from 'discord.js';
import { Framework } from '@core/framework';

export class Quote extends Command {
    constructor() {
        super({
            name: 'quote',
            description: 'Manages saved quotes for the server.',
            arguments: [
                {
                    name: 'action',
                    options: ['add', 'remove', 'delete', 'get'],
                    default: 'get'
                },
                {
                    name: 'user',
                    constraint: 'mention',
                    error: true
                },
                {
                    name: 'id',
                    constraint: 'number'
                },
                {
                    name: 'quote'
                }
            ]
        });
    }

    async execute(input: Input) {
        let db = input.guild.settings;

        let action = input.getArgument('action') as string;
        let user = input.getArgument('user') as GuildMember | undefined;
        let id = input.getArgument('id') as number;
        let quote = input.getArgument('quote') as string;

        switch(action) {
            case 'add':
                //Add quotes

                //User to attribute quote to
                if (user) {
                    if (!quote && user.id != Framework.getClient().user!.id) {
                        let q = await this.getLastMessage(<TextChannel>input.channel, user);
                        if (q) quote = q.content;
                    }
                    if (quote) {
                        db.quotes.push({
                            memberId: user.id,
                            time: _.now(),
                            message: quote
                        });
                        input.channel.send('**[' + (db.quotes.length).toString() + ']** - ' + quote.substring(0, Math.min(1900, quote.length)) + ' —' + user.displayName);
                    } else {
                        input.channel.send("No quote to add");
                    }
                //anonymous quote
                } else {
                    if (!quote) {
                        input.channel.send("No quote to add");
                    }
                    db.quotes.push({
                        memberId: '0',
                        time: _.now(),
                        message: quote
                    });
                    input.channel.send('**[' + (db.quotes.length).toString() + ']** - ' + quote.substring(0, Math.min(1900, quote.length)) + ' —Anonymous');
                }
                break;
            case 'remove':
            case 'delete':
                //remove quotes
                if (id != null) {
                    let q = db.quotes[id-1];
                    if (q) {
                        let member: string;
                        let target = input.guild.member(q.memberId);
                        if (target) {
                            member = target.displayName;
                        } else {
                            member = "Anonymous";
                        }

                        db.quotes.splice(id-1, 1);
                        input.channel.send(`Quote **[` + id.toString() + `]** from ` + member + ` removed.`);
                    } else {
                        input.channel.send("That quote does not exist");
                    }
                } else {
                    input.channel.send("Please provide the quote ID");
                }
                break;
            case 'get':
                //get random command
                if (_.size(db.quotes) > 0) {
                    //from specific user
                    if (user) {
                        let userQuotes = _.filter(db.quotes, function(o) { return o.memberId == (user as GuildMember).id; })
                        let id = _.random(0, _.size(userQuotes)-1);
                        input.channel.send('**[' + (db.quotes.indexOf(userQuotes[id])+1).toString() + ']** - ' + userQuotes[id].message.substring(0, Math.min(1900, userQuotes[id].message.length)) + ' —' + user.displayName);
                    //from all users
                    } else {
                        let id = _.random(0, _.size(db.quotes)-1);
                        let member: string;
                        let target = input.guild.member(db.quotes[id].memberId);
                        if (target) {
                            member = target.displayName;
                        } else {
                            member = "Anonymous";
                        }
                        input.channel.send('**[' + (id+1).toString() + ']** - ' + db.quotes[id].message.substring(0, Math.min(1900, db.quotes[id].message.length)) + ' —' + member);
                    }
                } else {
                    input.channel.send('No quotes saved.');
                }
                break;
        }

        await db.save();
    }

    private async getLastMessage(channel: TextChannel, member: GuildMember) : Promise<Message | undefined> {
        let messages = await channel.messages.fetch({ limit: 100, before: channel.lastMessageID! });

        let last = _.find(messages.array(), (msg : Message) => {
            return msg.member == member && !msg.content.startsWith(channel.guild.settings.prefix);
        });

        return last;
    }
}
