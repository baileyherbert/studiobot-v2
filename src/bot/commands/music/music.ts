import {Command, Input} from '@api';
import {Emoji} from "@libraries/emoji";
import {TextChannel, VoiceChannel} from "discord.js";
import {Session} from "@libraries/music/session";

let trackedGuilds: { [id: string]: Session } = {};

export class Music extends Command {
    constructor() {
        super({
            name: 'music',
            description: 'Controls the bot\'s voice activity.',
            arguments: [
                {
                    name: 'action',
                    required: true,
                    options: [
                        'play',
                        'search',
                        'stop',
                        'pause',
                        'skip',
                        'resume',
                        'volume',
                        'queue',
                        'loop',
                        'autoplay',
                        'seek',
                        'lyrics'
                    ]
                },
                {
                    name: 'options',
                    required: false,
                    expand: true,
                    // eval: (options: string, args) => {
                    //     let action = args[0].parsedValue;
                    //
                    //     console.log(`received ${action}`);
                    //     if (action == 'seek') throw new Error(options);
                    //     return true;
                    // }
                }
            ]
        });
    }

    async execute(input: Input) {
        let action = input.getArgument('action') as string;
        let options = input.getArgument('options') as string | undefined;

        // Get the users voice channel
        let userVoiceChannel: VoiceChannel = input.member.voiceChannel;

        if (!userVoiceChannel) {
            await input.message.reply(`${Emoji.ERROR} You must be in a voice channel to use this command`);
            return;
        }

        // Get the guilds music data configuration
        let id = input.guild.id;
        let session = trackedGuilds[id] ? trackedGuilds[id] : trackedGuilds[id] = new Session(input.guild, input.channel as TextChannel);
        session.channel = input.channel as TextChannel;

        switch (action) {
            case 'play':
                await session.play(input, options as string);
                break;
            case 'search':
                await session.search(input, options as string);
                break;
            case 'stop':
                await session.terminateConnection();
                break;
            case 'pause':
                await session.pause();
                break;
            case 'skip':
                await session.skip();
                break;
            case 'resume':
                await session.resume();
                break;
            case 'volume':
                await session.volume(options);
                break;
            case 'queue':
                await session.enqueue();
                break;
            case 'loop':
                await session.loop(options);
                break;
            case 'autoplay':
                await session.autoplay(options);
                break;
            case 'seek':
                await session.seek(options);
                break;
            case 'lyrics':
                break;
        }
    }

    getUsage(): string {
        // Override for usage information.
        // If we return a string with multiple lines, the first line is the `command <usage> <info>`.
        // The rest of the lines are shown as help text below it - we can use this to document the actions.

        return super.getUsage();
    }
}