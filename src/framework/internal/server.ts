import * as SocketIO from 'socket.io';
import { Server as SocketServer } from 'socket.io';
import { Framework } from '@core/framework';

export class Server {

    private port : number;
    private socket : SocketServer;

    /**
     * Constructs a new server instance.
     */
    constructor(port?: number) {
        this.port = port || 3121;
        this.socket = SocketIO();
    }

    /**
     * Starts the server.
     */
    public start() {
        this.socket.listen(this.port);
        this.socket.on('connection', socket => {
            // Send announcements
            socket.on('announce', (message: string) => {
                Framework.getClient().guilds.forEach(guild => {
                    let channel = guild.getDefaultChannel();

                    if (channel) {
                        channel.send(`:loudspeaker:  ${message}`);
                    }
                });
            });

            // Send test announcements
            socket.on('announce:test', (message: string) => {
                let target = Framework.getClient().guilds.get('535655348858519572');

                if (target) {
                    let channel = target.getDefaultChannel();

                    if (channel) {
                        channel.send(`:loudspeaker:  ${message}`);
                    }
                }
            });

            // Stop the bot
            socket.on('stop', () => {
                Framework.shutdown();
            });

            // Start updating the bot
            socket.on('update:start', () => {
                Framework.startUpdateProcedure();
                Framework.setStatus('dnd');
                Framework.setActivity('Updating (0%)...');
            });

            // Set update progress
            socket.on('update:progress', (percent: number) => {
                Framework.setActivity(`Updating (${percent}%)...`);
            });

            // Eval
            socket.on('eval', (code: string) => {
                try {
                    eval(code);
                }
                catch (err) {
                    Framework.getLogger().error('Evaluation error:', err);
                }
            });
        });
    }

    /**
     * Stops the server.
     */
    public stop() : Promise<void> {
        return new Promise(resolve => {
            this.socket.close(resolve);
        });
    }

}
