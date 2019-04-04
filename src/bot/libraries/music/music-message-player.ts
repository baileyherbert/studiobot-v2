import {GuildMember, Message, TextChannel} from "discord.js";
import {SongInfo} from "@libraries/music/song-info";
import {Framework} from "@core/framework";
import {ReactionListener, Reactions} from "@libraries/reactions";
import {EventEmitter} from "events";
import {Session} from "@libraries/music/session";
import {parseDuration} from "@libraries/prettify-ms";

export class MusicMessagePlayer extends EventEmitter {
    channel: TextChannel;
    playerMessage?: Message;
    status: Status;
    private reactions = ['⏪', '⏹', '⏯', '⏩', '▶']; //'◀', '🔄'
    private reactionActions: { [reaction: string]: () => void } = {};
    private session: Session;
    private listener?: ReactionListener;
    private respondents: { [id: string]: ReactionResponse } = {};
    private updateInterval: number = 10000;

    constructor(session: Session) {
        super();
        this.session = session;
        this.channel = session.channel;
        this.status = Status.PLAYING;
    }

    public async initialise() {
        await this.repost();
        await this.bindActions();
        await this.beginUpdates();
    }

    async addReactions() {
        for (let i = 0; i < this.reactions.length; i++) {
            if (!this.playerMessage) return;
            await this.playerMessage.react(this.reactions[i]);
            // console.log(`Starting loop ${i}`);
            // await new Promise((resolve, reject) => {
            //     console.log(`Making promise`);
            //     setTimeout(async () => {
            //         if (!this.playerMessage) return reject;
            //         await this.playerMessage.react(this.reactions[i]);
            //         console.log(`Resolving`);
            //         resolve();
            //     }, 2500);
            // });
        }
    }

    populate(song: SongInfo) {
        return {
            embed: {
                color: 3447003,
                author: {
                    name: `${Framework.getClient().user.username} - ${this.statusMessage()}`,
                    icon_url: Framework.getClient().user.avatarURL
                },
                image: {
                    url: `https://i3.ytimg.com/vi/${song.info.video_id}/maxresdefault.jpg`,
                },
                title: `**${song.title}**`,
                url: song.url,
                description: song.info.description.slice(0, 1024),
                fields: [
                    {
                        name: "Length",
                        value: parseDuration(parseInt(song.info.length_seconds)),
                    },
                    {
                        name: "Time",
                        value: this.session.dispatcher ? parseDuration(this.session.timeOffset + (this.session.dispatcher.time / 1000)) : 0,
                    }
                ],
                timestamp: new Date(),
                footer: {
                    // icon_url: client.user.avatarURL,
                    // text: "© Example"
                }
            }
        };
    }

    async update() {
        if (!this.playerMessage) return;
        if (!this.session.currentlyPlaying) return await this.clean();
        await this.playerMessage.edit(this.populate(this.session.currentlyPlaying));
    }

    async repost() {
        await this.clean();
        if (!this.session.currentlyPlaying) return;
        this.playerMessage = await this.channel.send(this.populate(this.session.currentlyPlaying)) as Message;
        await this.createListeners();
        await this.addReactions();
    }

    public async clean() {
        if (this.playerMessage) await this.playerMessage.delete();
        this.playerMessage = undefined;
    }

    private async createListeners() {
        this.listener = Reactions.listen(this.playerMessage!, reaction => {
            if (reaction.member == this.playerMessage!.guild.member(Framework.getClient().user)) return;

            let number = this.reactions.indexOf(reaction.emoji);
            if (number < 0) return;

            if (!this.session.dispatcher || !this.session.currentlyPlaying) return;
            this.reactionActions[reaction.emoji]();
        });
    }

    private bindActions() {
        let seekOffset = (offset: number) => {
            let resultTime = (this.session.timeOffset + this.session.dispatcher!.time / 1000 + offset);
            resultTime = _.clamp(resultTime, 0, parseInt(this.session.currentlyPlaying!.info.length_seconds));
            return resultTime.toFixed(0);
        };

        this.reactionActions = {
            '⏯': async () => {
                if (!this.session.paused) {
                    await this.session.pause();
                    this.status = Status.PAUSED;
                } else {
                    await this.session.resume();
                    this.status = Status.PLAYING;
                }
            },
            '⏹': async () => {
                await this.session.terminateConnection();
            },
            '⏪': async () => {
                if (!this.session.dispatcher || !this.session.currentlyPlaying) return;
                await this.session.seek(seekOffset(-30));
            },
            '⏩': async () => {
                if (!this.session.dispatcher || !this.session.currentlyPlaying) return;
                await this.session.seek(seekOffset(30));
            },
            '◀': async () => {
                console.log('Previous');
            },
            '▶': async () => {
                await this.session.skip();
            }
        }
    }

    private statusMessage() {
        let statusMessage = '';
        switch (this.status) {
            case Status.PAUSED:
                statusMessage += 'Paused';
                break;
            case Status.PLAYING:
                statusMessage += 'Playing';
                break;
            case Status.SKIPPING:
                statusMessage += 'Skipping';
                break;
        }
        return statusMessage;
    }

    private beginUpdates() {
        let id = setInterval(async () => {
            if (!this.playerMessage) {
                clearInterval(id);
                return;
            }
            await this.update();
        }, this.updateInterval);
    }
}

export enum Status {
    PLAYING = 'playing',
    PAUSED = 'paused',
    SKIPPING = 'skipping',
}

export type ReactionResponse = {
    choice: number;
    member: GuildMember;
};