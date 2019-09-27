import {Command, Input} from '@api';
import {RichEmbed} from 'discord.js';
import {Economy} from '@bot/libraries/economy';
import {Emoji} from "@libraries/emoji";

export class Slots extends Command {
    constructor() {
        super({
            name: 'slot',
            aliases: ['slots'],
            description: 'Creates a slot machine game for the users.',
            arguments: [
                {
                    name: 'amount',
                    constraint: 'number',
                    required: false,
                    default: 5,
                    eval: (input, args, message) => {
                        if (input < 1) return false;
                        return true;
                    }
                }
            ]
        });
    }

    async execute(input: Input) {
        let amount = Math.floor(input.getArgument('amount') as number);

        // Reject if the balance is not enough
        if (amount > input.member.settings.currency) {
            await input.channel.send(`${Emoji.ERROR}  Insufficient funds. The most you can bet is **$${input.member.settings.currency.toFixed(2)}**.`);
            return;
        }

        //"🍒", "⚡", "💸", "💰", "🤑","🍓", "🍑",
        let emojis = ["🍀", "🌸", "🍄"];
        let slot1 = Math.floor((Math.random() * emojis.length));
        let slot2 = Math.floor((Math.random() * emojis.length));
        let slot3 = Math.floor((Math.random() * emojis.length));

        //if won then display that the user has won
        if (emojis[slot1] === emojis[slot2] && emojis[slot1] === emojis[slot3]) {
            let wEmbed = new RichEmbed()
                .setFooter("Congrats, You've Won!")
                .setTitle(':slot_machine: SLOT MACHINE :slot_machine:')
                .addField('Result!', emojis[slot1] + emojis[slot2] + emojis[slot3]);

            await input.channel.send(wEmbed);

            //needs to give use an amount if they win
            let winAmt = amount * 10;
            await Economy.addBalance(input.member, winAmt);
            await input.channel.send(`:moneybag:  ${input.member} received **$${winAmt}**.`);
        }

        //if not then output you've lost
        else {
            let wEmbed = new RichEmbed()
                .setFooter("You've Lost, Try again?")
                .setTitle(':slot_machine: SLOT MACHINE :slot_machine:')
                .addField('Result', emojis[slot1] + emojis[slot2] + emojis[slot3]);
            await Economy.removeBalance(input.member, amount);
            input.channel.send(wEmbed);
        }
    }
}
