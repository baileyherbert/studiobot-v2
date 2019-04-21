import {Message, TextChannel} from "discord.js";

export function progressBarText(percent: number, maxLength: number, progressive: boolean) {
    if (percent < 0 || percent > 1)
        throw new Error('Percent must be greater than 0 and less than or equal to 1');
    if (maxLength < 0 || maxLength > 100)
        throw new Error('Bar length must be greater than 0 and less than or equal to 100');

    let loadedChars = Math.round(percent * maxLength);

    let result = '` 󠀀󠀀' + ('█').repeat(loadedChars);
    if (loadedChars < maxLength) {
        if (progressive) {
            result += '>';
            maxLength--;
        }
        result += ' 󠀀󠀀'.repeat(maxLength - loadedChars);
    }
    result += '󠀀`';

    return result;
}

export class ProgressBar {
    private channel: TextChannel;
    private title: string;
    private maxChars: number;
    private sending: boolean;
    private message?: Message;
    private percentile: number;

    /***
     * @param {string} title
     * @param {TextChannel} channel
     */
    constructor(title: string, channel: TextChannel) {
        this.channel = channel;
        this.title = title;
        this.maxChars = 25;
        this.sending = false;
        this.percentile = 0;
    }

    private generateMessage(percent: number) {
        return `${this.title}` + '\n' + progressBarText(percent, this.maxChars, true);
    }

    async initialize() {
        this.message = await this.channel.send(this.generateMessage(0)) as Message;

        let id = setInterval(async () => {
            if (!this.message) return;
            if (this.percentile < 1) {
                await this.message.edit(this.generateMessage(this.percentile));
            } else {
                clearInterval(id);
                await this.message.delete();
                return;
            }
        }, 500);
    }

    update(i: number, max?: number) {
        this.percentile = (max !== undefined) ? (i / max) : i;
    }
}