export module boardEnums{
    export enum SpaceEnum {
        Blank = ':ok_hand:',
        X = ':x:',
        O = ':o:'
    }

    export enum CoordinateIndicators {
        A = ':regional_indicator_a:',
        B = ':regional_indicator_b:',
        C = ':regional_indicator_c:',
        One = ':one:',
        Two = ':two:',
        Three = ':three:',
        TopLeft = ':record_button:'
    }
}

export class TTTBoard{
    private tiles : boardEnums.SpaceEnum[][]
    constructor(){
        //x is the second square bracket, y is the first
        this.tiles = [
            [boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank],
            [boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank],
            [boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank, boardEnums.SpaceEnum.Blank]
        ]
    }

    ChangeTile(x : number, y : number, xo : boardEnums.SpaceEnum) : boolean {
        if (isNaN(x)){
            return false;
        }
        if (isNaN(y)){
            return false;
        }

        if (this.tiles[y][x] === boardEnums.SpaceEnum.Blank){
            this.tiles[y][x] = xo;
            return true;
        }
        else {
            return false;
        }
    }

    CheckForWinner(){
        //Vertical match
        for (let index = 0; index < this.tiles.length; index++){
            if (this.tiles[index][0] === this.tiles[index][1] 
                && this.tiles[index][0] === this.tiles[index][2] 
                && this.tiles[index][0] !== boardEnums.SpaceEnum.Blank){
                    return this.tiles[index][0];
            }
        }

        //Horizontal match
        for (let index = 0; index < this.tiles[0].length; index++){
            if (this.tiles[0][index] === this.tiles[1][index] 
                && this.tiles[0][index] === this.tiles[2][index] 
                && this.tiles[0][index] !== boardEnums.SpaceEnum.Blank){
                    return this.tiles[0][index];
            }
        }

        //Top-Left to Bottom-Right
        if (this.tiles[1][1] === this.tiles[0][0] 
            && this.tiles[1][1] === this.tiles[2][2] 
            && this.tiles[1][1] !== boardEnums.SpaceEnum.Blank){
            return this.tiles[1][1];
        }

        //Top-Right to Bottom-Left
        if (this.tiles[1][1] === this.tiles[0][2] 
            && this.tiles[1][1] === this.tiles[2][0] 
            && this.tiles[1][1] !== boardEnums.SpaceEnum.Blank){
            return this.tiles[1][1];
        }

        //Checks for blank spaces
        for (let y = 0; y < this.tiles.length; y++){
            for (let x = 0; x < this.tiles[y].length; x++){
                if (this.tiles[y][x] === boardEnums.SpaceEnum.Blank) {
                    return null;
                }
            }
        }

        //Returns blank space for tie
        return boardEnums.SpaceEnum.Blank
    }

    GetBoardVisual(){
        let boardVisual = 
        ` \n${boardEnums.CoordinateIndicators.TopLeft}|${boardEnums.CoordinateIndicators.A}|${boardEnums.CoordinateIndicators.B}|${boardEnums.CoordinateIndicators.C}|
        \n${boardEnums.CoordinateIndicators.One}|${this.tiles[0][0]}|${this.tiles[0][1]}|${this.tiles[0][2]}|
        \n${boardEnums.CoordinateIndicators.Two}|${this.tiles[1][0]}|${this.tiles[1][1]}|${this.tiles[1][2]}|
        \n${boardEnums.CoordinateIndicators.Three}|${this.tiles[2][0]}|${this.tiles[2][1]}|${this.tiles[2][2]}|`;

        return boardVisual;
    }
}