import {Session} from "@libraries/music/session";
import * as path from "path";
import {EventEmitter} from "events";
import * as fs from "fs";
import ytdl = require("ytdl-core");

export class VideoDownloader extends EventEmitter {
    constructor(url: string, server: Session) {
        super();
        url = url.replace(/^.+\.com\//, '');

        let dirPath = path.resolve(rootpath('data/tmp'), server.guild.id);

        try {
            fs.mkdirSync(dirPath)
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }

        let output = path.resolve(dirPath, 'video.mp4');
        let video = ytdl(url, {
            // quality: 'highestaudio',
            // filter: 'audioonly',
            // format: {
            // quality_label: '720p',
            // encoding: 'H.264',
            // container: 'mp4',
            // audioEncoding: 'aac'
            // }
            highWaterMark: 1024 * 1024 * 10 // 10 megabytes
        });

        video.pipe(fs.createWriteStream(output));
        video.on('response', (res) => {
            let totalSize = res.headers['content-length'];
            let dataRead = 0;

            res.on('data', (data: any) => {
                dataRead += data.length;
                let percent = dataRead / totalSize;
                this.emit('progress', percent);
            });

            res.on('end', async () => {
                this.emit('complete', output, video);
            });
        });
    };
}
