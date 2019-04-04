import * as mysql from 'mysql';
import { Framework } from '@core/framework';

const queue = require('queue')({ concurrency: 1, autostart: true, timeout: 60000 });

export class Database {
    private static connection: mysql.Connection;

    /**
     * Runs the given query and returns information about the query.
     */
    public static run(query: string, ...bindings: any[]) : Promise<Transaction> {
        return new Promise((resolve, reject) => {
            queue.push((cb : () => void) => {
                this.connection.query(query, bindings, (err, results) => {
                    cb();

                    if (err) return reject(err);
                    resolve({
                        affected: results.affectedRows,
                        insertId: results.insertId,
                        changed: results.changedRows
                    });
                });
            });
        });
    }

    /**
     * Runs the given query and resolves with an array of all matched rows.
     */
    public static query<T = any>(query: string, ...bindings: any[]) : Promise<T> {
        return new Promise((resolve, reject) => {
            queue.push((cb : () => void) => {
                this.connection.query(query, bindings, (err, results) => {
                    cb();

                    if (err) return reject(err);
                    resolve(results);
                });
            });
        });
    }

    /**
     * Closes the database.
     */
    public static close() : Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connection) return resolve();
            this.connection.end(err => {
                resolve();
            });
        });
    }

    /**
     * Starts the database.
     */
    public static connect() : Promise<void> {
        return new Promise((resolve, reject) => {
            let config = Framework.getConfig().database;

            this.connection = mysql.createConnection({
                host: config.host,
                user: config.username,
                password: config.password,
                database: config.name,
                port: config.port,
                charset: 'utf8mb4_general_ci',
                multipleStatements: true
            });

            this.connection.connect(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Returns the connection instance for the database.
     */
    public static getConnection() {
        return this.connection;
    }

    /**
     * Returns the current version of the database schema. This will return `undefined` if the database is unavailable
     * or if the database has not yet been set up.
     */
    public static getSchemaVersion() : Promise<string | undefined> {
        return new Promise(async resolve => {
            try {
                let rows = await this.query(`SELECT * FROM meta WHERE name = 'schema_version';`);

                if (rows.length !== 1) return resolve(undefined);
                return resolve(rows[0].value);
            }
            catch (err) {
                resolve(undefined);
            }
        });
    }
}

export type Transaction = {
    /**
     * For `INSERT`, `UPDATE`, or `DELETE` statements.
     * The number of rows that the query affected (includes rows which were not modified).
     */
    affected: number;

    /**
     * For `INSERT`, `UPDATE`, or `DELETE` statements.
     * The number of rows that the query modified.
     */
    changed: number;

    /**
     * For `INSERT` statements with an auto-increment primary key.
     * The primary key value of the inserted row.
     */
    insertId: number;
}
