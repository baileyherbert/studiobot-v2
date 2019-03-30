import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role, MessageReaction, ReactionCollector, Client } from 'discord.js';
import { LobbyManager } from '@bot/libraries/games/lobby-manager';
import { Logger } from '@core/bot/logger';
import { Lobby } from '@bot/libraries/games/lobby';
import { Emoji } from '@bot/libraries/emoji';
import { Framework } from '@core/framework';
import { ReactionListener } from '@bot/libraries/reactions';
//import { Client } from 'socket.io';

export module rpsEnums{
    export enum RPSEnum{
        Rock = '✊',
        Paper = '📰',
        Scissors = '✂'
    }
}

export class RPSLobby extends Lobby {
    public matchups : Map<string, string[]>;

    private firstTo : number;

    private p1Wins : number;
    private p2Wins : number;
    private ties : number;

    private p1Message : Message | Message[] | null;
    private p2Message : Message | Message[] | null;

    private p1Selection : string;
    private p2Selection : string;

    constructor (server: Guild, channel: TextChannel | DMChannel | GroupDMChannel, manager: LobbyManager, player1: GuildMember | null = null, player2: GuildMember | null = null){
        super(server, channel, manager, "Rock-Paper-Scissors", player1, player2);
        
        //string represents the option
        //string array represents what the option beats
        this.matchups = new Map<string, string[]>();
        this.matchups.set(rpsEnums.RPSEnum.Rock, [rpsEnums.RPSEnum.Scissors]);
        this.matchups.set(rpsEnums.RPSEnum.Paper, [rpsEnums.RPSEnum.Rock]);
        this.matchups.set(rpsEnums.RPSEnum.Scissors, [rpsEnums.RPSEnum.Paper]);

        this.firstTo = 3; //3 is a dummy number

        this.p1Wins = 0;
        this.p2Wins = 0;
        this.ties = 0;

        this.p1Message = null;
        this.p2Message = null;

        this.p1Selection = '';
        this.p2Selection = '';
    }

    AddReactionsToMessage(message : Message | Message[] | null){
        if (message){
            (message as Message).react(rpsEnums.RPSEnum.Rock).then(() =>
            (message as Message).react(rpsEnums.RPSEnum.Paper)).then (() =>
            (message as Message).react(rpsEnums.RPSEnum.Scissors))
            .catch(() => (message as Message).channel.send("One of the emojis isn't an emoji you simpleton"));
        }
    }

    BeginTheGame() : void {
        this.lobbyChannel.send("How many wins to finish?");

        const filter = (number : number) => !isNaN(number);
        const collector = this.lobbyChannel.createMessageCollector(filter);

        let self = this;
        collector.once('collect', function(number){
            self.firstTo = Number.parseInt(number.content);
            self.SendInitialRpsDms().then(function() {
                self.GameLoop();
            });
        });
    }

    private CreateVictorMessage(winner: GuildMember | null, winCount: number) {
        let victorMessage: string = ``;
        if (this.player1 && this.player2) {
            victorMessage = `${this.player1.displayName} played ${this.p1Selection}.`
                          + `\n${this.player2.displayName} played ${this.p2Selection}.`;
        }
        if (winner === null) {
            victorMessage += `\n\nIt's a tie. No points have been added for either player.`;
        }
        else {
            victorMessage += `\n\n${winner.displayName} wins this round. ${winner.displayName} now has ${winCount}/${this.firstTo} wins.`;

            if (this.p1Wins >= this.GetNumWinsToEnd() || this.p2Wins >= this.GetNumWinsToEnd()){
                victorMessage += `\n\n${winner.displayName} wins by ${this.p1Wins}/${this.p2Wins} with ${this.ties} ties 🎊`;
            }
        }

        return victorMessage;
    }

    DetermineVictor() : { player : GuildMember | null, wins : number } {
        let p1WinningMatchups = this.matchups.get(this.p1Selection);
        let p2WinningMatchups = this.matchups.get(this.p2Selection);

        if (p1WinningMatchups) {
            if (p1WinningMatchups.includes(this.p2Selection)){
                this.p1Wins++;
                return { player: this.player1, wins: this.p1Wins };
            }
        }

        if (p2WinningMatchups) {
            if (p2WinningMatchups.includes(this.p1Selection)){
                this.p2Wins++;
                return { player: this.player2, wins: this.p2Wins };
            }
        }

        this.ties++;
        return { player: null, wins: this.ties };
    }

