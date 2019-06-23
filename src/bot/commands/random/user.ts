import { Command, Input } from '@api';
import { Role } from 'discord.js';

let callLimit = 10;

export class User extends Command {
    constructor() {
        super({
            name: 'user',
            aliases: ['randomuser', 'users', 'randomusers', 'randuser', 'randusers'],
            description: 'Picks one or more random users in the guild, optionally by role.',
            arguments: [
                {
                    name: 'role',
                    description: 'An optional role to limit results to.',
                    constraint: 'role',
                    error: true
                },
                {
                    name: 'amount',
                    description: 'The number of users to pick (limit: 20).',
                    constraint: 'number',
                    default: 1,
                    error: true,
                    eval: (input: number) => {
                        if (input <= 0) return false;
                        if (input > callLimit) {
                            throw new Error('Maximum number of users is ' + callLimit);
                        }
                        return true;
                    }
                }
            ]
        });
    }

    async execute(input: Input) {
        let role = input.getArgument('role') as Role | undefined;
        let amount = input.getArgument('amount') as number;
        let names : string[] = [];

        //If role is set find all users in that role
        if (role && amount > 0) {
            if (amount > role.members.size) {
                amount = role.members.size;
            }

            let members = role.members.filter(m => !m.user.bot).random(amount);
            members.forEach(m => names.push(m.displayName));

            await input.channel.send(names.join(', '));
        }

        //Otherwise pick from all users in the guild
        else {
            if (amount > input.guild.memberCount) {
                amount = input.guild.memberCount;
            }

            if (amount) {
                let members = input.guild.members.filter(m => !m.user.bot).random(amount);
                members.forEach(m => names.push(m.displayName));

                await input.channel.send(names.join(', '));
            }
        }
    }
}
