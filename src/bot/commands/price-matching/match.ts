import { Command, Input } from '@api';
import request from 'request';
import cheerio from 'cheerio';

export class Match extends Command {
    constructor() {
        super({
            name: 'match',
            description: 'Searches the internet for the given link and finds prices on various marketplaces.',
            arguments: [
                {
                    name: 'url',
                    description: 'A link to the item of interest.',
                    constraint: 'url',
                    required: true,

                }
            ]
        });
    }

    execute(input: Input) {
        let url = input.getArgument('url') as string;

        request(url, { gzip: true }, function(a, b, body){
            /*load html of web page*/
            let $ = cheerio.load(body);

            /*scrapes product title from product page*/
            let item_text = $('#productTitle').text().trim();

            /*combines the encoded item_text and throws it into amazon's search URL*/
            let amazon_search = 'https://www.amazon.com/s?k=' + encodeURI(item_text);
            let amazon = 'https://www.amazon.com';
            request(amazon_search, { gzip: true }, (a2, b2, body2) => {
                let $$ = cheerio.load(body2);

                //let link = $( "h5.a-color-base a" ).first().attr('href');
                let link = $$('.s-result-list .a-link-normal').first().attr('href');
                //console.log(link);
                //console.log($$('.s-result-list .a-link-normal').first());

                input.channel.send(amazon + link);

                console.log(amazon_search);
            });

        });
    }
}
