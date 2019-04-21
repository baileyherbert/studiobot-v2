import { Database as SqliteDb } from 'sqlite3';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import * as mysql from 'mysql';
import { Framework } from '@core/framework';

export class SqliteMigration {
    private file: SqliteDb;
    private interface: readline.Interface;

    public constructor() {
        let filePath = rootpath('data/storage');
        let templatePath = rootpath('data/template');

        // If the database file doesn't exist, create it from the template
        if (!fs.existsSync(filePath)) {
            fs.copyFileSync(templatePath, filePath);
        }

        // Open the database file
        this.file = new SqliteDb(filePath);

        // Create a readline interface
        this.interface = Framework.getInterface();
    }

    /**
     * Runs the migration.
     */
    public run() {
        return new Promise(async resolve => {
            let existing = Framework.getConfig();
            existing.database = {
                host: 'localhost',
                port: 3306,
                name: 'ember',
                username: 'root',
                password: ''
            };

            fs.writeFileSync(rootpath('config.json'), JSON.stringify(existing, null, 4));

            Framework.getLogger().error('This bot uses SQLite for its database.');
            Framework.getLogger().error('The latest version switches the bot to use a MySQL server.');
            Framework.getLogger().error('Database options have been added to your config.json file.\n');

            if (await this.getBoolean('Want to set up the database now?')) {
                if (await this.getBoolean('Are you a member of production studios?')) {
                    let email = '';

                    while (email.indexOf('@uat.edu') < 0) {
                        email = await this.getInput('Enter your full school email address:');
                    }

                    let username = email.substring(0, email.indexOf('@')).toLowerCase();
                    let password = email.toLowerCase();

                    Framework.getLogger().info('Logging in...');
                    let connection = await this.test(username, password);

                    if (await this.getBoolean('Set up the database for the first time?')) {
                        Framework.getLogger().info('Running initial schema queries...');

                        // Get the initial migration queries
                        let queries = readPublicFile('migrations/init.sql');

                        // Run the queries
                        await (() => {
                            return new Promise(resolve => {
                                connection.query(queries, err => {
                                    if (err) {
                                        Framework.getLogger().error('Failed to set up the database.');
                                        Framework.getLogger().error(err.toString());
                                        process.exit(-1);
                                    }

                                    resolve();
                                });
                            });
                        })();

                        Framework.getLogger().info('Your database was set up successfully.\n');
                    }

                    connection.end();

                    if (await this.getBoolean('Save your config.json file with the database details?')) {
                        existing.database = {
                            host: 'dev.ember.bailey.sh',
                            port: 3306,
                            name: username,
                            username,
                            password
                        };

                        fs.writeFileSync(rootpath('config.json'), JSON.stringify(existing, null, 4));
                        Framework.getLogger().info('Configuration file saved.\n');
                    }

                    if (await this.getBoolean('Resume the bot?')) {
                        resolve();
                    }
                    else {
                        process.exit();
                    }
                }
                else {
                    Framework.getLogger().info('Please edit your config.json file with the new details, and start the bot again.');
                    process.exit();
                }
            }
            else {
                Framework.getLogger().info('Please edit your config.json file with the new details, and start the bot again.');
                process.exit();
            }
        });
    }

    /**
     * Gets text input from the user.
     */
    private getInput(question: string): Promise<string> {
        return new Promise(resolve => {
            this.interface.question(`${question} `, (reply) => {
                resolve(reply);
            });
        });
    }

    /**
     * Gets a yes or no value from the user.
     */
    private getBoolean(question: string, defaultsTo: boolean = true): Promise<boolean> {
        return new Promise(resolve => {
            let y = defaultsTo ? 'Y' : 'y';
            let n = !defaultsTo ? 'N' : 'n';

            this.interface.question(`${question} [${y}/${n}] `, (reply) => {
                reply = reply.trim();

                if (reply.length == 1 && reply.toLowerCase() == 'n') return resolve(false);
                resolve(true);
            });
        });
    }

    /**
     * Tests a databse connection.
     */
    private test(user: string, password: string) : Promise<mysql.Connection> {
        return new Promise(resolve => {
            let testConnection = mysql.createConnection({
                host: 'dev.ember.bailey.sh',
                port: 3306,
                user,
                password,
                database: user,
                multipleStatements: true
            });

            testConnection.connect(err => {
                if (err) {
                    Framework.getLogger().error('Failed to login to the production studios database.');
                    Framework.getLogger().error(err.toString());
                    process.exit(-1);
                }
                else {
                    Framework.getLogger().info('Logged into the database successfully.\n');
                    resolve(testConnection);
                }
            });
        });
    }
}
