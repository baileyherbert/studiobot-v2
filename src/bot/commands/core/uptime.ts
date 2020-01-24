import { Command, Input } from '@api';
import { Framework } from '@core/framework';
import moment from 'moment';

export class Uptime extends Command {
    constructor() {
        super({
            name: 'uptime',
            description: 'Returns how long the bot has been online and running.',
        });
    }

    execute(input: Input) {
        let onlineSince = _.now() - Framework.getClient().uptime!;
        let m = moment(onlineSince);
        let online = m.fromNow(true);

        input.channel.send(`:clock4:  Bot has been running for **${online}**.`);
    }
}
