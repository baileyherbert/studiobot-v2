import * as request from 'request-promise';

export class Akinator {
    private session?: Session;
    private winner?: Character;

    private certainty?: number;
    private question?: string;
    private step?: number;

    /**
     * Constructs a new Akinator session instance.
     */
    public constructor(protected region: Region = 'en') {

    }

    /**
     * Starts the Akinator session. Will error if already started.
     */
    public async start(): Promise<Step> {
        if (this.session) throw new Error('Akinator: Attempt to start a game which has already been started.');

        // Start the session
        let auth = await this.getAuthentication();
        let args = await this.getSessionArgs(auth);

        // Build the session object
        this.session = {
            sessionFrontAddr: auth.frontaddr,
            sessionUID: auth.uid_ext_session,
            sessionId: args.id,
            sessionSignature: args.signature
        };

        // Set the current step and question
        this.step = 0;
        this.certainty = 0;
        this.question = args.question;

        // Return the step
        return this.getStep();
    }

    /**
     * Continues to the next step in the Akinator session.
     */
    public async next(answer: number): Promise<Step> {
        if (!this.session) throw new Error('Akinator: Cannot proceed to next step because the game has not been started.');
        if (this.winner) throw new Error('Akinator: Cannot proceed to next step because the game has been finished.');

        // Get the response
        let json = await request({
            method: 'GET',
            uri: `https://${this.getRequestUrl()}/ws/answer?callback=&session=${this.session.sessionId}&signature=${this.session.sessionSignature}&step=${this.step}&answer=${answer}&question_filter=`,
            headers: this.getHeaders(),
            gzip: true,
            json: true
        }) as AnswerResponse;

        // Check the completion property
        if (json.completion != 'OK') {
            throw new Error(`Akinator: Cannot continue due to an unexpected error: ${json.completion}`);
        }

        // Update local variables
        this.question = json.parameters.question;
        this.step = parseInt(json.parameters.step);
        this.certainty = parseFloat(json.parameters.progression);

        // Return the step
        return this.getStep();
    }

    /**
     * Reverses to the previous step in the Akinator session.
     */
    public async previous(): Promise<Step> {
        if (!this.session) throw new Error('Akinator: Cannot move to previous step because the game has not been started.');
        if (this.winner) throw new Error('Akinator: Cannot move to previous step because the game has been finished.');

        // Get the response
        let json = await request({
            method: 'GET',
            uri: `https://${this.getRequestUrl()}/ws/cancel_answer?callback=&session=${this.session.sessionId}&signature=${this.session.sessionSignature}&step=${this.step}&answer=-1&question_filter=`,
            headers: this.getHeaders(),
            gzip: true,
            json: true
        }) as AnswerResponse;

        // Check the completion property
        if (json.completion != 'OK') {
            throw new Error(`Akinator: Cannot go back due to an unexpected error: ${json.completion}`);
        }

        // Update local variables
        this.question = json.parameters.question;
        this.step = parseInt(json.parameters.step);
        this.certainty = parseFloat(json.parameters.progression);

        // Return the step
        return this.getStep();
    }

    /**
     * Finishes the game and gets the winner.
     */
    public async finish(): Promise<Character> {
        if (!this.session) throw new Error('Akinator: Cannot finish because the game has not been started.');
        if (this.winner) throw new Error('Akinator: Cannot finish because the game has already been finished.');

        // Get the response
        let json = await request({
            method: 'GET',
            uri: `https://${this.getRequestUrl()}/ws/list?callback=&session=${this.session.sessionId}&signature=${this.session.sessionSignature}&step=${this.step}&size=2&max_pic_width=246&pref_photos=VO-OK&duel_allowed=1&mode_question=0`,
            headers: this.getHeaders(),
            gzip: true,
            json: true
        }) as ListResponse;

        // Check the completion property
        if (json.completion != 'OK') {
            throw new Error(`Akinator: Cannot finish due to an unexpected error: ${json.completion}`);
        }

        // Build the character object
        let winner: Character = {
            name: json.parameters.elements[0].element.name,
            description: json.parameters.elements[0].element.description,
            photo_url: json.parameters.elements[0].element.absolute_picture_path
        };

        // Save the character internally
        this.winner = winner;

        // Return the character
        return winner;
    }

    /**
     * Returns the current step object.
     */
    protected getStep(): Step {
        return {
            certainty: this.certainty!,
            number: this.step! + 1,
            question: this.question!,
            session: this.session!
        };
    }

    /**
     * Gets authentication data for the game. This should only be called once, at the very beginning of the game.
     */
    protected async getAuthentication(): Promise<GameAuthentication> {
        let options = {
            method: 'GET',
            uri: `https://${this.region}.akinator.com/game`,
            headers: this.getHeaders(true),
            gzip: true
        };

        // Get the html from the game page and extract the necessary variables
        let body = await request(options);
        let uid = /var uid_ext_session = '([a-z0-9\-]+)';/.exec(body);
        let addr = /var frontaddr = '([a-zA-Z0-9\-\=\+]+)';/.exec(body);

        // Error if they are missing
        if (!uid || !addr) throw new Error('Akinator: Could not locate session variables, unable to start game.');

        return {
            frontaddr: addr[1],
            uid_ext_session: uid[1]
        };
    }

