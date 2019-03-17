import {SongInfo} from "@libraries/music/song-info";
import {Guild, GuildMember, Message, StreamDispatcher, TextChannel, VoiceConnection} from "discord.js";
import {MusicMessagePlayer} from "@libraries/music/music-message-player";
import {Input} from "@api";
import {getInfo, validateURL} from "ytdl-core";
import {VideoDownloader} from "@libraries/music/video-download";
import {numberedList} from "@libraries/utilities/numbered-list";
import {Emoji} from "@libraries/emoji";
import {searchyt} from "@libraries/music/search-yt";
import {userRangedChoice} from "@libraries/utilities/user-range-choice";
import {parseDuration} from "@libraries/prettify-ms";

// TODO : Add volume buttons
// TODO : Add a queue embed
// TODO : Add session specific 'queue' of up to 100 song references for prev / next functions
// TODO : For the queue, add 'suggestions' that the users can easily use to add songs to the queue
// TODO : Add support for soundcloud.

export class Session {
    public guild: Guild;
    public currentlyPlaying?: SongInfo;
    public connection?: VoiceConnection;
    public channel: TextChannel;
    public dispatcher?: StreamDispatcher;
    public queue: SongInfo[];
    public autoplaying: boolean;
    public skipping: boolean;
    public messagePlayer?: MusicMessagePlayer;
    public paused = false;
    public timeOffset = 0;

    constructor(guild: Guild, channel: TextChannel) {
        this.guild = guild;
        this.channel = channel;
        this.queue = [];
        this.autoplaying = false;
        this.skipping = false;
    };

    private async playUrl(url: string, member: GuildMember) {
        let info = await getInfo(url);

        let songInfo = new SongInfo(info.title, info, member, this.channel);

        await this.playQueue(songInfo);
    }

    async playQueue(video: SongInfo) {
        this.queue.push(video);

        if (!this.connection) {
            this.connection = await video.requester.voiceChannel.join();
            this.currentlyPlaying = this.queue.shift();
            await this.startStream();
        }
        else {
            await video.textChannel.send(`Added **${video.title}** to the queue at position **${this.queue.length}**`);
        }
    }

    async startStream() {
        if (!this.currentlyPlaying)
            throw new Error('Called startStream on an un-initialized server');

        let dl = new VideoDownloader(this.currentlyPlaying.url, this);
        // let progressBar = new ProgressBar(`Buffering Song... **${this.currentlyPlaying.title}**`, this.currentlyPlaying.textChannel);
        // await progressBar.initialize();

        let percent = 0;
        let msgFunc = () => `${Emoji.LOADING}  Buffering **${this.currentlyPlaying!.title}** (${(percent * 100).toFixed(0)})%`;
        let message = await this.currentlyPlaying.textChannel.send(msgFunc()) as Message;

        // dl.on('progress', percent => progressBar.update(percent));
        dl.on('progress', p => {
            percent = p;
        });

        let id = setInterval(async () => {
            if (!message || !this.currentlyPlaying) clearInterval(id);
            else if (percent < 1) await message.edit(msgFunc());
            else clearInterval(id);
        }, 1000);

        dl.on('complete', async (file) => {
            await message.delete();
            if (!this.currentlyPlaying) throw new Error('Called startStream on an un-initialized server');
            this.currentlyPlaying.file = file;
            await this.seekStream(0);
            if (this.currentlyPlaying)
                if (!this.messagePlayer) {
                    this.messagePlayer = new MusicMessagePlayer(this);
                    await this.messagePlayer.initialise();
                }
                else await this.messagePlayer.repost();
        });
    }

    async seekStream(timeStamp: number) {
        if (!this.connection || !this.currentlyPlaying)
            throw new Error("Seek stream called on an unprepared server!");
        if (!this.currentlyPlaying.file)
            throw new Error("Server is ready, but no music file is set.");

        let defaultVolume = this.guild.settings.voice.volume;
        let t = timeStamp || 0;
        this.timeOffset = t;

        this.skipping = true;
        this.dispatcher = await this.connection.playFile(this.currentlyPlaying.file,
            {
                seek: t,
                volume: defaultVolume,
                passes: 10,
                bitrate: 96000
            });
        this.dispatcher.setVolume(defaultVolume);
        this.createListeners();
        // await this.messagePlayer!.update(this.currentlyPlaying);
        this.skipping = false;
    }

    private async playNextOrEnd() {
        if (this.skipping) return;
        this.skipping = true;
        if (this.queue.length <= 0 && this.autoplaying) {
            await this.queueRelated();
        }

        if (this.queue.length > 0) {
            this.currentlyPlaying = this.queue.pop();
            await this.startStream();
            this.skipping = false;
            return;
        }
        if (this.currentlyPlaying)
            await this.currentlyPlaying.textChannel.send('End of queue reached, leaving the voice channel.');
        await this.terminateConnection();
        this.skipping = false;
    }

    public async terminateConnection() {
        this.skipping = true;
        this.currentlyPlaying = undefined;
        if (this.dispatcher) this.dispatcher = undefined;
        if (this.connection) {
            this.connection.disconnect();
            this.connection = undefined;
        }
        if (this.messagePlayer) await this.messagePlayer.clean();
        this.skipping = false;
    }

