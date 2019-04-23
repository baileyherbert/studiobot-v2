import { Command, Input } from '@api';
import { RichEmbed } from 'discord.js';
import { Economy } from '@bot/libraries/economy';

export class Ping extends Command {
    constructor() {
        super({
            name: 'slot',
            aliases: ['slots'],
            description: 'Creates a slot machine game for the users.'
        });
    }


    async execute(input: Input) {
    //"🍒", "⚡", "💸", "💰", "🤑","🍓", "🍑",
        let emojis = ["🍀", "🌸", "🍄"];
        let slot1 = Math.floor((Math.random() * emojis.length));
        let slot2 = Math.floor((Math.random() * emojis.length));
        let slot3 = Math.floor((Math.random() * emojis.length));

        //if won then display that the user has won
        if(emojis[slot1] === emojis[slot2] && emojis[slot1] === emojis[slot3]){
            let wEmbed = new RichEmbed()
                .setFooter("Comgrats, You've Won!")
                .setTitle(':slot_machine: SLOT MACHINE :slot_machine:')
                .addField('Result!', emojis[slot1] + emojis[slot2] + emojis[slot3]);

            await input.channel.send(wEmbed);

            //needs to give use an amount if they win
            Economy.addBalance(input.member, 50);
            await input.channel.send(`:moneybag:  ${input.member} received **$${50}**.`);
        }

        //if not then output you've lost
        else{
            let wEmbed = new RichEmbed()
                .setFooter("You've Lost, Try again?")
                .setTitle(':slot_machine: SLOT MACHINE :slot_machine:')
                .addField('Result', emojis[slot1] + emojis[slot2] + emojis[slot3]);
            input.channel.send(wEmbed);
        }
    }
}
