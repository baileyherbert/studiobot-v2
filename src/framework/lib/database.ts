import * as mysql from 'mysql';
import * as path from 'path';
import * as fs from 'fs';
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

    /**
     * Returns an array of migration files to run.
     */
    public static getMigrationFiles(currentVersion ?: string) : MigrationFile[] {
        let migrationsPath = pub('migrations');
        let currentVersionInt = (currentVersion) ? this.getVersionInt(currentVersion) : 0;

        let fileNames = fs.readdirSync(migrationsPath).filter(name => !name.equals('init.sql')).sort((a, b) => {
            let aParts = a.replace('.sql', '').split('.');
            let bParts = b.replace('.sql', '').split('.');

            while (aParts.length < 3) aParts.push('0');
            while (bParts.length < 3) bParts.push('0');

            let aId = (1000000 * parseInt(aParts[0])) + (1000 * parseInt(aParts[1])) + parseInt(aParts[2]);
            let bId = (1000000 * parseInt(bParts[0])) + (1000 * parseInt(bParts[1])) + parseInt(bParts[2]);

            return aId - bId;
        });

        let files : MigrationFile[] = [];
        fileNames.forEach(name => {
            if (this.getVersionInt(name) > currentVersionInt) {
                files.push({
                    version: name.replace('.sql', ''),
                    path: path.join(migrationsPath, name)
                });
            }
        });

        return files;
    }

    /**
     * Returns an integer representation of a version string.
     */
    private static getVersionInt(version: string) {
        let parts = version.replace('.sql', '').split('.');

        // Right padding
        while (parts.length < 3) parts.push('0');

        // Create an integer out of the version
        return (1000000 * parseInt(parts[0])) + (1000 * parseInt(parts[1])) + parseInt(parts[2]);
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

export type MigrationFile = {
    version: string;
    path: string;
};
