import { Framework } from '@core/framework';
import chalk from 'chalk';
import * as readline from 'readline';
import moment = require('moment');

// Get the real console.log()
const log = console.log;

export class Logger {
    private id?: string;

    constructor(id?: string) {
        this.id = id;
    }

    public info(message: any, ...params: any[]) {
        log.apply(console, this.build('info', message, params));
    }

    public debug(message: any, ...params: any[]) {
        if (Framework.getLoggingLevel() != 'verbose' && Framework.getLoggingLevel() != 'debug') return;
        log.apply(console, this.build('debug', message, params));
    }

    public verbose(message: any, ...params: any[]) {
        if (Framework.getLoggingLevel() != 'verbose') return;
        log.apply(console, this.build('verbose', message, params));
    }

    public warning(message: any, ...params: any[]) {
        log.apply(console, this.build('warning', message, params));
    }

    public error(message: any, ...params: any[]) {
        log.apply(console, this.build('error', message, params));
    }

    /**
     * Clears the last line
     */
    public clear() {
        if (Framework.getEnvironment() == 'production') return;

        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
    }

    /**
     * Builds an array of arguments to send to the console.
     */
    private build(level: string, message: any, params: any[]) : any {
        let tagId = this.id ? `${chalk.gray(this.id)} ` : '';
        let tagLevel = this.color(level);
        let entry = `${tagId + tagLevel}`;

        if (Framework.getEnvironment() == 'production') {
            let time = moment().format('MM-DD-YYYY HH:mm:ssZZ');
            entry = `[${time}] ` + entry;
        }

        if (typeof message === 'string') {
            entry += (' ' + message);
            params.unshift(entry);
        }
        else {
            params.unshift(message);
        }

        return params;
    }

    /**
     * Colorizes the level and returns it with an appended colon.
     */
    private color(level: string) : string {
        let color = chalk.reset;

        switch (level) {
            case 'info': color = chalk.blue; break;
            case 'debug': color = chalk.green; break;
            case 'verbose': color = chalk.magenta; break;
            case 'warning': color = chalk.yellow; break;
            case 'error': color = chalk.red; break;
        }

        return color(level + ':');
    }
}

// Override console.log()
console.log = function() {
    let logger = Framework.getLogger();
    logger.debug.apply(logger, Array.from(arguments) as any);
};
