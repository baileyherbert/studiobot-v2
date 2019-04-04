import { Listener } from "@api";
import { Message } from 'discord.js';
import { Experience } from "@bot/libraries/experience";

export class AwardExperience extends Listener
{

    public async onMessage(message: Message) {
        // Skip bots and direct messages
        if (message.channel.type != 'text') return;
        if (message.author.bot) return;

        let member = message.member;

        // Skip if we've already awarded recently
        if (member.settings.lastExperienceAwardTime >= (_.now() - 60000)) return;

        // Set the last award time to now
        member.settings.lastExperienceAwardTime = _.now();

        // Award a random amount of exp and save the settings
        await Experience.awardRandomExperience(member, 10, 20, message.channel);
    }

}
