declare module 'cron' {
    class CronJob {
        constructor(cronTime: string | Date, onTick: Function, onComplete?: Function | null, start?: boolean | null, timeZone?: string | null);

        /**
         * Starts the job.
         */
        public start() : void;

        /**
         * Stops the job.
         */
        public stop() : void;

        /**
         * Sets the time for the cron job.
         */
        public setTime(time: CronTime) : void;
    }

    class CronTime {
        constructor(time: string | Date);
    }
}

declare module 'html-entities' {
    // const entities = require("html-entities").AllHtmlEntities;

    class AllHtmlEntities {
        /**
         * Encodes the given string and escapes only HTML characters.
         */
        public static encode(text: string): string;

        /**
         * Encodes the given string and escapes all non-UTF characters.
         */
        public static encodeNonUTF(text: string): string;

        /**
         * Encodes the given string and escapes all non-ASCII characters.
         */
        public static encodeNonASCII(text: string): string;

        /**
         * Decodes the string and returns the raw text.
         */
        public static decode(text: string): string;
    }
}
