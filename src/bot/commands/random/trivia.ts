import { Command, Input, Listener } from '@api';
import * as request from 'request';
import { Response } from 'request';
import { Message } from 'discord.js';
import { Emoji } from '@bot/libraries/emoji';
import { Reactions } from '@bot/libraries/reactions';
import { Framework } from '@core/framework';
import { Timer } from '@bot/libraries/utilities/timer';
import { ReactionListener } from '@bot/listeners/reactions';
import { listeners } from 'cluster';
import { GuildMember } from 'discord.js';
import { Economy } from "@libraries/economy";
import { debug } from 'util';
import { TextChannel } from 'discord.js';
const entities = require("html-entities").AllHtmlEntities;

//TODO: Line 468 and 472 convert from member.id to member.displayname
//TODO: Trivia should be multiplayer, but work fine for single player
//TODO: End game if inactive for certain amount of time
//along with the trivia question thats displayed. The players click the reaction they think is the answer
//TODO: Make the trivia questions run on a loop that waits for player(s) to answer.
//TODO: Once player(s) have submitted, the bot displays the correct answer and gives points to the plyer(s) that got it right
//TODO: Add Stop command for admins
//TODO: Better Error handling

//------------------[Maybe]-------------------- 
//TODO: Add Trivia join command. 
//TODO: Add Amount command

//--------[Requires Framework Support]---------
//DONE: Display amount of questions for each category

//--------------------[Done]---------------------
//DONE: Add reacts a,b,c,d to the displayed trivia
//DONE: Integrate reaction collector

const triviaCategories: string[] = [
    'All',
    'General',
    'Books',
    'Film',
    'Music',
    'Theatre',
    'Television',
    'VideoGames',
    'BoardGames',
    'Nature',
    'Computers',
    'Mathematics',
    'Mythology',
    'Sports',
    'Geography',
    'History',
    'Politics',
    'Art',
    'Celebrities',
    'Animals',
    'Vehicles',
    'Comics',
    'Gadgets',
    'Anime',
    'Cartoons'
]

function parseResponse<T = any>(URL: string): Promise<T> {
    return new Promise((resolve, reject) => {
        request(URL, (error: any, response: Response, body: any) => {
            if (error) { reject(error); }
            //console.log(body);
            resolve(JSON.parse(body));
        });
    });
}

export class Trivia extends Command {
    constructor() {
        super({
            name: 'trivia',
            aliases: ['pick', 'choose'],
            description: 'Begins the Trivia Game.',
            arguments: [
                {
                    name: 'category',
                    description: 'The subject the questions will ask about.',
                    required: false,
                    options: triviaCategories,
                    default: ''
                },
                {
                    name: 'difficulty',
                    description: 'How challenging the question is to answer.',
                    required: false,
                    options: ['any', 'easy', 'medium', 'hard'],
                    default: ''
                },
                {
                    name: 'type',
                    description: 'The way the answers are presented for the question',
                    required: false,
                    options: ['mulitple', 'tf'],
                    default: ''
                },
            ]
        });
    }

    //Get the amount of questions in each category and difficulty
    // async init() {
    //     for (let i = 1; i < triviaCategories.length; i++) {
    //         let URL = 'https://opentdb.com/api_count.php?category=' + (i + 8).toString();
    //         let c = await parseResponse<QuestionCount>(URL);
    //         let easy = c.category_question_count.total_easy_question_count;
    //         let medium = c.category_question_count.total_medium_question_count;
    //         let hard = c.category_question_count.total_hard_question_count;
    //         //console.log(i + 8);
    //         //console.log(`id: ${c.category_id}`);
    //         //console.log("link: " + c);
    //         //console.log("questioncount: " + c.category_question_count.total_easy_question_count);
    //         triviaCategories[i] + ' - Easy:' + easy + ' - Medium:' + medium + ' - Hard:' + hard;

    //         //let c = await parseResponse('https://opentdb.com/api_count.php?category=' + (i + 8).toString() );
    //     }
    // }
    
