import * as request from 'request-promise';
import * as querystring from 'querystring';

export class Cleverbot {

    private cs ?: string;
    private cleanupTimer ?: NodeJS.Timeout;

    public constructor(private key: string) {

    }

    /**
     * Sends the given input and resolves with the response as a string. If there is an error along the way,
     * this will throw an `Error` instance.
     *
     * @param input The user input to send.
     */
    public async send(input: string) : Promise<string> {
        let response = await this.sendRequest(input);

        // Save the state
        this.cs = response.cs;

        // Have the state expire soon
        this.createCleanupTimer();

        // Send back the reply
        return response.output;
    }

    /**
     * Sends the given input and returns the response as an object.
     *
     * @param input
     */
    private async sendRequest(input: string) {
        let response = await request.get(this.buildQueryUri(input), { gzip: true, resolveWithFullResponse: true });

        if (response.statusCode !== 200) {
            throw new Error(`Got an unexpected status code (${response.statusCode})`);
        }

        let body = JSON.parse(response.body) as CleverbotResponse;
        if (!body.cs || !body.conversation_id || !body.output) {
            throw new Error(`Got an incomplete response`);
        }

        return body;
    }

    /**
     * Builds and returns the URL of a request for the given input.
     *
     * @param input
     */
    private buildQueryUri(input: string) {
        return 'https://www.cleverbot.com/getreply?' + querystring.stringify(<CleverbotArguments>{
            key: this.key,
            cs: this.cs,
            input
        });
    }

    /**
     * Expires the state after an hour of inactivity, or if it gets too long.
     */
    private createCleanupTimer() {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
        }

        // The server's request size limit is 64 kb, so we'll enforce the state at 60 kb to be safe
        if (this.cs && this.cs.length > (1024 *  60)) {
            return this.cs = undefined;
        }

        // Create the cleanup timer
        this.cleanupTimer = setTimeout(() => {
            this.cs = undefined;
        }, 3600000);
    }

}

type CleverbotArguments = {
    /**
     * The key to use for the Cleverbot API.
     */
    key : string;

    /**
     * The input string to send to Cleverbot.
     */
    input : string;

    /**
     * The conversation state.
     */
    cs ?: string;

    /**
     * Varies Cleverbot’s reply from sensible to wacky (0 to 100).
     */
    cb_settings_tweak1 ?: number;

    /**
     * Varies Cleverbot’s reply from shy to talkative (0 to 100).
     */
    cb_settings_tweak2 ?: number;

    /**
     * Varies Cleverbot’s reply from self-centred to attentive (0 to 100).
     */
    cb_settings_tweak3 ?: number;
};

type CleverbotResponse = {
    cs: string;
    interaction_count: number;
    input: string;
    output: string;
    conversation_id: string;
};
