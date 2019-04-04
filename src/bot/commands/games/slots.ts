import { Command, Input } from '@api';

export class Ping extends Command {
    constructor() {
        super({
            name: 'Slot Machine',
            description: 'Creates a slot machine game for the users.'
        });
    }

    execute(input: Input) {

        let emojis = ["🍓", "🍑", "🍀"];

        emojis[0]; "🍓"
        emojis[1]; "🍑" 
        emojis[2]; "🍀"

        let slotA = emojis[Math.floor(Math.random() * emojis.length)];
        let slotB = emojis[Math.floor(Math.random() * emojis.length)];
        let slotC = emojis[Math.floor(Math.random() * emojis.length)];

    }

    
}
