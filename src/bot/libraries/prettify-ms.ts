const pluralize = (word: string, count: number) => count === 1 ? word : word + 's';

export type FormatOptions = {
    compact?: boolean,
    verbose?: boolean,
    separateMs?: boolean,
    formatSubMs?: boolean,
    keepDecimalsOnWholeSeconds?: boolean,
    secDecimalDigits?: number,
    msDecimalDigits?: number,
    unitCount?: number
}

export type ParsedTime = {
    days: number,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
    microseconds: number,
    nanoseconds: number
}

export function ParseTimeToUnits(ms: number): ParsedTime {
    const roundTowardsZero = ms > 0 ? Math.floor : Math.ceil;

    return {
        days: roundTowardsZero(ms / 86400000),
        hours: roundTowardsZero(ms / 3600000) % 24,
        minutes: roundTowardsZero(ms / 60000) % 60,
        seconds: roundTowardsZero(ms / 1000) % 60,
        milliseconds: roundTowardsZero(ms) % 1000,
        microseconds: roundTowardsZero(ms * 1000) % 1000,
        nanoseconds: roundTowardsZero(ms * 1e6) % 1000
    };
}

export function parseDuration(ms: number) {
    let result = '';
    let hr = 3600;
    let min = 60;
    let timePad = (n: number) => _.padStart(Math.floor(n).toString(), 2, '0');

    if (ms > hr) {
        result += `${timePad(ms / hr)}:`;
        ms %= hr;
    }

    result += `${timePad(ms / min)}:${timePad(ms % min)}`;
    return result;
}

export function prettify(ms: number, options: FormatOptions = {}) {

    if (!Number.isFinite(ms)) {
        throw new TypeError('Expected a finite number');
    }

    if (options.compact) {
        options.secDecimalDigits = 0;
        options.msDecimalDigits = 0;
    }

    const ret: string[] = [];

    function add(value: number, long: string, short: string, valueString?: string) {
        if (value === 0) {
            return;
        }

        const postfix = options.verbose ? ' ' + pluralize(long, value) : short;

        ret.push((valueString || value) + postfix);
    }

    const secDecimalDigits: number = options.secDecimalDigits || 1;

    if (secDecimalDigits < 1) {
        const diff = 1000 - (ms % 1000);
        if (diff < 500) {
            ms += diff;
        }
    }

    let parsed = ParseTimeToUnits(ms);

    add(Math.trunc(parsed.days / 365), 'year', 'y');
    add(parsed.days % 365, 'day', 'd');
    add(parsed.hours, 'hour', 'h');
    add(parsed.minutes, 'minute', 'm');

    if (options.separateMs || options.formatSubMs || ms < 1000) {
        add(parsed.seconds, 'second', 's');
        if (options.formatSubMs) {
            add(parsed.milliseconds, 'millisecond', 'ms');
            add(parsed.microseconds, 'microsecond', 'µs');
            add(parsed.nanoseconds, 'nanosecond', 'ns');
        } else {
            let msAndBelow = parsed.milliseconds + (parsed.microseconds / 1000) + (parsed.nanoseconds / 1e6);
            let msDecimalDigits = options.msDecimalDigits || 0;
            let msStr = msDecimalDigits ? parseFloat(msAndBelow.toFixed(msDecimalDigits)) : Math.ceil(msAndBelow);
            add(msStr, 'millisecond', 'ms', msStr.toString());
        }
    } else {
        const sec = ms / 1000 % 60;
        const secDecimalDigits = options.secDecimalDigits || 1;
        const secFixed = sec.toFixed(secDecimalDigits);
        const secStr = options.keepDecimalsOnWholeSeconds ? secFixed : secFixed.replace(/\.0+$/, '');
        add(parseFloat(secStr), 'second', 's', secStr);
    }

    if (ret.length === 0) {
        return '0' + (options.verbose ? ' milliseconds' : 'ms');
    }

    if (options.compact) {
        return '~' + ret[0];
    }

    if (options.unitCount) {
        return '~' + ret.slice(0, Math.max(options.unitCount, 1)).join(' ');
    }

    return ret.join(' ');
}



