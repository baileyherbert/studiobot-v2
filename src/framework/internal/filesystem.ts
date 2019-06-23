import * as fs from 'fs';
import * as path from 'path';
import { Framework } from '@core/framework';

const watch = require('node-watch') as WatchFunction;

export class Filesystem {
    private static watching: string[] = [];
    private static buffer: string[] = [];
    private static timeout: NodeJS.Timeout | undefined;

    /**
     * Watches the filesystem for changes to modules which operate the bot.
     */
    public static watch() {
        this.watchDirectory(path.join(__dirname, '../../bot/'));
        this.watchDirectory(path.join(__dirname, '../bot/'));
    }

    /**
     * Watches a specific directory for changes.
     */
    private static watchDirectory(dir: string) {
        this.watching.push(dir);

        let scriptsDir = path.join(__dirname, '../../bot/scripts');

        let filter = (name: string) => !name.endsWith('.map');
        let persistent = true;
        let recursive = true;

        watch(dir, { persistent, recursive, filter }, (type, fileName) => {
            if (type == 'update') {
                // Clear cache
                this.clearModuleCache();

                // If the file is a script, require it
                if (fileName.startsWith(scriptsDir)) {
                    try {
                        require(fileName);
                    }
                    catch (e) {
                        Framework.getLogger().error(e);
                    }
                }

                // Add it to the buffer
                this.buffer.push(fileName);

                // Set a new timeout
                if (this.timeout) clearTimeout(this.timeout);
                this.timeout = setTimeout(() => { this.executeBuffer() }, 300);
            }
        });
    }

    /**
     * Executes the internal buffer, which reloads commands and listeners in the bot.
     */
    private static executeBuffer() {
        // Reset the buffer
        let files = this.buffer;
        this.buffer = [];

        // Reload commands and listeners
        let start = _.now();
        Framework.reload();

        // Log file count
        let time = _.now() - start;
        Framework.getLogger().info(`Reloaded ${files.length} file${files.length != 1 ? 's' : ''} in ${time.toFixed(0)} millis.`);
    }

    /**
     * Clears cached modules from `require()` so they may be imported again from disk.
     */
    private static clearModuleCache() {
        Object.keys(require.cache).forEach(key => {
            this.watching.forEach(dirPath => {
                if (key.startsWith(dirPath)) {
                    delete require.cache[key];
                }
            });
        });
    }
}

type WatchFunction = ((fileName: string, options: WatchOptions, listener: (type: 'update' | 'remove', fileName: string) => any) => fs.FSWatcher);
type WatchOptions = {
    delay ?: number;
    encoding ?: string;
    filter ?: RegExp | ((fileName: string) => boolean);
    persistent ?: boolean;
    recursive ?: boolean;
};