    createListeners() {
        if (!this.dispatcher || !this.currentlyPlaying)
            throw new Error('Called set listeners before stream was created');
        this.dispatcher.on('end', async () => {
            await this.playNextOrEnd();
        });
        this.dispatcher.on('start', async () => {
            if (!this.currentlyPlaying) return;
            // await this.currentlyPlaying.textChannel.send(`Now playing **${this.currentlyPlaying.title}**`)
        });
    }

    async enqueue() {
        if (!this.dispatcher || !this.currentlyPlaying) {
            await this.channel.send(`A song must currently be playing to use this command`);
            return;
        }
        if (this.queue.length <= 0) {
            await this.channel.send(`**The queue is empty**`);
            return;
        }

        await this.channel.send(numberedList(this.queue, 'title'));
    }

    async volume(volString: string | undefined) {
        if (volString == null) {
            return await this.channel.send(`Volume is currently **${this.guild.settings.voice.volume * 100}**%`);
        }

        let number = parseFloat(volString);

        if (!(!isNaN(number) && number <= 100 && number >= 1)) {
            return await this.channel.send(`Input must be a number from 1-100`);
        }

        this.guild.settings.voice.volume = number / 100;
        let vol = this.guild.settings.voice.volume;
        await this.guild.settings.save();

        if (this.dispatcher)
            this.dispatcher.setVolume(vol);

        await this.channel.send(`Setting volume to **${vol * 100}**%`);
    }

    async seek(options: string | undefined) {
        if (!this.dispatcher || !this.currentlyPlaying) {
            await this.channel.send(`A song must currently be playing to use this command`);
            return;
        }

        if (options == null) {
            await this.channel.send(`Enter the time in seconds to seek to`);
            return;
        }

        let number = parseFloat(options);
        let songLength = parseInt(this.currentlyPlaying.info.length_seconds);

        if (!(!isNaN(number) && number <= songLength && number >= 0)) {
            await this.channel.send(`Input must be a number from 1-${parseDuration(songLength)}`);
            return;
        }

        await this.seekStream(number);
    }

    async resume() {
        if (!this.dispatcher || !this.currentlyPlaying) {
            await this.channel.send(`A song must currently be playing to use this command`);
            return;
        }
        if (!this.dispatcher.paused) {
            await this.channel.send(`Music player is already playing`);
            return;
        }

        this.dispatcher.resume();
        this.paused = false;
        // await this.channel.send(`Resuming **${this.currentlyPlaying.title}**`);
    }

    async skip() {
        if (!this.dispatcher || !this.currentlyPlaying) {
            return await this.channel.send(`A song must currently be playing to use this command`);
        }

        this.dispatcher.emit('end');

        // let msg = await this.channel.send(`Skipping ${this.currentlyPlaying.title}`) as Message;
        // await sleep(2000);
        // await msg.delete();
    }

    async pause() {

        if (!this.dispatcher || !this.currentlyPlaying) {
            return await this.channel.send(`${Emoji.ERROR} A song must currently be playing to use this command`);
        }

        if (this.dispatcher.paused) {
            return await this.channel.send(`${Emoji.ERROR} Music player is already paused`);
        }

        this.dispatcher.pause();
        this.paused = true;
        // await this.channel.send(`${Emoji.SUCCESS} Pausing **${this.currentlyPlaying.title}**`);
    }

    async search(input: Input, options: string | undefined) {
        if (options == null) {
            return await input.channel.send(`${Emoji.ERROR} Must specify a search term to this command`);
        }

        let ytresults = (await searchyt(options)).splice(0, 10);

        let choiceVid = await userRangedChoice(input, ytresults, 'title');

        await this.playUrl(choiceVid.url, input.member);
    }

    async play(input: Input, options: string | undefined) {
        if (options == null) {
            return await this.channel.send(`${Emoji.ERROR} Must specify a url or search term to use this command`);
        }

        let url = validateURL(options) ? options : (await searchyt(options))[0].url;

        await this.playUrl(url, input.member);
    }

    async autoplay(options: string | undefined) {
        if (options == null) {
            return await this.channel.send(`${Emoji.HELP}  Autoplay is currently set to ${this.autoplaying}`);
        }

        if (/yes|1|true|on|/.test(options)) this.autoplaying = true;
        else if (/0|false|no|off/.test(options)) this.autoplaying = false;
        return await this.channel.send(`${Emoji.SUCCESS}  Setting autoplay to ${this.autoplaying}`);
    }

    async loop(options: string | undefined) {
        if (!this.dispatcher || !this.currentlyPlaying) {
            await this.channel.send(`A song must currently be playing to use this command`);
            return;
        }

        if (options == null) {
            return await this.channel.send(`Enter the time in seconds to seek to`);
        }

        let number = parseFloat(options);

        if (!(!isNaN(number) && number <= 10 && number >= 1)) {
            return await this.channel.send(`Input must be a number from 1-100`);
        }


    }

    private async queueRelated() {
        if (!this.currentlyPlaying) return;
        let relatedList = [];

        let index;
        for (index in this.currentlyPlaying.info.related_videos) {
            let related = this.currentlyPlaying.info.related_videos[index];
            if (!related.id) continue;
            relatedList.push(related);
        }

        let chosen = relatedList[Math.floor(Math.random() * relatedList.length / 3)];
        while (!chosen.id)
            chosen = relatedList[Math.floor(Math.random() * relatedList.length / 3)];
        let videoInfo = `https://www.youtube.com/watch?v=${chosen.id}`;

        // console.log(`queueing related`);
        await this.playUrl(videoInfo, this.currentlyPlaying.requester);
    }
}