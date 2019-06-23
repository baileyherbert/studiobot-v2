import { Command, Input } from '@api';
import { Message, GuildMember, Guild, TextChannel, DMChannel, GroupDMChannel, Role } from 'discord.js';
import * as request from 'request';
import { Response } from 'request';
import { Colors } from "@bot/libraries/color";

//Api used is Datamuse
const apiBaseUrl = ' https://api.datamuse.com/words';

const spelledLike = '?sp=';
const soundsLike = '?sl=';
const meansSimilar = '?ml=';
const rhymesWith = '?rel_rhy';
const metadata = 'md=';
const definition = 'd';

export class Dictionary extends Command {
    constructor() {
        super({
            name: 'dictionary',
            aliases: ['dict', 'dic', 'def', 'define'],
            description: 'Look up the definition of a word.',
            arguments: [{
                name: 'word',
                description: 'the word to look up',
                constraint: 'string',
                required: true,
                expand: true
            }
        ]})
    }

    execute (input: Input) {
        let word : string = input.getArgument('word') as string;

        let requestUrl = `${apiBaseUrl}${spelledLike}${encodeURIComponent(word)}&${metadata}${definition}`;

        let req = request(requestUrl, (error: any, response: Response, body: any) => {
            if (error){
                this.getLogger().error(error);
            }

            else {
                let data = JSON.parse(body);
                this.ProcessAPIOutput(data, input, word);
            }
        })
    }

    private ProcessAPIOutput(data: any, input: Input, word: string) {
        if (data !== undefined && data.length > 0 && data[0].defs !== undefined) {
            let returnedWord = data[0].word as string;
            let definitions: { name: string, value: string }[] = this.GetDefinitions(data);

            input.channel.send({
            embed: {
                color: Colors.DARK_GREEN,
                title: `📗  **${returnedWord.charAt(0).toUpperCase() + returnedWord.slice(1)}:**`,
                description: `${definitions.length} definitions found.`,
                fields: definitions
            }
            });
        }
        else {
            input.channel.send(`No definition or similarly spelled word could be found for ${word}.`);
        }
    }

    private GetDefinitions(data: any) : { name: string, value: string }[] {
        let definitions: { name: string, value: string }[] = [];

        for (let index = 0; index < data[0].defs.length; index++) {
            //Gets string with definition
            let definition = data[0].defs[index] as string;
            //Gets string with definition number and part of speech
            let definitionTitle = `${index + 1}: ${this.GetPartOfSpeechFromDefinition(definition)}`;
            definitionTitle = this.UpdatePartOfSpeechText(definitionTitle);
            //Updates definitions array
            definitions.push({
                name: definitionTitle,
                value: definition.substr(definition.indexOf('\t') + 1, undefined)
            });
        }

        return definitions;
    }

    private GetPartOfSpeechFromDefinition(definition: string) : string {
        return definition.slice(0, definition.indexOf('\t'));
    }

    private UpdatePartOfSpeechText(definitionTitle: string) : string {
        let title = definitionTitle;

        let replaceRules = [
            { replace: /n/, with: 'noun' },
            { replace: /v/, with: 'verb' },
            { replace: /adj/, with: 'adjective' },
            { replace: /adv/, with: 'adverb' },
            { replace: /u/, with: 'unknown' }
        ];

        for (let index = 0; index < replaceRules.length; index++) {
            let newTitle = title.replace(replaceRules[index].replace, replaceRules[index].with);
            if (newTitle !== title){
                title = newTitle;
                return title;
            }
        }

        return title;
    }
}
