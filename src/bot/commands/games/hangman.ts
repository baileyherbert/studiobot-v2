import { Command, Input } from '@api';
import * as fs from 'fs';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { DirectMessage } from '@bot/libraries/dm';
import { HangmanGame } from '@bot/libraries/games/hangman';

export class Hangman extends Command {
    private games : {[channelId: string]: HangmanGame | null} = {};

    constructor() {
        super({
            name: 'hangman',
            description: 'Host a game of hangman where other members can guess your word.'
        });
    }

    async execute(input: Input) {
        if (input.channel.id in this.games) {
            return;
        }

        // Place a reservation while the word is entered
        this.games[input.channel.id] = null;

        // Get the word from the host
        let word : string;

        try {
            word = await this.getWordFromHost(input);
        }
        catch (err) {
            delete this.games[input.channel.id];

            if (err.message == 'Collector expired') {
                await input.channel.send('Host did not respond in time, so the game has been cancelled.') as Message;
                return;
            }

            if (err.message == 'Cannot send messages to this user') {
                await input.channel.send(`${input.member} I couldn't send you a direct message to start the hangman game.`);
                return;
            }

            await input.channel.send('Host cancelled the game.') as Message;
            return;
        }

        // Start the game
        let game = this.games[input.channel.id] = new HangmanGame(word);
        let lastMessage = await input.channel.send('The hangman game has begun. Start guessing letters now!\n' + game.getBoard()) as Message;

        // Start collecting
        let collector = input.channel.createMessageCollector(m => /^[a-zA-Z]$/.test(m.content));
        collector.on('collect', (message : Message) => {
            let letter = message.content;

            if (!game.hasGuessed(letter)) {
                game.guess(letter);
            }
        });

        // Listen
        game.on('guess', async (correct: boolean) => {
            let text = correct ? 'Found a new letter! Keep guessing!' : 'That letter was not in the word. Keep guessing!';

            lastMessage.deleteAfter(0);
            lastMessage = await input.channel.send(text + '\n' + game.getBoard()) as Message;
        });

        game.on('finished', async (win: boolean) => {
            lastMessage.deleteAfter(0);

            // Stop the collector
            collector.stop();

            // Expire the game
            delete this.games[input.channel.id];

            // Show output
            let phrase = '\n```' + word + '\n```';
            await input.channel.send((win ? 'The word or phrase was guessed correctly!' : 'The word or phrase was not guessed!') + phrase);
        });

        game.on('expired', async() => {
            lastMessage.deleteAfter(0);

            // Stop the collector
            collector.stop();

            // Expire the game
            delete this.games[input.channel.id];

            // Show output
            await input.channel.send(`The hangman game was ended due to inactivity.`);
        });
    }

    /**
     * Gets the word or phase to use for the game from the host.
     */
    async getWordFromHost(input: Input) {
        await input.member.send('Please reply with the word or phrase you would like to use for your game of hangman.');
        let message = await input.channel.send(input.member.displayName + ', I sent you a direct message. Please respond with the word or phrase to set up.') as Message;

        while (true) {
            let reply = await DirectMessage.promise(input.member, 60000);
            let word = reply.content;

            if (word.replace(/\s\d/, '').length < 4) {
                await input.member.send('Please enter a word or phrase containing at least four letters.');
                continue;
            }

            if (word.replace(/\s\d/, '').length > 40) {
                await input.member.send('Please enter a word or phrase containing no more than 40 letters.');
                continue;
            }

            if (!/^([a-zA-Z\s]+)$/.test(word)) {
                await input.member.send('Word or phrase must only contain letters.');
                continue;
            }

            await message.deleteAfter(0);
            return word.trim().toLowerCase();
        }
    }
}