    /**
     * Starts a new session and returns its arguments.
     */
    protected async getSessionArgs(auth: GameAuthentication): Promise<GameSessionArgs> {
        // Get the response
        let json = await request({
            method: 'GET',
            uri: `https://${this.getRequestUrl()}/ws/new_session?callback=&partner=1&player=website-desktop&uid_ext_session=${auth.uid_ext_session}&frontaddr=${auth.frontaddr}&constraint=ETAT%3C%3E%27AV%27&soft_constraint=&question_filter=`,
            headers: this.getHeaders(),
            gzip: true,
            json: true
        }) as NewSessionResponse;

        // Check the completion property
        if (json.completion != 'OK') {
            throw new Error(`Akinator: Cannot start session due to an unexpected error: ${json.completion}`);
        }

        // Return the args
        return {
            id: json.parameters.identification.session,
            signature: json.parameters.identification.signature,
            question: json.parameters.step_information.question
        };
    }

    /**
     * Returns headers to use for all internal requests.
     */
    protected getHeaders(fromHomePage: boolean = false): {[name: string]: string} {
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
            'Referrer': `https://${this.region}.akinator.com/` + (fromHomePage ? '' : 'game')
        };
    }

    /**
     * Returns the hostname to use for internal requests.
     */
    protected getRequestUrl() {
        switch (this.region) {
            case 'en': return 'srv13.akinator.com:9196';
            case 'ar': return 'srv2.akinator.com:9155';
            case 'cn': return 'srv11.akinator.com:9150';
            case 'de': return 'srv7.akinator.com:9145';
            case 'es': return 'srv11.akinator.com:9151';
            case 'fr': return 'srv3.akinator.com:9165';
            case 'il': return 'srv12.akinator.com:9189';
            case 'it': return 'srv9.akinator.com:9131';
            case 'jp': return 'srv11.akinator.com:9172';
            case 'kr': return 'srv2.akinator.com:9156';
            case 'nl': return 'srv9.akinator.com:9133';
            case 'pl': return 'srv7.akinator.com:9143';
            case 'pt': return 'srv3.akinator.com:9166';
            case 'ru': return 'srv12.akinator.com:9190';
            case 'tr': return 'srv3.akinator.com:9164';
            default: return 'srv11.akinator.com:9152';
        }
    }
}

/**
 * The regions that Akinator supports.
 */
export type Region = 'en' | 'ar' | 'cn' | 'de' | 'es' | 'fr' | 'il' | 'it' | 'jp' | 'kr' | 'nl' | 'pl' | 'pt' | 'ru' | 'tr';

/**
 * The current step in an Akinator session.
 */
export type Step = {
    number: number;
    question: string;
    certainty: number;
    session: Session
};

/**
 * Authentication details for the current Akinator session.
 */
export type Session = {
    sessionId: string;
    sessionSignature: string;
    sessionUID: string;
    sessionFrontAddr: string;
};

/**
 * The details for the winning character of an Akinator session.
 */
export type Character = {
    name: string;
    description: string;
    photo_url: string;
}

/**
 * Internal game authentication arguments.
 */
type GameAuthentication = {
    uid_ext_session: string;
    frontaddr: string;
}

/**
 * Internal game session arguments.
 */
type GameSessionArgs = {
    id: string;
    signature: string;
    question: string;
}

/**
 * Internal response outline for a step.
 */
type StepInformationResponse = {
    infogain: string;
    progression: string;
    question: string;
    questionid: string;
    step: string;
    answers: {answer: string}[];
};

/**
 * Internal response outline for a new session request.
 */
type NewSessionResponse = {
    completion: 'OK' | 'KO - SERVER DOWN' | 'KO - TECHNICAL ERROR' | 'KO - INCORRECT PARAMETER' | 'KO - TIMED OUT' | 'KO - BAD AUTH';
    parameters: {
        identification: {
            challenge_auth: string;
            channel: number;
            session: string;
            signature: string;
        };
        step_information: StepInformationResponse;
    }
}

/**
 * Internal response outline for an answer request.
 */
type AnswerResponse = {
    completion: 'OK' | 'KO - SERVER DOWN' | 'KO - TECHNICAL ERROR' | 'KO - INCORRECT PARAMETER' | 'KO - TIMED OUT' | 'KO - BAD AUTH';
    parameters: StepInformationResponse;
}

/**
 * Internal response outline for a list request.
 */
type ListResponse = {
    completion: 'OK' | 'KO - SERVER DOWN' | 'KO - TECHNICAL ERROR' | 'KO - INCORRECT PARAMETER' | 'KO - TIMED OUT' | 'KO - BAD AUTH';
    parameters: {
        NoObjectsPertinents: number;
        elements: {
            element: {
                id: number;
                absolute_picture_path: string;
                description: string;
                flag_photo: number;
                name: string;
                proba: number;
                ranking: number;
                valide_constrainte: number;
            };
        }[];
    }
}
