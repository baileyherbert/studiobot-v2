import { Command, Input } from '@api';

export class jokes extends Command{
    constructor() {
        super({
            name: 'joke', 
            aliases: ['jokes'], 
            description: 'Outputs a list of jokes from a list of arrrays'
        });

    }

    execute(input: Input){

        var jokesList = [
            "What do you call cheese that's not yours? Nacho Cheese",
            "Two drums and a cymbal fall of a cliff. Ba-dum Tish",
            "What do you call the security outside of a Samsung Store? Guardians of the Galaxy.",
            "I have a lot of good jokes about unemployed people...But none of them work.",
            "What is red and smells like blue paint? Red Paint",
            "I bought some shoes from a drug dealer. I don't know what he laced them with, but I've been tripping all day.",
            "I told my girlfriend she drew her eyebrows too high. She seemed surprised.",
            "Two clowns are eating a cannibal. One turns to the other and says....I think we got this joke wrong",
            "My wife told me I had to stop acting like a flamingo. So I had to put my foot down.",
            "What's the difference between in-laws and outlaws? Outlaws are wanted",
            "I bought my friend an elephant for his room. He said Thanks I said Don't mention it",
            "I have an EpiPen. My friend gave it to me when he was dying, it seemed very important to him that I have it.",
            "I poured root beer in a square glass, Now I just have beer.",
            "What do you call a frenchman wearing sandals? Phillipe Phillope",
            "What's orange and sounds like a parrot? A carrot",
            "What do you call a dog that does magic tricks? A labracadabrador",
            "A blind man walks into a bar. And a table. And a chair.",
            "This is my step ladder. I never knew my real ladder.",
            "I went bobsleighing the other day, killed 250 bobs.",
            "I have the heart of a lion and a lifetime ban from the Toronto zoo.",
            "What's the difference between a good joke and a bad joke timing.",
            "My friends say there's a gay guy in our circle of friends... I really hope it's Todd, he's cute.",
            "What's ET short for? He's only got little legs.",
            "What's the difference between a dirty old bus stop and a lobster with breast implants? One is a crusty bus station the other one is a busty crustacean.",
            "It's hard to explain puns to kleptomaniacs because they always take things literally.",
            "I want to die peacefully in my sleep like my grandfather did, not screaming in terror like the passengers in his car.",
            "2 cows are grazing in a field. 1 cow says to the other, You ever worry about that mad cow disease?. The other cow says, Why would I care? I'm a helicopter!",
            "People think “icy” is the easiest word to spell. Come to think of it, I see why.",
            "Comic Sans walks into a bar. The bartender says, We don’t serve your type here.",
            "What’s the easiest way to get straight As? Use a ruler.",
            "What’s a balloon’s least favorite type of music? Pop.",
            "What does the world’s top dentist get,A little plaque",
            "I used to be addicted to not showering. Luckily, I’ve been clean for five years.",
        ];

        let rnd = Math.floor(Math.random()* jokesList.length);

        input.channel.send(
            jokesList[rnd]
        )
    }
}