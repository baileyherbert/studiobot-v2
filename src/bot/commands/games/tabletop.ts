import { Command, Input } from '@api';
import { Framework } from '@core/framework';

export class Tabletop extends Command {
    constructor() {
        super({
            name: 'tabletop',
            aliases: ['cards'],
            description: 'Starts or joins a game of cards against humanity.'
        });
    }

    async execute(input: Input) {
        // Player 1 calls for a game. Game is started on the channel.
        // Player 2+ calls for a game. Gets added to existing game with a deck.
        // If nobody joined the game, cancel.
        // Enter main game loop:
        // - Host chooses a black card.
        // - Players choose their white cards from their deck.
        // - After all players choose, the results are displayed.
    }
}
