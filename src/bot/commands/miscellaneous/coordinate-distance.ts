import {Command, Input} from '@api';

export class CoordinateDistance extends Command {
    constructor() {
        super({
            name: 'distance',
            aliases: ['dist'],
            description: 'Calculates the distance between two n-dimensional coordinates',
            arguments: [
                {
                    name: 'coords',
                    expand: true,
                    required: true,
                    pattern: /(\d+[\s;,]+)+\d+/

                }
            ]
        });
    }

    async execute(input: Input) {
        let coordsAB = (input.getArgument('coords') as string).split(/[\s;,]+/);
        if (coordsAB.length % 2 != 0) throw new Error("Coordinate values must have the same dimensionality");

        let sum = 0;
        let halfLen = coordsAB.length / 2;
        for (let i = 0; i < halfLen; i++) sum += Math.pow(parseInt(coordsAB[i]) - parseInt(coordsAB[halfLen + i]), 2);

        sum = Math.sqrt(sum);
        await input.channel.send(`📐 **Distance**: ${sum.toFixed(4)}`);
    }
}