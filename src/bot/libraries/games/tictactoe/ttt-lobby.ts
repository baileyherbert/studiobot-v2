import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role } from 'discord.js';
import { TTTBoard, boardEnums } from '@bot/libraries/games/tictactoe/ttt-board';
import { LobbyManager } from '@bot/libraries/games/lobby-manager';
import { Logger } from '@core/bot/logger';
import { Lobby } from '@bot/libraries/games/lobby';
const CenterX = 1;
const CenterY = 1;

module tttEnums {
    export enum TurnEnum {
        Searching = 0,
        Player1 = 1,
        Player2 = 2,
        Complete = 3
    }

    export enum rowColumnEnum {
        A = 1,
        B = 2,
        C = 3
    }
}

export class TTTLobby extends Lobby {
    private currentTurn : tttEnums.TurnEnum;

    private board : TTTBoard;
    private player1Space : boardEnums.SpaceEnum;
    private player2Space : boardEnums.SpaceEnum;

    private boardMessage : Message | null;
    private turnMessage : Message | null;

    private rowString : string;
    private colString : string;

    constructor (server: Guild, channel: TextChannel | DMChannel | GroupDMChannel, manager: LobbyManager, player1: GuildMember | null = null, player2: GuildMember | null = null){
        super(server, channel, manager, "Tic-Tac-Toe", player1, player2);
        this.currentTurn = tttEnums.TurnEnum.Searching;

        this.board = new TTTBoard();
        this.player1Space = boardEnums.SpaceEnum.X;
        this.player2Space = boardEnums.SpaceEnum.O;

        this.boardMessage = null;
        this.turnMessage = null;

        this.rowString = `${tttEnums.rowColumnEnum[tttEnums.rowColumnEnum.A]}`
                  + `${tttEnums.rowColumnEnum[tttEnums.rowColumnEnum.B]}`
                  + `${tttEnums.rowColumnEnum[tttEnums.rowColumnEnum.C]}`;

        this.colString = `${tttEnums.rowColumnEnum.A}`
                       + `${tttEnums.rowColumnEnum.B}`
                       + `${tttEnums.rowColumnEnum.C}`;
    }

    AddPlayer(player: GuildMember){
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

    BeginTheGame(){
        this.currentTurn = /*lodash*/_.random(tttEnums.TurnEnum.Player1, tttEnums.TurnEnum.Player2);
        this.GameLoop();
    }

    BeginNewTurn() {
        if (this.boardMessage === null) {
            this.lobbyChannel.send(this.board.GetBoardVisual()).then((msg)=>{
                this.boardMessage = msg as Message;
            });
        }
        else {
            this.boardMessage.edit(this.board.GetBoardVisual())
            //Fixes the issue with deleting the board.
            .catch(err => {
                console.log(err);
                this.ShutDown();
            });
        }

        let playerWithTurn = this.GetPlayerWithTurn();
        let playerSpaceIcon = this.GetPlayerWithTurnSpaceIcon();
        
        if (playerWithTurn) {
            let turnMsgText = `\n${playerWithTurn.displayName}'s turn`;

            if (this.turnMessage === null) {
                this.lobbyChannel.send(turnMsgText).then((msg)=>{
                    this.turnMessage = msg as Message;
                });
            }
            else {
                this.turnMessage.edit(turnMsgText)
                .catch(err => {
                    console.log(err);
                    this.lobbyChannel.send(turnMsgText).then((msg)=>{
                        this.turnMessage = msg as Message;
                    });
                });
            }
        }
        return { playerWithTurn, playerSpaceIcon };
    }

    GameLoop(){
        if (this.abort){
            return;
        }

        let { playerWithTurn, playerSpaceIcon } = this.BeginNewTurn();

        let doReturn: boolean = this.IsGameOver();
        if (doReturn){
            if (this.turnMessage)
            {
                this.turnMessage.delete();
            }
            this.lobbyManager.FindAndRemoveLobby(this);
            return;
        }

        let coordinateRegex = new RegExp('([' + this.rowString + this.colString + '])', 'gi');
        const filter = (message : Message) => 
                                (message.member === playerWithTurn
                                && coordinateRegex.test(message.content))
                                || this.abort === true;
        
        const collector = this.lobbyChannel.createMessageCollector(filter);


        let successfullyChangedTile = false;
        let self = this;
        collector.once('collect', function(message){
            if (self.abort === true){
                return;
            }

            let verticalInput: string | null = self.GetInput(self, message, new RegExp('([' + self.colString + '])', 'i'));
            let horizontalInput: string | null = self.GetInput(self, message, new RegExp('([' + self.rowString + '])', 'i'));

            let x : number = 1;
            let y : number = 1;

            if (verticalInput !== null && !isNaN(Number(verticalInput))){
                y = Number(verticalInput) - 1;
            }

            //TODO: figure out a better way to do this
            if (horizontalInput !== null){
                if (horizontalInput.toUpperCase() === "A"){
                    x = tttEnums.rowColumnEnum.A - 1;
                }
                else if (horizontalInput.toUpperCase() === "B"){
                    x = tttEnums.rowColumnEnum.B - 1;
                }
                else if (horizontalInput.toUpperCase() === "C"){
                    x = tttEnums.rowColumnEnum.C - 1;
                }
            }

            message.delete();
            successfullyChangedTile = self.board.ChangeTile(x, y, playerSpaceIcon as boardEnums.SpaceEnum);

            if (successfullyChangedTile){
                //flips player turn

                self.currentTurn = (self.currentTurn === tttEnums.TurnEnum.Player1
                    ? tttEnums.TurnEnum.Player2 : tttEnums.TurnEnum.Player1);
            }

            self.GameLoop();
        });
    }

    GetInput(self: this, message: Message, regexp: RegExp) {
        let input: string | null = null;

        if (regexp.test(message.content)) {
            let match: RegExpMatchArray | null = message.content.match(regexp);
            if (match) {
                input = String(match[0]);
            }
        }
        return input;
    }

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

    GetPlayerWithTurn() : GuildMember | null {
        let playerWithTurn : GuildMember | null = null;
        if (this.currentTurn === tttEnums.TurnEnum.Player1) {
            playerWithTurn = this.player1;
        }
        else /*if (this.currentTurn === tttEnums.TurnEnum.Player2)*/ {
            playerWithTurn = this.player2;
        }
        return playerWithTurn;
    }

    GetPlayerWithTurnSpaceIcon() : boardEnums.SpaceEnum | undefined {
        let xo;
        if (this.currentTurn === tttEnums.TurnEnum.Player1) {
            xo = this.player1Space;
        }
        else if (this.currentTurn === tttEnums.TurnEnum.Player2) {
            xo = this.player2Space;
        }
        return xo;
    }

    IsGameOver() {
        let winner = this.board.CheckForWinner();
        if (winner === this.player1Space) {
            this.lobbyChannel.send(`${this.player1} wins`);
            return true;
        }
        if (winner === this.player2Space) {
            this.lobbyChannel.send(`${this.player2} wins`);
            return true;
        }
        if (winner !== null) {
            this.lobbyChannel.send(`A tie, as per usual`);
            return true;
        }
        return false;
    }
}