import { Database } from "../database";
import * as squel from 'squel';

export class Model {
    /**
     * The name of the table the model represents.
     */
    protected table: string = '';

    /**
     * A map between model property names and database column names. Property names go on the left side and column
     * names on the right.
     */
    protected map: {[column: string]: string} = {};

    /**
     * A map of the primary key's column(s). Property names go on the left side and column names on the right.
     */
    protected primaryKey: {[column: string]: string} = {};

    /**
     * Whether or not the row exists in the database.
     */
    protected rowExists: boolean = false;

    /**
     * Internal state tracking for the model row.
     */
    protected status: Status;

    /**
     * Constructs a new model instance.
     */
    constructor() {
        let r : Function = () => {};
        let p : Promise<void> = new Promise(resolve => {
            r = resolve;
        });

        this.status = {
            loaded: false,
            loading: false,
            promise: p,
            resolver: r
        };
    }

    /**
     * Loads the guild's data from the database.
     */
    public async load(): Promise<void> {
        // Skip if already loaded
        if (this.status.loaded) return;

        // If we are currently loading, then wait for the existing promise
        if (this.status.loading) return await this.status.promise;

        // Start loading
        this.status.loading = true;

        // Build the query
        let query = this.restrictQuery(squel.select().from(this.table).limit(1));
        let { text, values } = query.toParam();

        // Get the database row
        let rows = await Database.query<any[]>(text, values);
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
     * Saves the current state of the guild.
     */
    public async save(): Promise<void> {
        // Throw an error if we haven't already loaded
        if (!this.status.loaded) {
            throw new Error('Attempted to save a MemberBucket which has not been loaded.');
        }

        // Insert a new row if necessary
        if (!this.rowExists) {
            return await this.insert();
        }

        // Build the initial query
        let query = this.restrictQuery(squel.update().table(this.table).limit(1));

        // Add columns and values
        for (let column in this.map) {
            let value = (this as any)[column] as any;

            // Convert values
            if (typeof value == 'object') value = 'json:' + JSON.stringify(value);
            if (typeof value == 'undefined') value = null;

            // Insert value
            query.set(this.map[column], value);
        }

        // Compile and run
        let { text, values } = query.toParam();
        await Database.run(text, values);
    }

    /**
     * Waits for the member to finish loading.
     */
    public async wait() {
        if (!this.status.loaded) {
            await this.status.promise;
        }
    }

    /**
     * Inserts the row into the database.
     */
    protected async insert(): Promise<void> {
        // Build the initial query
        let query = squel.insert().into(this.table);

        // Add the primary key
        for (let propName in this.primaryKey) {
            let columnName = this.primaryKey[propName];
            query.set(columnName, (this as any)[propName]);
        }

        // Add columns
        for (let column in this.map) {
            let value = (this as any)[column] as any;

            // Convert values
            if (typeof value == 'object') value = 'json:' + JSON.stringify(value);
            if (typeof value == 'undefined') value = null;

            // Insert value
            query.set(this.map[column], value);
        }

        // Compile and run
        let { text, values } = query.toParam();
        await Database.run(text, values);

        // Mark the row as inserted
        this.rowExists = true;
    }

    /**
     * Restricts the query to the model's primary key.
     */
    protected restrictQuery<T extends any>(query: T) {
        for (let propName in this.primaryKey) {
            let columnName = this.primaryKey[propName];
            query.where(`${columnName} = ?`, (this as any)[propName]);
        }

        return query;
    }
}

type Status = {
    loaded: boolean;
    loading: boolean;
    promise: Promise<void>;
    resolver: Function;
}
