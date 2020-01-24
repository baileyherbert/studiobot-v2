import { Command, Input } from '@api';
import { Framework } from '@core/framework';

export class Ping extends Command {
    constructor() {
        super({
            name: 'ping',
            description: 'Returns the bot\'s current latency.'
        });
    }

    execute(input: Input) {
        let ping = Framework.getClient().ws.ping.toPrecision(4);

        input.channel.send(`:satellite:  Bot's current ping is **${ping} ms**.`);
    }
}
