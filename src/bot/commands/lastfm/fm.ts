import { Command, Input } from '@api';
import { Emoji } from '@bot/libraries/emoji';
import * as request from 'request';
import { Response } from 'request';

export class LastFm extends Command {

    constructor() {
        super({
            name: 'lastfm',
            description: '',
            arguments: [
                {
                    name: 'action',
                    options: ['set', 'get', 'remove', 'album', 'artist', 'chart', 'artistchart', 'trackchart'],
                    default: 'get'
                },
                {
                    name: 'user',
                    constraint: 'string'
                }
            ]
        });
    }

    async execute(input: Input) {
        let db = input.member.settings;

        let action = input.getArgument('action') as string;
        let user = input.getArgument('user') as string | undefined;
        if (!user) { user = db.lastfmId; }

        let key = '87aa68ded7b81dc193520b678aff7da6';
        let lastfmURL = 'http://ws.audioscrobbler.com/2.0/?method=';
        let queryString = user + '&api_key= ' + key + '&limit=2&format=json';

        let nullText = '[undefined]';
        let nullURL = 'https://discordapp.com/assets/ea3b7f0aee3f51c3bbfe5a6d7f93e436.svg'

        // test

        switch(action) {
            case 'get':
                if (user && user != '') {
                    let requestURL = request((lastfmURL + 'user.getRecentTracks' + '&user=' + queryString), (error: any, response: Response, body: any) => {
                        if (error) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                        }

                        let parsed = JSON.parse(body);

                        if (parsed.recenttracks == undefined || parsed.recenttracks.track[0] == undefined) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                            return;
                        }

                        let currentTrack = parsed.recenttracks.track[0];

                        let trackName = (currentTrack.name != undefined) ? currentTrack.name : nullText;
                        let artistName = (currentTrack.artist['#text'] != undefined) ? currentTrack.artist['#text'] : nullText;
                        let albumName = (currentTrack.album['#text'] != undefined) ? currentTrack.album['#text'] : nullText;
                        let albumImage = (currentTrack.image[1]['#text'] != undefined) ? currentTrack.image[1]['#text'] : nullURL;

                        let lastTrack = parsed.recenttracks.track[1];

                        let lastTrackName = (lastTrack.name != undefined) ? lastTrack.name : nullText;
                        let lastArtistName = (lastTrack.artist['#text'] != undefined) ? lastTrack.artist['#text'] : nullText;
                        let lastAlbumName = (lastTrack.album['#text'] != undefined) ? lastTrack.album['#text'] : nullText;

                        let description = 'Recently Played:';
                        let prefix = 'Last track:';
                        if (currentTrack.IsNowPlaying) {
                            description = 'Now Playing:';
                            prefix = 'Current:';
                        }

                        let icon = input.member.user.avatarURL;
                        let uName = ', ' + input.member.displayName;
                        if (user != db.lastfmId) {
                            icon = nullURL;
                            uName = '';
                        }

                        input.channel.send( {
                            embed:
                            {
                                color: 3447003,
                                author: {
                                    name: user,
                                    icon_url: icon
                                },
                                title: user + uName,
                                url:  'https://www.last.fm/user/' + user,
                                description: description,
                                thumbnail: {
                                    url: albumImage
                                },
                                fields: [
                                    {
                                        name: prefix + ' ' + trackName,
                                        value: artistName + ' | ' + albumName
                                    },
                                    {
                                        name: 'Previous: ' + lastTrackName,
                                        value: lastArtistName + ' | ' + lastAlbumName
                                    }
                                ]
                            }
                        });
                    });
                }
                break;
            case 'set':
                if (user && user != '') {
                    db.lastfmId = user;
                    input.channel.send('Lastfm username set to ' + user);
                } else {
                    input.channel.send('Please input a username');
                }
                break;
            case 'remove':
                db.lastfmId = '';
                input.channel.send('Lastfm username has been reset');
                break;
            case 'album':
                if (input.getArgument('user')) {
                    let requestURL = request((lastfmURL + 'album.search' + '&album=' + queryString), (error: any, response: Response, body: any) => {
                        if (error) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                        }

                        let parsed = JSON.parse(body);

                        if (parsed.results.albummatches == undefined) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                            return;
                        }

                        let album = parsed.results.albummatches.album[0];

                        input.channel.send( {
                            embed: {
                                color: 3447003,
                                title: album.name,
                                description: album.artist,
                                url: album.url,
                                image: {
                                    url: album.image[3]['#text']
                                }
                            }                            
                        })

                    });
                }
                break;
            case 'artist':
                if (input.getArgument('user')) {
                    let requestURL = request((lastfmURL + 'artist.search' + '&artist=' + queryString), (error: any, response: Response, body: any) => {
                        if (error) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                        }

                        let parsed = JSON.parse(body);

                        if (parsed.results.artistmatches == undefined) {
                            input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                            return;
                        }

                        let id = parsed.results.artistmatches.artist[0].mbid;

                        queryString = id + '&api_key= ' + key + '&limit=2&format=json';

                        let newRequestURL = request((lastfmURL + 'artist.getInfo' + '&mbid=' + queryString), (error: any, response: Response, body: any) => {
                            
                            if (error) {
                                input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                            }
    
                            let newParsed = JSON.parse(body);
    
                            if (newParsed.artist == undefined) {
                                input.channel.send(`${Emoji.ERROR}  Connection error! Unable to retrieve lastfm data.`);
                                return;
                            }
    
                            let artist = newParsed.artist
                            
                            input.channel.send( {
                                embed: {
                                    color: 3447003,
                                    title: artist.name,
                                    description: artist.bio.content.substring(0, 500) + '...',
                                    url: artist.url,
                                    image: {
                                        url: artist.image[3]['#text']
                                    },
                                    fields: [
                                        {
                                            name: 'Total Listeners',
                                            value: artist.stats.listeners
                                        },
                                        {
                                            name: 'Total Playcount',
                                            value: artist.stats.playcount
                                        }
                                    ]
                                }                            
                            })
                        })

                    });

                }
                break;
            case 'chart':
                break;
            case 'artistchart':
                break;
            case 'trackchart':
                break;
        }

        await db.save();
    }
}
