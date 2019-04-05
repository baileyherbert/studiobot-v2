import { Command, Input } from '@api';
import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role } from 'discord.js';
import { LobbyManager } from '@bot/libraries/games/lobby-manager'
import { TTTLobby } from '@bot/libraries/games/tictactoe/ttt-lobby';
import { Lobby } from '@bot/libraries/games/lobby';
import { RPSLobby } from '@bot/libraries/games/rps/rps-lobby';

export module gameEnums{
    export enum GameTypeEnum {
        TicTacToe = 0,
        RockPaperScissors = 1
    }
}

const gameTypeAlias : string[][] = [
    ['tictactoe', 'ttt', 'tictac', 'tic'],
    ['rps', 'rockpaperscissors', 'rockbeatsall', 'itsnotjustaboulderitsarock']
]

export class QueueJoinGame extends Command {
    private lobbyManager = new LobbyManager();
    private testGameTypeRegexpString : string;
    private gameTypeRegexpStrings : string[] = [];

    constructor() {
        super({
            name: 'game',
            aliases: ['play', 'playgame'],
            description: 'Start or Play a game',
            arguments: [
                {
                    name: 'action',
                    required: true,
                    options: ['start', 'join', 'abort']
                },
                /*{
                    name: 'gameType',
                    required: true,
                    options: ['tictactoe']
                },*/
                {
                    name: 'options',
                    required: false,
                    expand: true
                }
            ]
        });

        this.testGameTypeRegexpString = this.CreateTestGameTypeRegexpString();
    }

    execute(input: Input) {
        let action = input.getArgument('action') as string;
        let options = input.getArgument('options') as string | undefined;

        if (action == 'start') {
            this.start(input, options);
        }
        else if (action == 'join') {
            this.join(input, options, action);
        }
        else if (action == 'abort') {
            this.abort(input, options, action);
        }
    }

    /**
     * Queue a lobby
     *
     * @param input
     * @param options
     */
    private start(input: Input, options: string | undefined) {
        let message: string = this.GetStartMessage();

        input.channel.send(message);
        const filter = (message : Message) => this.CompareGameType(message);
        const collector = input.channel.createMessageCollector(filter);

        let self = this;
        collector.once('collect', function(message){
            let lobby : Lobby | null = null;
            let tttRegexp = new RegExp(self.gameTypeRegexpStrings[gameEnums.GameTypeEnum.TicTacToe]);
            if (message.content.match(tttRegexp)){
                lobby = new TTTLobby(input.guild, input.channel, self.lobbyManager, input.member, null);
            }

            let rpsRegexp = new RegExp(self.gameTypeRegexpStrings[gameEnums.GameTypeEnum.RockPaperScissors]);
            if (message.content.match(rpsRegexp)){
                lobby = new RPSLobby(input.guild, input.channel, self.lobbyManager, input.member, null);
            }

            if (lobby) {
                let indexOfNewLobby = self.lobbyManager.AddLobby(lobby);
                input.channel.send(self.lobbyManager.GetLobby(indexOfNewLobby).GetPlayer(1) + " has been added to new lobby #" + indexOfNewLobby);
            }
        });
    }

    /**
     * Join a lobby
     *
     * @param input
     * @param options
     */
    private join(input: Input, options: string | undefined, action: string) {
        let lobbiesInServer = this.lobbyManager.GetLobbiesInChannel(input.guild, input.channel);
        let message = "Lobbies:";
        this.DisplayAllLobbies(lobbiesInServer, message, input, action);

        const filter = (number: number) => !isNaN(number)
            && this.NumberIsValidLobby(number, lobbiesInServer)
            && this.IsLobbyOpen(lobbiesInServer, number)
            && this.IsAlreadyInLobby(lobbiesInServer, number, input.member);
        const collector = input.channel.createMessageCollector(filter);

        let self = this;
        collector.once('collect', function(number: number) {
            lobbiesInServer[number].AddPlayer(input.member);

            let lobbyIndex = self.lobbyManager.FindLobby(lobbiesInServer[number]);
            if (typeof lobbyIndex === "number")
            {
                self.lobbyManager.BeginGameInLobby(lobbyIndex);
            }
            else{
                //Do nothing
            }
        });
    }

    private abort(input: Input, options: string | undefined, action: string) {
        let lobbiesInServer = this.lobbyManager.GetLobbiesInChannel(input.guild, input.channel);
        if (lobbiesInServer.length <= 0){
            input.channel.send("No lobbies to delete");
            return;
        }

        let message = "Lobbies:";
        this.DisplayAllLobbies(lobbiesInServer, message, input, action);

        const filter = (number: number) => !isNaN(number)
            && this.NumberIsValidLobby(number, lobbiesInServer)
            && !this.IsAlreadyInLobby(lobbiesInServer, number, input.member);
        const collector = input.channel.createMessageCollector(filter);

        let self = this;
        collector.once('collect', function(number: number) {
            self.lobbyManager.FindAndRemoveLobby(lobbiesInServer[number]);
        });
    }

