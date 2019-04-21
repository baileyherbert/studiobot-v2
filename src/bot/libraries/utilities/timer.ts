import {EventEmitter} from 'events';

export class Timer extends EventEmitter {
    private elapsed: number = 0;
    private remaining: number;
    private readonly time: number;
    private readonly startTime: number;
    private readonly func?: (remaining: number) => any;
    private readonly tickRate: number;

    constructor(time: number = 30, tickFunction?: (remaining: number) => any, tickRate: number = 1000) {
        super();
        if (time <= 0) throw new Error('Timer must be set to a non zero positive rational number');

        this.tickRate = tickRate < 1000 ? 1000 : tickRate;
        this.time = time;
        this.startTime = _.now();
        this.remaining = time;
        this.func = tickFunction;
    }

    async run() {
        while (this.remaining > 0) {
            await sleep(Math.min(this.tickRate, this.remaining * 1000));
            this.elapsed = (_.now() - this.startTime) / 1000;
            this.remaining = this.time - this.elapsed;

            if (this.func) await this.func(Math.ceil(this.remaining));
        }
        this.emit('finished');
    }

    wait() {
        return new Promise(resolve => {
            this.on('finished', resolve);
        });
    }
}