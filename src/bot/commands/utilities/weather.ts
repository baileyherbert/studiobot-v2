import { Command, Input } from '@api';
import * as request from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { RichEmbed } from 'discord.js';
import { Framework } from '@core/framework';

export class Weather extends Command {
    constructor() {
        super({
            name: 'weather',
            description: 'Checks the weather at a given location.',
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

        // Format the URL
        let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${key}&units=imperial`;

        // Show a loading message
        let message = await input.channel.send(`${Emoji.LOADING}  Fetching current weather...`) as Message;

        // Fetch from API
        request(url, async (err, response, body) => {
            // Handle HTTP errors
            if (err) {
                await message.edit(`${Emoji.ERROR}  Failed to get weather, try again later.`);
                return;
            }

            // Parse the response
            let parsed = <ApiResponse>JSON.parse(body);

            // Handle not found errors
            if ('cod' in parsed && parsed.cod == '404') {
                await message.edit(`${Emoji.ERROR}  ${parsed.message.capitalize()}.`);
                return;
            }

            // Get icon and color for the embed
            let icon = icons[parsed.weather[0].icon.replace(/[dn]/, '')];
            let color = colors[parsed.weather[0].icon.replace(/[dn]/, '')];

            // Delete the loading message
            try { await message.delete(); } catch(err) {};

            let deg = parsed.wind.deg ? (' @ ' + parsed.wind.deg.toFixed(0) + '°') : '';
            let wind = `${Math.floor(parsed.wind.speed + 0.5)} mph ${deg}`;

            // Finally, send the weather!
            await input.channel.send(new RichEmbed({
                title: `Weather for ${parsed.name}`,
                description: `${icon}  ${parsed.weather[0].description.capitalize()}\n\u200b`,
                color: color,
                fields: [
                    {
                        name: 'Temperature',
                        value: `${Math.floor(parsed.main.temp + 0.5)} °F`,
                        inline: true
                    },
                    {
                        name: 'Humidity',
                        value: `${parsed.main.humidity.toFixed(0)}%`,
                        inline: true
                    },
                    {
                        name: 'Wind',
                        value: wind,
                        inline: true
                    }
                ]
            }));
        });
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

type ApiResponse = {
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
