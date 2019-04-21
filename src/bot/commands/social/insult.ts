import { Command, Input } from '@api';
import { GuildMember} from 'discord.js';
import * as FS from 'fs';

const filepath = 'random/insults.txt';
const insults = readPublicFile(filepath).split(/[\n]/);

export class Insult extends Command {
    constructor(){
        super({
            name: 'insult',
            aliases: ['mean'],
            description: 'Insult someone.',
            arguments: [{
                name: 'user',
                description: 'The scumbag to insult!!!!',
                constraint: 'mention',
                required: true
            },
            {
                name: 'new_insult',
                description: 'the insult to add to the list',
                constraint: 'string',
                required: false,
                default: ""
            },
            /*{
                name: 'update',
                description: 'update list of insults with the new insult?',
                constraint: 'boolean',
                required: false,
                default: false
            }*/
        ]
        });
    }

    execute(input: Input) {
        let user : GuildMember = input.getArgument('user') as GuildMember;
        let newIns = this.FilterNewInsult(input);
        //let update = input.getArgument('update') as boolean;

        /*if (input.member.user.username !== "KoiosPolus") {
            this.HideSource(input);
        }*/

        if (newIns === '' || newIns.match(/[^ ]/) === null) {
            this.RandomInsult(input, user);
        }
        else {
            /*if (update) {
                newIns = this.AddNewInsultToFile(newIns);
            }*/
            this.SendInsultMessage(input, user, newIns);
        }
    }

    /**
     * Saves the new insult to the insult list. Currently disabled
     * 
     * @param newIns 
     */
    /*private AddNewInsultToFile(newIns: string) {
        let insultFile = FS.createWriteStream(pub(filepath), { flags: 'a' });
        insultFile.write(`\n${newIns}`);
        insultFile.end;
        return newIns;
    }*/

    /**
     * filters the insult message for quotations, then returns the new message
     * also adds a space at the front if it's not supposed to be formatted <user>'s
     * 
     * @param input
     */
    private FilterNewInsult(input: Input) {
        let newIns = input.getArgument('new_insult') as string;
        let newInsFilteredArray = /[^"]+/.exec(newIns);
        let filteredNewIns: string = '';

        if (newInsFilteredArray) {
            for (let index = 0; index < newInsFilteredArray.length; index++) {
                filteredNewIns += newInsFilteredArray[index];
            }
        }

        if (filteredNewIns.length > 0 && !filteredNewIns[0].match(/\'/)) {
            filteredNewIns = ` ${filteredNewIns}`;
        }

        return filteredNewIns;
    }

    /**
     * Protects the users identity when insulting another
     * 
     * @param input 
     */
    private HideSource(input: Input) {
        input.message.delete().catch(reason => {
            this.getLogger().error(reason);
        });
    }

    /**
     * randomly selects an insult from the file and sends it
     * 
     * @param input 
     * @param user 
     */
    private RandomInsult(input: Input, user: GuildMember) {
        let insultIndex: number = _.random(1, insults.length - 1, false); //Range starts at 1 to prevent using the first line of the file.
        let insult = insults[insultIndex];
        this.SendInsultMessage(input, user, insult);
    }

    /**
     * insults the user using the given insult
     * 
     * @param input 
     * @param user 
     * @param insult 
     */
    private SendInsultMessage(input: Input, user: GuildMember, insult: string) {
        input.channel.send(`${user}${insult}`);
    }
}