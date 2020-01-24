import {Emoji} from "@libraries/emoji";
import {GuildMember, Message, TextChannel} from "discord.js";
import {Timer} from "@libraries/utilities/timer";
import {EventEmitter} from "events";
import {ReactionListener, Reactions} from "@libraries/reactions";
import {progressBarText} from "@libraries/utilities/progress-bar";
import {Framework} from "@core/framework";

export class UserPoll extends EventEmitter {
    private message?: Message;
    private channel: TextChannel;
    private title: string;
    private prompt: string;
    private reactions = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'];
    private letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    private options: string[];
    private time: number;
    private responders: { [id: string]: PollResponse } = {};
    private listener?: ReactionListener;
    private correctAnswer: number;

    constructor(channel: TextChannel, title: string, prompt: string, options: string[], time: number = 30, shuffle: boolean = false) {
        super();
        this.title = title;
        this.prompt = prompt;
        this.channel = channel;
        if (options.length < 2 || options.length > 6) throw new Error('Options length must be between 2-6');
        this.options = shuffle ? _.shuffle(options) : options;
        this.correctAnswer = options.indexOf(options[0]);
        this.time = time;
        this.emit('finished');
    }

    public async createPoll() {
        await this.sendPoll();
        await this.createListeners();
        await this.addReactions();
        await this.createTimer();
        return await this.checkWinners();
    }

    private async sendPoll() {
        let fields: { name: string, value: string }[] = [];
        for (let i = 0; i < this.options.length; i++) {
            fields.push({
                name: `${this.letters[i]})`,
                value: this.options[i]
            });
        }

        this.message = await this.channel.send({
            embed: {
                color: 3447003,
                title: '__' + this.title + '__',
                description: this.prompt,
                fields: fields
            }
        }) as Message;
    }

    private async addReactions() {
        for (let i = 0; i < this.options.length; i++) {
            await this.message!.react(this.reactions[i]);
        }
    }

    private async createListeners() {
        this.listener = Reactions.listen(this.message!, reaction => {
            if (reaction.member == this.channel.guild.member(Framework.getClient().user!)) return;
            if (reaction.action == 'remove') return;

            let number = this.reactions.indexOf(reaction.emoji);
            if (number < 0) return;

            if (reaction.action == 'add') {
                this.responders[reaction.member.id] = {
                    choice: number,
                    member: reaction.member
                };
                this.emit('vote', this.responders[reaction.member.id]);
            }
        });
    }

    private async createTimer() {
        let tickRate = this.time / 60;

        // Count down
        let countdownMessage = await this.channel.send(`_ _\n${Emoji.LOADING} Time to answer ends in **${this.time}** seconds...`) as Message;

        let countdown = new Timer(this.time, async function (remaining) {
            await countdownMessage.edit(`_ _\n${Emoji.LOADING} Time to answer ends in **${remaining}** seconds...`);
        }, tickRate);

        countdown.run();
        await countdown.wait();
        await countdownMessage.edit(`${Emoji.SUCCESS} **Time to vote is over!**`);
        if (this.listener) this.listener.close();
        this.emit('voteEnd');

        countdownMessage.deleteAfter(6000);
    }

    private async checkWinners() {
        let totalResponses = 0;
        let correctRespondents: GuildMember[] = [];

        let votes: number[] = [];
        let percentages: number[] = [];

        _.each(this.responders, resp => {
            if (resp.choice == this.correctAnswer) correctRespondents.push(resp.member);
            if (!votes[resp.choice]) votes[resp.choice] = 0;
            votes[resp.choice]++;
            totalResponses++;
        });

        for (let i = 0; i < this.options.length; i++) {
            percentages[i] = votes[i] / totalResponses || 0;
        }

        this.emit('end', votes, percentages, this.correctAnswer, correctRespondents);

        let fields: { name: string, value: string }[] = [];
        for (let i = 0; i < this.options.length; i++) {
            let percentMsg = (percentages[i] * 100).toFixed(2) + `% (${votes[i] || 0})`;
            fields.push({
                name: `${this.options[i]}`,
                value: progressBarText(percentages[i], 20, false) + ` 󠀀󠀀 󠀀󠀀 󠀀󠀀· 󠀀󠀀 󠀀󠀀 󠀀󠀀${percentMsg}`
            });
        }

        await this.message!.delete();
        return await this.channel.send({
            embed: {
                color: 0x50C878,
                title: `__${this.title}__`,
                description: this.prompt + '\n\u200b',
                fields: fields
            }
        });
    }
}

export type PollResponse = {
    choice: number;
    member: GuildMember;
};
