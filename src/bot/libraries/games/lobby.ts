import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role } from 'discord.js';
import { LobbyManager } from '@bot/libraries/games/lobby-manager';
import { Logger } from '@core/bot/logger';

export abstract class Lobby {
    protected player1 : GuildMember | null;
    protected player2 : GuildMember | null;

    protected lobbyChannel : TextChannel | DMChannel | GroupDMChannel;
    protected lobbyServer : Guild;

    protected lobbyManager : LobbyManager;

    protected lobbyTypeName : string;

    protected abort : boolean;

    constructor (server: Guild, channel: TextChannel | DMChannel | GroupDMChannel, manager: LobbyManager, lobbyTypeName : string, player1: GuildMember | null = null, player2: GuildMember | null = null){
        this.player1 = player1;
        this.player2 = player2;

        this.lobbyChannel = channel;
        this.lobbyServer = server;

        this.lobbyManager = manager;
        this.lobbyTypeName = lobbyTypeName;

        this.abort = false;
    }

    AddPlayer(player: GuildMember) : string {
        if (this.player1 === null){
            this.player1 = player;
        }
        else if(this.player2 === null){
            this.player2 = player;
        }
        else{
            return "Lobby is full.";
        }

        return "Successfully added player";
    }

    abstract BeginTheGame() : void;

    abstract GameLoop() : void;

    GetLobbyChannel() : TextChannel | DMChannel | GroupDMChannel {
        return this.lobbyChannel;
    }

    GetLobbyServer() : Guild {
        return this.lobbyServer;
    }

    GetPlayer(playerNumber : number) : GuildMember | null {
        if (playerNumber === 1){
            return this.player1;
        }
        if (playerNumber === 2){
            return this.player2;
        }

        return null;
    }

    GetType() : string {
        return this.lobbyTypeName;
    }

    ShutDown() {
        this.abort = true;
        this.lobbyChannel.send(`Aborting ${this.lobbyTypeName} lobby.`)
    }
}
