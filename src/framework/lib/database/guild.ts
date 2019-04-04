import { Database } from "../database";
import * as squel from 'squel';

export class GuildBucket {
    protected id: string;
    protected rowExists: boolean = false;
    protected status: Status;
    protected map : {[column: string]: string} = {
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
     * Constructs a new GuildBucket instance.
     */
    constructor(id: string) {
        let r : Function = () => {};
        let p : Promise<void> = new Promise(resolve => {
            r = resolve;
        });

        this.id = id;
        this.status = {
            loaded: false,
            loading: false,
            promise: p,
            resolver: r
        };
    }

    /**
     * Saves the current state of the guild.
     */
    public async save(): Promise<void> {
        // Throw an error if we haven't already loaded
        if (!this.status.loaded) {
            throw new Error('Attempted to save a GuildBucket which has not been loaded.');
        }

        // Update an existing row
        if (this.rowExists) {
            let query = squel.update()
                .table('guilds', 'm')
                .where('m.id = ?', this.id);

            // Add columns
            for (let column in this.map) {
                let value = (this as any)[column] as any;

                // Convert values
                if (typeof value == 'object') value = 'json:' + JSON.stringify(value);
                if (typeof value == 'undefined') value = null;

                // Insert value
                query.set(this.map[column], value);
            }

            await Database.run(query.toString());
        }

        // Insert a new row
        else {
            let query = squel.insert()
                .into('guilds')
                .set('id', this.id);

            // Add columns
            for (let column in this.map) {
                let value = (this as any)[column] as any;

                // Convert values
                if (typeof value == 'object') value = 'json:' + JSON.stringify(value);
                if (typeof value == 'undefined') value = null;

                // Insert value
                query.set(this.map[column], value);
            }

            await Database.run(query.toString());
            this.rowExists = true;
        }
    }

    /**
     * Loads the guild's data from the database.
     */
    public async load(): Promise<void> {
        // Skip if already loaded
        if (this.status.loaded) return;
        if (this.status.loading) return await this.status.promise;

        // Start loading
        this.status.loading = true;

        // Get the database row
        let rows = await Database.query<any[]>('SELECT * FROM guilds WHERE id = ? LIMIT 1', this.id);
        let row = (rows.length > 0) ? rows[0] : undefined;

        // If the row exists, parse its data
        if (row) {
            this.rowExists = true;

            for (let column in this.map) {
                let realName = this.map[column];
                let value = row[realName];

                // Decode value
                if (value == null) value = undefined;
                if (typeof value == 'string' && value.startsWith('json:')) value = JSON.parse(value.substring(5));

                // Restore the value
                (this as any)[column] = value;
            }
        }

        // Set the status and resolve the loading promise
        this.status.loaded = true;
        this.status.resolver();
    }

    /**
     * Waits for the guild to finish loading.
     */
    public async wait() {
        if (!this.status.loaded) {
            await this.status.promise;
        }
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

type Status = {
    loaded: boolean;
    loading: boolean;
    promise: Promise<void>;
    resolver: Function
}
