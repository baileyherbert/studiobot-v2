import {Command, Input} from '@api';
import {searchyt} from "@libraries/music/search-yt";

export class SearchYt extends Command {
    constructor() {
        super({
            name: 'youtube',
            aliases: ['yt', 'ytsearch'],
            description: 'Searches YouTube for the given search string and returns the 10 results.',
            arguments: [
                {
                    name: 'term',
                    expand: true,
                    required: true
                }
            ]
        });
    }

    async execute(input: Input) {
        let options = input.getArgument('term') as string;
        let ytresults = (await searchyt(options))[0];
        await input.channel.send(`https://www.youtube.com${ytresults.url}`);
    }
}