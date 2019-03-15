import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role, MessageReaction, Client } from 'discord.js';
import { LobbyManager } from '@bot/libraries/games/lobby-manager';
import { Logger } from '@core/bot/logger';
import { Lobby } from '@bot/libraries/games/lobby';
import { Emoji } from '@bot/libraries/emoji';
import { Framework } from '@core/framework';
//import { Client } from 'socket.io';

export module rpsEnums{
    export enum RPSEnum{
        Rock = '✊',
        Paper = '📰',
        Scissors = '✂'
    }
}

export class RPSLobby extends Lobby {
    private firstTo : number;

    private p1Wins : number;
    private p2Wins : number;

    private p1Message : Message | Message[] | null;
    private p2Message : Message | Message[] | null;

    private p1Selection : string;
    private p2Selection : string;

    constructor (server: Guild, channel: TextChannel | DMChannel | GroupDMChannel, manager: LobbyManager, player1: GuildMember | null = null, player2: GuildMember | null = null){
        super(server, channel, manager, "Rock-Paper-Scissors", player1, player2);
        this.firstTo = 3; //3 is a dummy number

        this.p1Wins = 0;
        this.p2Wins = 0;

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

    GameLoop(): void {
        const filter = (reaction: MessageReaction) => this.IsReactionRPS(reaction);
        this.InputLoop(this.p1Message as Message, this.player1 as GuildMember, this.p1Selection, filter);        
        this.InputLoop(this.p2Message as Message, this.player2 as GuildMember, this.p2Selection, filter);
    }

    GetNumWinsToEnd() : number {
        return this.firstTo;
    }

    async InputLoop(message: Message, player: GuildMember, selection: string, filter: (reaction: MessageReaction) => boolean) {
        if (message) {
            const collector = (message as Message).createReactionCollector(filter);
            let self = this;
            collector.once('collect', (reaction: MessageReaction, reactionCollector) => {
                self.ProcessInput(player, message, selection, reaction);
                self.InputLoop(message, player, selection, filter);
            });
        }
    }

    private IsReactionRPS(reaction: MessageReaction) : boolean {
        console.log (reaction.emoji.name + " " + rpsEnums.RPSEnum.Rock + " " + rpsEnums.RPSEnum.Paper + " " + rpsEnums.RPSEnum.Scissors);
        return (reaction.emoji.name === rpsEnums.RPSEnum.Rock ||
        reaction.emoji.name === rpsEnums.RPSEnum.Paper ||
        reaction.emoji.name === rpsEnums.RPSEnum.Scissors);
    }

    async ProcessInput(player : GuildMember, message : Message, selection : string, input : MessageReaction){
        /*if (message.author.dmChannel.){
            message.clearReactions();
            this.AddReactionsToMessage(message);
        }
        else {*/
            await this.SendInitialRpsDms();
        /*}*/
        selection = input.emoji.name;

        /*for (let index : number = 0; index < message.reactions.size; index++){
            if (message.reactions.array()[index].emoji.name !== input.emoji.name &&
                message.reactions.array()[index].users.has(player.displayName)){
                    message.reactions.array()[index].users.delete(player.displayName);
            }
        }*/
    }

    async SendInitialRpsDms(){
        let message : string = "It's time for Rock Paper Scissors. Pick one.";

        if (this.player1){
            await this.player1.send(message).then((msg) => {
                this.p1Message = msg;
                this.AddReactionsToMessage(this.p1Message);
                console.log(`${this.p1Message} ${this.p2Message} at SendInitialRpsDms`);
            });
        }
        if (this.player2){
            await this.player2.send(message).then((msg) => {
                this.p2Message = msg;
                this.AddReactionsToMessage(this.p2Message);
                console.log(`${this.p1Message} ${this.p2Message} at SendInitialRpsDms`);
            });
        }
    }
}