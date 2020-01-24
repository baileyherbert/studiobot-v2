import request from "request";
import {Response} from "request";
import cheerio from "cheerio";


export function searchyt(searchTerm: string): Promise<{ title: string, url: string }[]> {
    return new Promise((resolve, reject) => {
        let ytresults: { title: string, url: string }[] = [];

        let encodedSearchTerm = encodeURI(searchTerm);
        request('https://www.youtube.com/results?search_query=' + encodedSearchTerm, (error: any, response: Response, body: any) => {
            if (error) reject(error);
            try {
                let $ = cheerio.load(body);

                let results = $('h3.yt-lockup-title a');
                results.each((index: number, element: CheerioElement) => {
                    let row = $(element);
                    let href = row.attr('href');

                    if (!href) return;
                    if (!(/\/watch\?v=([\w-]+)/.test(href))) return;

                    let title = row.text();

                    ytresults.push({
                        title, url: href
                    });
                });

                resolve(ytresults);
            } catch (e) {
                reject(e);
            }
        });
    });
}