    /**
     * adds the player's name to the message
     *
     * @param player
     */
    private AddPlayerNameToMessage(player: GuildMember) {
        let message = "";
        message += player.displayName + " ";
        return message;
    }

    /**
     * Checks if the message contains any game type
     *
     * @param message
     */
    private CompareGameType(message : Message) : boolean {
        let content : string = message.content;
        let regexp : RegExp = new RegExp(this.testGameTypeRegexpString);
        return regexp.test(content);
    }

    /**
     * Creates regex string to detect a single game type, Used to determine the specific type of game that a lobby will contain
     *
     * @param gameTypeIndex
     */
    private CreateGameTypeRegexpString(gameTypeIndex: number) : string {
        let aliasString : string = ``;
        for (let gameAliasIndex: number = 0; gameAliasIndex < gameTypeAlias[gameTypeIndex].length; gameAliasIndex++) {
            if (gameAliasIndex > 0) {
                aliasString += `|`;
            }
            aliasString += `${gameTypeAlias[gameTypeIndex][gameAliasIndex]}`;
        }

        this.gameTypeRegexpStrings[gameTypeIndex] = `(${aliasString})( |$)`;
        return aliasString;
    }

    /**
     * Creates a regex string to detect any type of game, Used to test user input after using the !game start command
     */
    private CreateTestGameTypeRegexpString() : string {
        let regexpString : string = `(`;
        for (let gameTypeIndex: number = 0; gameTypeIndex < gameTypeAlias.length; gameTypeIndex++) {
            if (gameTypeIndex > 0){
                regexpString += `|`;
            }

            regexpString += this.CreateGameTypeRegexpString(gameTypeIndex);
        }
        regexpString += `)( |$)`;

        return regexpString;
    }

    /**
     * display list of lobbies
     *
     * @param lobbiesInServer
     * @param message
     * @param input
     */
    private DisplayAllLobbies(lobbiesInServer: Lobby[], message: string, input: Input, action: string) {
        for (let index = 0; index < lobbiesInServer.length; index++) {
            let currentLobby = lobbiesInServer[index];

            message += "\n  ";
            message += "[" + index + "] - ";
            if (currentLobby.GetPlayer(1) === null && currentLobby.GetPlayer(2) === null) {
                message += "empty";
            }
            if (currentLobby.GetPlayer(1) !== null) {
                message += this.AddPlayerNameToMessage(currentLobby.GetPlayer(1) as GuildMember);
            }
            if (currentLobby.GetPlayer(2) !== null) {
                message += this.AddPlayerNameToMessage(currentLobby.GetPlayer(2) as GuildMember);
            }
            
            message += String(lobbiesInServer[index].GetType());
        }

        //input.channel.send(message);
        input.channel.send("```" + message + "```");
        input.channel.send(`Select the lobby you wish to ${action}`);
        //input.channel.send(message.replace(/(.+|\n+)/g, '```$1```'));
    }

    /**
     * Gets the message the program displays when the !game start command is used
     */
    private GetStartMessage() : string {
        let message: string = `What game do you want to play. Your options are: \`\`\``;
        for (let index: number = 0; index < gameTypeAlias.length; index++) {
            message += `\n${gameTypeAlias[index]}`;
        }
        message += `\`\`\``;
        return message;
    }

    /**
     * Check if user is already in lobby
     */
    private IsAlreadyInLobby(lobbiesInServer: Lobby[], number: number, member: GuildMember) {
        return lobbiesInServer[number].GetPlayer(1) !== member && lobbiesInServer[number].GetPlayer(2) !== member;
    }

    /**
     * Check if lobby has vacancies
     */
    private IsLobbyOpen(lobbiesInServer: Lobby[], number: number) {
        if (!lobbiesInServer[number]) {
            return false;
        }

        return lobbiesInServer[number].GetPlayer(1) === null || lobbiesInServer[number].GetPlayer(2) === null;
    }

    /**
     * Check if index of lobby is valid
     *
     * @param lobbyNumber
     * @param lobbiesInServer
     */
    private NumberIsValidLobby(lobbyNumber: number, lobbiesInServer: Lobby[]) {
        return lobbyNumber >= 0 && lobbyNumber < lobbiesInServer.length;
    }
}
