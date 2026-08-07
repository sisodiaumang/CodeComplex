class ApiError extends Error {

    statusCode: number;
    success: boolean;
    data: any;
    errors: string[];

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: string[] = [],
        data: any = null,
        stack?: string
    ) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.data = data;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(
                this,
                this.constructor
            );
        }
    }
}

export default ApiError;