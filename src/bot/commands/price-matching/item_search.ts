import { Command, Input } from '@api';
import request from 'request';
import cheerio from 'cheerio';

export class Item extends Command {
    constructor() {
        super({
            name: 'item',
            description: 'Searches the internet for the given link and finds prices on various marketplaces.',
            arguments: [
                {
                    name: 'item',
                    description: 'Relevant links to items based on your search.',
                    required: true,
                    expand: true

                }
            ]
        });
    }

    execute(input: Input) {
        /*expects user to input text*/
        let item = input.getArgument('item') as string;
        let item_search = encodeURI(item);

        let amazon_search = 'https://www.amazon.com/s?k=' + item_search;
        let amazon = 'https://www.amazon.com';

        let ebay_search = 'https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2334524.m570.l1313.TR12.TRC2.A0.H0.X' + item_search + '.TRS0&_nkw=' + item_search;
        let ebay = 'https://www.ebay.com';

        let newegg_search = 'https://www.newegg.com/Product/ProductList.aspx?Submit=ENE&DEPA=0&Order=BESTMATCH&Description=' + item_search;
        let newegg = 'https://www.newegg.com';


        request(amazon_search, {gzip: true}, function(a, b, body){
            let $ = cheerio.load(body);

            $('.s-result-list .a-link-normal').each(function(i, x) {
                console.log($(x).text());
            })

            let link = $('.s-result-list .a-link-normal').first().attr('href');

            console.log(amazon+link);

            input.channel.send(amazon + link);
        });
        request(ebay_search, {gzip:true}, function(c, d, body2){
            let $ = cheerio.load(body2);

            let link = $('#srp-river-results-listing1 a').first().attr('href');

            input.channel.send(link);
        });
        request(newegg_search, {gzip: true}, function(a, b, body3){
            let $ = cheerio.load(body3);

            let link = $('.list-wrap .item-img').first().attr('href');

            input.channel.send(link);
        });
    }
}
