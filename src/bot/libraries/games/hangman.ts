import { EventEmitter } from "events";

export class HangmanGame extends EventEmitter {
    private board : Board;
    private word : string;

    private guessed : string[];
    private incorrect = 0;

    private startTime : number;
    private lastActivityTime : number;
    private expirationTimeout: NodeJS.Timeout | undefined;

    constructor(word: string) {
        super();

        this.board = new Board(this);
        this.word = word;
        this.guessed = [];
        this.startTime = this.lastActivityTime = (new Date()).getTime();

        this.heartbeat();
    }

    /**
     * Gets the word to guess. Can be multiple words separated by spaces.
     */
    getWord() {
        return this.word;
    }

    /**
     * Returns the total number of incorrect guesses.
     */
    getIncorrect() {
        return this.incorrect;
    }

    /**
     * Returns true if the given letter has been guessed already.
     */
    hasGuessed(letter: string) {
        this.heartbeat();
        return this.guessed.indexOf(letter.toLowerCase()) >= 0;
    }

    /**
     * Guesses the letter and returns `true` if the guess was correct.
     */
    guess(letter: string) : boolean {
        this.heartbeat();
        this.guessed.push(letter = letter.toLowerCase());

        if (this.word.indexOf(letter) >= 0) {
            if (this.won()) {
                if (this.expirationTimeout) {
                    clearTimeout(this.expirationTimeout);
                }

                this.emit('finished', true);
                return true;
            }

            this.emit('guess', true);
            return true;
        }
        else {
            if (++this.incorrect >= 7) {
                if (this.expirationTimeout) {
                    clearTimeout(this.expirationTimeout);
                }

                this.emit('finished', false);
                return false;
            }

            this.emit('guess', false);
            return false;
        }
    }

    /**
     * Returns an array of all letters that have not yet been guessed.
     */
    getAvailableLetters() {
        return 'abcdefghijklmnopqrstuvwxyz'.split('').filter(letter => {
            return !this.hasGuessed(letter);
        });
    }

    /**
     * Returns the board renderer for this hangman game.
     */
    getBoard() {
        return this.board;
    }

    /**
     * Returns true if the game has been won, false otherwise.
     */
    won() {
        let letters = this.getWord().split('');

        for (let i = 0; i < letters.length; i++) {
            if (letters[i] == ' ') continue;
            if (!this.hasGuessed(letters[i])) return false;
        }

        return true;
    }

    /**
     * Returns the time the game started.
     */
    getStartTime() {
        return this.startTime;
    }

    /**
     * Returns the number of milliseconds since the game's last activity.
     */
    getLastActivity() {
        return (new Date()).getTime() - this.lastActivityTime;
    }

    /**
     * Returns the word, with all letters that haven't yet been guessed replaced with underscores.
     */
    toString() {
        let letters = this.getWord().split('');
        let output : string[] = [];

        letters.forEach(letter => {
            output.push((this.hasGuessed(letter) || letter == ' ') ? letter : '_');
        });

        return output.join(' ');
    }

    /**
     * Updates the internal activity timer.
     */
    private heartbeat() {
        if (this.expirationTimeout) {
            clearTimeout(this.expirationTimeout);
        }

        this.lastActivityTime = (new Date()).getTime();
        this.expirationTimeout = setTimeout(() => this.emit('expired'), 3600000);
    }
}

export class Board {
    private hangman : HangmanGame;

    constructor(hangman: HangmanGame) {
        this.hangman = hangman;
    }

    renderBoard() {
        let i = this.hangman.getIncorrect();

        let noose = i >= 7 ? '|' : ' ';
        let head = i >= 1 ? 'o' : ' ';
        let leftArm = i >= 3 ? '/' : ' ';
        let rightArm = i >= 4 ? '\\' : ' ';
        let torso = i >= 2 ? '|' : ' ';
        let leftLeg = i >= 5 ? '/' : ' ';
        let rightLeg = i >= 6 ? '\\' : ' ';

        return `    -------
    ${noose}     |
    ${head}     |
   ${leftArm}${torso}${rightArm}    |
   ${leftLeg} ${rightLeg}    |
         ---`;
    }

    renderWord() {
        return this.hangman.toString();
    }

    /**
     * Draws the board to a monospaced string which can be drawn in a code block.
     */
    toString() {
        let board = this.renderBoard();
        let word = this.renderWord();

        return '```\n' + board + '\n```\n```' + word + '\n```';
    }
}
