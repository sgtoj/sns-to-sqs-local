interface CustomErrorData {
    message: string;
    [key: string]: any;
}

interface CustomConfigErrorData extends CustomErrorData {
    name: string;
}


export class CustomError extends Error {
    protected data: CustomErrorData;
    constructor(message: string) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.data = { message: message };
    }
}

export class ConfigValueError extends CustomError {
    protected data!: CustomConfigErrorData;
    constructor(message: string, name: any) {
        super(message);
        this.data.name = name;
    }
}
