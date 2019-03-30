import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role } from 'discord.js';
import { Lobby } from '@bot/libraries/games/lobby'

export class LobbyManager {
    private lobbies : Lobby[];

    constructor(lobbies: Lobby[] = []){
        this.lobbies = lobbies;
    }

    AddLobby(lobby : Lobby) : number{
        this.lobbies.push(lobby);
        return this.lobbies.length - 1;
    }

    BeginGameInLobby(lobbyIndex: number){
        if (this.lobbies[lobbyIndex].GetPlayer(1) !== null && this.lobbies[lobbyIndex].GetPlayer(2) !== null){
            this.lobbies[lobbyIndex].BeginTheGame()
        }
    }

    FindAndRemoveLobby(lobby: Lobby){
        let lobbyIndex : number = this.FindLobby(lobby);

        if (!isNaN(lobbyIndex))
        {
            this.RemoveLobby(lobbyIndex);
        }
    }

    FindLobby(lobby: Lobby) : number {
        for (let index = 0; index < this.lobbies.length; index++){
            if (lobby === this.lobbies[index]){
                return index;
            }
        }
        return NaN;
    }

    GetLobby(lobbyIndex: number) : Lobby {
        return this.lobbies[lobbyIndex];
    }

    GetLobbies() : Lobby[]{
        return this.lobbies;
    }

    GetLobbiesInChannel(server: Guild, channel: TextChannel | DMChannel | GroupDMChannel) : Lobby[]{
        let lobbiesInServer = [];

        for (let index = 0; index < this.lobbies.length; index++){
            if (server.id === this.lobbies[index].GetLobbyServer().id
                && channel.id === this.lobbies[index].GetLobbyChannel().id){
                lobbiesInServer.push(this.lobbies[index]);
            }
            else{
                //Do nothing
            }
        }

        return lobbiesInServer;
    }

    GetNumLobbies() : number{
        return this.lobbies.length;
    }

    RemoveLobby(lobbyIndex: number){
        let lobby: Lobby = this.lobbies[lobbyIndex];
        this.lobbies.splice(lobbyIndex);
        lobby.ShutDown();
    }
}