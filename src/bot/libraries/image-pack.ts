import { Logger } from '@core/bot/logger';

import path from 'path';
import fs from 'fs';
import request from 'request-promise';
import admZip from 'adm-zip';

export class ImagePack {
    protected dirPath: string;
    protected images: string[];
    protected logger: Logger;

    public constructor(protected name: string) {
        this.logger = new Logger('lib:image-pack');
        this.dirPath = path.resolve(pub('packs'), name);
        this.images = [];

        this.scan();
    }

    /**
     * Returns a random image in the pack as a buffer.
     */
    public getRandomBuffer(): Buffer {
        return fs.readFileSync(path.join(this.dirPath, _.sample(this.images)!));
    }

    /**
     * Returns a random image in the pack as a buffer.
     */
    public getRandomPath(): string {
        return path.join(this.dirPath, _.sample(this.images)!);
    }

    /**
     * Returns `true` if the pack is installed, or `false` otherwise. For packs that need to be installed, you can
     * call the `install()` method and it will take care of the rest for you.
     */
    public isInstalled() {
        return fs.existsSync(this.dirPath) && this.images.length > 0;
    }

    /**
     * Downloads the image pack and installs it locally. This will delete an existing installation, so you can also use
     * this for updates.
     */
    public async install() {
        // Download the pack as a zipped archive
        let buffer = await this.download();

        // Clean and prepare the file system
        await this.prepare();

        // Extract the archive
        await this.extract(buffer);

        // Update local variables
        this.scan();

        // Done
        this.logger.info(`Downloaded and installed the latest ${this.name} image pack.`);
    }

    /**
     * Downloads the image pack.
     */
    protected async download(): Promise<Buffer> {
        let uri = `https://www.bailey.sh/packs/${this.name}.zip`;
        let data = await request({ uri, gzip: true, encoding: null, rejectUnauthorized: false });

        return data;
    }

    /**
     * Deletes existing files in the image pack and ensures directories exist.
     */
    protected async prepare(): Promise<void> {
        let packsDirPath = pub('packs');
        let packDirPath = path.join(packsDirPath, this.name);

        // Create the packs directory
        if (!fs.existsSync(packsDirPath)) {
            fs.mkdirSync(packsDirPath);
        }

        // Delete existing files
        if (fs.existsSync(packDirPath)) {
            fs.readdirSync(packDirPath).forEach(file => {
                let filePath = path.join(packDirPath, file);
                fs.unlinkSync(filePath);
            });
        }

        // Create the target directory
        if (!fs.existsSync(packDirPath)) {
            fs.mkdirSync(packDirPath);
        }
    }

    /**
     * Extracts a zipped archive to the target directory.
     */
    protected async extract(buffer: Buffer): Promise<void> {
        let zip = new admZip(buffer);

        zip.getEntries().forEach(entry => {
            let savePath = path.join(this.dirPath, entry.name);
            fs.writeFileSync(savePath, entry.getData());
        });
    }

    /**
     * Scans the installed pack directory for images.
     */
    protected scan() {
        if (fs.existsSync(this.dirPath)) {
            this.images = fs.readdirSync(this.dirPath);
        }
    }
}
