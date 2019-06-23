import { Command, Input } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { RichEmbed } from 'discord.js';
import { Framework } from '@core/framework';
import * as moment from 'moment';

export class Forecast extends Command {
    constructor() {
        super({
            name: 'forecast',
            description: 'Checks the weather forecast at a given location.',
            arguments: [
                {
                    name: 'location',
                    description: 'The name of a city to search for.',
                    expand: true,
                    required: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let location = input.getArgument('location') as string;

        // Error if there is no API key
        if (!Framework.getConfig().authentication.openWeatherMap) {
            return await input.channel.send(`${Emoji.ERROR}  This bot is not configured for weather.`);
        }

        // Get the key
        let key = Framework.getConfig().authentication.openWeatherMap.key;

        // Show a loading message
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching weather...`) as Message;

        // Get the current weather
        let today : Day;
        try {
            today = await this.getCurrent(location, key);
        }
        catch (err) {
            await message.edit(`${Emoji.ERROR}  ${err.message}`);
            return;
        }

        // Update the message
        await message.edit(`${Emoji.LOADING}  Building a forecast...`);

        // Format the URL
        let url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${key}&units=imperial`;

        // Fetch from API
        request(url, async (err, response, body) => {
            // Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get forecast, try again later.`);
                return;
            }

            // Parse the response
            let parsed = <ForecastApiResponse>JSON.parse(body);

            // Handle errors
            if ('cod' in parsed && parsed.cod != '200') {
                await message.edit(`${Emoji.ERROR}  ${parsed.message.capitalize()}.`);
                return;
            }

            // Delete the loading message
            message.deleteAfter(0);

            // Get icon and color for the embed
            let forecast = this.build(parsed);
            forecast.unshift(today);

            // Determine the color
            let color = colors[today.icon.replace(/[dn]/, '')];

            // Build the fields
            let fields : {name: string; value: string; inline: boolean}[] = [];
            forecast.forEach(day => {
                let icon = icons[day.icon.replace(/[dn]/, '')];
                let temperature = Math.floor(0.5 + day.temperature.max);

                fields.push({
                    name: `${icon}  ${day.date.format('dddd')}`,
                    value: `${day.overview}, ${temperature} °F\n\u200b`,
                    inline: true
                });
            });

            // Finally, send the weather!
            await input.channel.send(new RichEmbed({
                title: parsed.city.name,
                description: `Forecast for the next five days.\n\u200b`,
                color: color,
                fields: fields
            }));
        });
    }

    /**
     * Gets the current weather.
     */
    private getCurrent(location: string, key: string) : Promise<Day> {
        return new Promise((resolve, reject) => {
            // Format the URL
            let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${key}&units=imperial`;

            // Fetch from API
            request(url, async (err, response, body) => {
                // Handle HTTP errors
                if (err) {
                    return reject(new Error('Failed to get weather, try again later.'));
                }

                // Parse the response
                let parsed = <CurrentApiResponse>JSON.parse(body);

                // Handle not found errors
                if ('cod' in parsed && parsed.cod != '200') {
                    return reject(new Error(parsed.message.capitalize()));
                }

                // Build the day
                resolve({
                    date: moment(),
                    icon: parsed.weather[0].icon,
                    overview: parsed.weather[0].main,
                    temperature: {
                        min: parsed.main.temp_min,
                        max: parsed.main.temp_max
                    }
                });
            });
        });
    }

    /**
     * Builds a five day forecast from the given forecast data (which should be in intervals of 3 hours), and returns
     * five objects representing the extremes for each day.
     */
    private build(body: ForecastApiResponse) {
        let days : {[date: string]: Day} = {};

        body.list.forEach(entry => {
            let time = moment(entry.dt_txt, 'YYYY-MM-DD HH:mm:ss');
            let date = time.format('MM/DD');
            let weather = entry.weather[0];

            // Update an existing date with reinforced forecast data
            if (date in days) {
                let existing = days[date];

                // Determine priorities
                let existingPriority = priorities.indexOf(existing.overview) || 0;
                let newPriority = priorities.indexOf(weather.main) || 0;

                // Update overview if higher priority
                if (existingPriority < newPriority) {
                    existing.overview = weather.main;
                    existing.icon = weather.icon;
                }

                // Update temperature range
                if (existing.temperature.max < entry.main.temp_max) existing.temperature.max = entry.main.temp_max;
                if (existing.temperature.min > entry.main.temp_min) existing.temperature.min = entry.main.temp_min;
            }

            // Add a new date if it doesn't exist
            else {
                days[date] = {
                    date: time,
                    overview: weather.main,
                    icon: weather.icon,
                    temperature: {
                        min: entry.main.temp_min,
                        max: entry.main.temp_max
                    }
                };
            }
        });

        return _.values(days);
    }
}

const icons : {[id: string] : string} = {
    '01': ':sunny:',
    '02': ':white_sun_small_cloud:',
    '03': ':cloud:',
    '04': ':cloud:',
    '09': ':cloud_rain:',
    '10': ':white_sun_rain_cloud:',
    '11': ':thunder_cloud_rain:',
    '13': ':cloud_snow:',
    '50': ':foggy:'
};

const colors : {[id: string] : number} = {
    '01': 0xffac33,
    '02': 0xffac33,
    '03': 0xeeeeee,
    '04': 0xeeeeee,
    '09': 0x5dadec,
    '10': 0x5dadec,
    '11': 0xf4900c,
    '13': 0x88c9f9
};

const priorities = [
    'Clear',
    'Clouds',
    'Dust',
    'Mist',
    'Smoke',
    'Haze',
    'Fog',
    'Sand',
    'Drizzle',
    'Rain',
    'Snow',
    'Thunderstorm',
    'Ash',
    'Tornado'
];

type CurrentApiResponse = {
    name: string;
    cod: string;
    message: string;

    weather: {
        main: string;
        description: string;
        icon: string;
    }[];
    main: {
        temp: number;
        pressure: number;
        humidity: number;
        temp_min: number;
        temp_max: number;
    };
    wind: {
        speed: number;
        deg: number;
    };
};

type ForecastApiResponse = {
    cod: string;
    message: string;
    cnt: number;

    list: {
        dt: number;
        dt_txt: string;

        main: {
            temp: number;
            pressure: number;
            humidity: number;
            temp_min: number;
            temp_max: number;
        };

        weather: {
            main: string;
            description: string;
            icon: string;
        }[];

        wind: {
            speed: number;
            deg: number;
        };
    }[];

    city: {
        name: string;
    }
};

type Day = {
    date: moment.Moment;
    icon: string;
    overview: string;
    temperature: {
        min: number;
        max: number;
    };
};
