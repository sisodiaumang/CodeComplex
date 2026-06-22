class ApiError extends Error {

    statusCode: number;
    success: boolean;
    data: null;
    errors: string[];

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: string[] = [],
        stack?: string
    ) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.data = null;
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