    private EndCondition() {
        return this.abort === true || this.p1Wins >= this.GetNumWinsToEnd() || this.p2Wins >= this.GetNumWinsToEnd();
    }

    GameLoop(): void {
        this.InputLoop(this.player1 as GuildMember);        
        this.InputLoop(this.player2 as GuildMember);
    }

    GetMessageByPlayer(player : GuildMember) {
        if (player === this.player1){
            return this.p1Message;
        }
        if (player === this.player2){
            return this.p2Message;
        }
    }

    GetSelectionByPlayer(player : GuildMember) {
        if (player === this.player1){
            return this.p1Selection;
        }
        if (player === this.player2){
            return this.p2Selection;
        }
    }

    GetNumWinsToEnd() : number {
        return this.firstTo;
    }

    async InputLoop(player: GuildMember) {
        if (this.EndCondition()){
            return;
        }
        let message = this.GetMessageByPlayer(player) as Message;

        let filter = (reaction: MessageReaction) => 
        this.IsReactionRPS(reaction) || this.EndCondition();

        if (message) {
            let collector = (message as Message).createReactionCollector(filter);
            let self = this;
            collector.once('collect', (reaction: MessageReaction, reactionCollector) => {
                if (self.EndCondition()){
                    return;
                }
                self.ProcessInput(player, reaction);
                self.InputLoop(player);
            });
        }
    }

    private IsReactionRPS(reaction: MessageReaction) : boolean {
        return (reaction.emoji.name === rpsEnums.RPSEnum.Rock ||
        reaction.emoji.name === rpsEnums.RPSEnum.Paper ||
        reaction.emoji.name === rpsEnums.RPSEnum.Scissors) &&
        reaction.count > 1;
    }

    async ProcessInput(player : GuildMember, input : MessageReaction){
        this.SetSelectionOfPlayer(input.emoji.name, player);
        if (this.p1Selection === '' || this.p2Selection === ''){
            this.SendResponseRpsDm(player);
        }
        else {
            let winnerInfo = this.DetermineVictor();
            this.SendRoundWinnerMessage(winnerInfo.player, winnerInfo.wins);
            this.p1Selection = '';
            this.p2Selection = '';
        }
    }

    async SendInitialRpsDms(){
        let message : string = "Pick one.";

        if (this.player1){
            await this.SendRPSMessage(message, this.player1);
        }
        if (this.player2){
            await this.SendRPSMessage(message, this.player2);
        }
    }

    async SendResponseRpsDm(player: GuildMember){
        let message : string = `Your input was ${this.GetSelectionByPlayer(player)}. You can change your input before your opponent makes theirs.`;
        this.SendRPSMessage(message, player);
    }

    async SendRoundWinnerMessage(winner: GuildMember | null, winCount: number){
        let victorMessage: string = this.CreateVictorMessage(winner, winCount);

        if (this.player1){
            await this.SendRPSMessage(victorMessage, this.player1);
        }
        if (this.player2){
            await this.SendRPSMessage(victorMessage, this.player2);
        }
        this.lobbyChannel.send(victorMessage);
    }

    private async SendRPSMessage(message: string, player: GuildMember) {
        let storedMsg = this.GetMessageByPlayer(player);
        if (storedMsg === undefined || storedMsg === null)
        {
            await player.send(message).then((msg) => {
                this.SetMessageOfPlayer(msg as Message, player);
                this.AddReactionsToMessage(msg);
            });
        }
        else {
            (storedMsg as Message).edit(message);
        }
    }

    private SetMessageOfPlayer(message : Message, player : GuildMember){
        if (player === this.player1){
            this.p1Message = message;
        }
        if (player === this.player2){
            this.p2Message = message;
        }
    }

    private SetSelectionOfPlayer(selection : string, player : GuildMember){
        if (player === this.player1){
            this.p1Selection = selection;
        }
        if (player === this.player2){
            this.p2Selection = selection;
        }
    }
}