    async execute(input: Input) {
        
        let category = input.getArgument('category');
        let difficulty = input.getArgument('difficulty');
        let type = input.getArgument('type');
        
        //Translate user input into URLS for the database
        let difficultyURL: string = '&difficulty=' + difficulty;
        let typeURL: string = '&type=' + type;
        let categoryURL: string = '';
        let questionAmount = '?amount=10';
        let openTDB = 'https://opentdb.com/api.php';
        let choiceEmoji = ['🇦', '🇧', '🇨', '🇩'];
        
        //Set the URLs to default any if no arguments are entered
        if (!difficulty || difficulty == 'any' || difficulty == 'all') { difficultyURL = ''; }
        if (!type || type == 'any' || type == 'all') { typeURL = ''; }

        //Set URL for chosen question type
        if (type == 'tf') { typeURL = '&type=boolean'; }

        for (let i of triviaCategories) {
            if (category == i && category != triviaCategories[0]) {
                categoryURL = '&category=' + (8 + triviaCategories.indexOf(i)).toString();
            }
        }

        //Retrieve trivia questions from database and fix any syntax issues that may have occured
        let parsed = await parseResponse(openTDB + questionAmount + categoryURL + difficultyURL + typeURL) as TriviaResponse;
        let count = 0;
        //do {

        //Fix any encoding errors using entities.decode()
        //Normalize the names for the parsed TriviaResponse data 
        let question = entities.decode(parsed.results[count].question);
        let incorrect_answers: string[] = [];
        let correct_answer = entities.decode(parsed.results[count].correct_answer);
        let answers = [correct_answer];
        _.each(parsed.results[count].incorrect_answers, s => incorrect_answers.push(entities.decode(s)));
        incorrect_answers.forEach(element => { answers.push(element); });


        // console.log(`Question: ${question}`);
        // console.log(`dQuestion: ${entities.decode(question)}`);
        // console.log(`CorrectAnswer: ${correct_answer}`);
        // console.log(`IncorrectAnswers: ${incorrect_answers}`);
        // console.log(`Category: ${parsed.results[count].category}`);

        //Randomize answers before displaying
        if (answers.length > 2) {
            for (let i = answers.length - 1; i > 0; i--) {
                let e = Math.floor(Math.random() * (i + 1));
                let temp = answers[i];
                answers[i] = answers[e];
                answers[e] = temp;
            }
        }
        //Make A) say true every time
        else {
            if (correct_answer == 'True') {
                answers[0] = correct_answer;
                answers[1] = incorrect_answers[0];
            }
            else if (incorrect_answers[0] == 'True') {
                answers[0] = incorrect_answers[0];
                answers[1] = correct_answer;
            }
        }
        
        let answersDictonary = {
            '🇦': answers[0],
            '🇧': answers[1],
            '🇨': answers[2],
            '🇩': answers[3]
        };

        let correctAnswerEmoji = '';
        _.each(answersDictonary, (answer, emoji) => {
            if (answer == correct_answer) {
                correctAnswerEmoji = emoji;
            }
        });

        //getLogger only appears in the website console
        //Use console.log for debugging
        this.getLogger().debug("Answers:" + answers);
        this.getLogger().debug('Type: ' + parsed.results[count].type);
        this.getLogger().debug('URL: ' + openTDB + questionAmount + categoryURL + difficultyURL + typeURL);
        this.getLogger().debug('results: ' + parsed.results);
        this.getLogger().debug('questions: ' + question);
        this.getLogger().debug('Category: ' + parsed.results[count].category);

        let message: Message;
        let multipleChoice = parsed.results[count].type == 'multiple';

        //Display the correct message depending on the answer type
        if (multipleChoice) {
            message = await input.channel.send({
                embed:
                {
                    color: 0xfab005,
                    title: '__' + parsed.results[count].category + '__',
                    description: question,
                    fields: [{
                        name: 'A)',
                        value: answersDictonary["🇦"]
                    },
                    {
                        name: 'B)',
                        value: answersDictonary["🇧"]
                    },
                    {
                        name: 'C)',
                        value: answersDictonary["🇨"]
                    },
                    {
                        name: 'D)',
                        value: answersDictonary["🇩"]
                    }],
                }
            }) as Message;
        }
        else {
            message = await input.channel.send({
                embed:
                {
                    color: 0xfab005,
                    title: '__' + parsed.results[count].category + '__',
                    description: question,
                    fields: [{
                        name: 'A)',
                        value: answersDictonary["🇦"]
                    },
                    {
                        name: 'B)',
                        value: answersDictonary["🇧"]
                    }],
                }
            }) as Message;
        }

        //Create a "dictionary" to link the member.id to whether they are correct or not
        let reactionAnswers: { [id: string]: boolean } = {};

        let listener = Reactions.listen(message, reaction => {
            if (reaction.member == input.guild.member(Framework.getClient().user)) return;
            if (reaction.action == 'remove') return;

            if (reaction.action == "add") {
                reactionAnswers[reaction.member.id] = reaction.emoji.equals(correctAnswerEmoji);
            }
        });

        // Add the reactions
        if (multipleChoice) {
            for (let i = 0; i < choiceEmoji.length; i++){
                await message.react(choiceEmoji[i]);
            }
        }
        else {
            for (let i = 0; i < choiceEmoji.length/2; i++){
                await message.react(choiceEmoji[i]);
            }
        }

        // Countdown (20 sec)
        let countdownMessage = await input.channel.send(`${Emoji.LOADING}  15 seconds left...`) as Message;
        let timer = new Timer(15, async function (remaining) {
            await countdownMessage.edit(`${Emoji.LOADING}  ${remaining} seconds left...`);
        });
        timer.run();
        await timer.wait();

        // Close listener
        listener.close();

        // Split into two groups (correct and incorrect)
        let correct: GuildMember[] = [];
        let incorrect: GuildMember[] = [];
        let correctNames : string[] = [];
        let incorrectNames : string[] = [];

        _.each(reactionAnswers, (wasCorrect, id) => {
            // Get the member instance from their id
            let member = input.guild.member(id);

            // Add them to the appropriate array
            if (wasCorrect){
                correct.push(member);
                correctNames.push(member.displayName);
            } 
            else{
                incorrect.push(member);
                incorrectNames.push(member.displayName);
            } 
        });
        
        //If no one answers delete the question
        if (_.size(reactionAnswers) == 0) {
            countdownMessage.edit(`${Emoji.LOADING} No answers chosen, shutting down...`);
            message.deleteAfter(2000);
            countdownMessage.delete();
        }
        else {
            // Load settings for all members
            for (let i = 0; i < correct.length; i++) await correct[i].load();
            for (let i = 0; i < incorrect.length; i++) await incorrect[i].load();

            // Show winners and losers
            await countdownMessage.edit({
                embed:
                {
                    color: 0x22b8cf, // cyan
                    title: 'Game over!',
                    description: `The correct answer was **${correct_answer}**.\n\u200b`,
                    fields: [{
                        name: `${Emoji.SUCCESS}  Correct`,
                        value: `${correct.length > 0 ? correct.join(', ') : 'Nobody'}\n\u200b`
                    },
                    {
                        name: `${Emoji.ERROR}  Incorrect`,
                        value: `${incorrect.length > 0 ? incorrect.join(', ') : 'Nobody'}`
                    }],
                }
            });

            // Award currency
            // Awaiting because it will send a message
            for (let i = 0; i < correct.length; i++) {
                await Economy.addBalance(correct[i], 5, input.channel as TextChannel);
            }
        }
    }
}

type QuestionCount = {
    category_id: number;
    category_question_count: {
        total_question_count: string;
        total_easy_question_count: string;
        total_medium_question_count: string;
        total_hard_question_count: string;
    };
}

type TriviaResponse = {
    response_code: number;
    results: {
        category: string;
        type: string;
        difficulty: string;
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
    }[];
}
