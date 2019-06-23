import { Model } from './model';

export class GuildBucket extends Model {
    protected table = 'guilds';

    protected primaryKey = {
        id: 'id'
    };

    protected map = {
        prefix: 'prefix',
        voice: 'voice',
        notifications: 'notifications',
        quotes: 'quotes'
    };

    /**
     * The prefix to use for the guild.
     */
    public prefix: string = '!';

    /**
     * The voice settings to use for the guild.
     */
    public voice: GuildVoiceSettings = {
        volume: 0.5
    };

    /**
     * The notification messages to use for the guild.
     */
    public notifications: GuildNotificationSettings = {
        newYoutubeVideo: 'New video available! {{ link }}',
    };

    /**
     * The quotes saved to the guild.
     */
    public quotes: GuildQuote[] = [];

    /**
     * Constructs a new guild.
     */
    constructor(protected id: string) {
        super();
    }
}

export type GuildVoiceSettings = {
    /**
     * The default volume for the bot when streaming music on a voice channel.
     * @default 50
     */
    volume: number;
}

export type GuildNotificationSettings = {
    /**
     * The text to display when a member joins the guild, or undefined if not enabled by the guild's owner.
     */
    memberAdded?: string;

    /**
     * The text to display when a member leaves the guild, or undefined if not enabled by the guild's owner.
     */
    memberRemoved?: string;

    /**
     * The text to display when a new YouTube video is found on a watched channel.
     */
    newYoutubeVideo: string;
}

export type GuildQuote = {
    memberId: string;
    message: string;
    time: number;
}

export type GuildRow = {
    id: string;
    settings?: string;
}
