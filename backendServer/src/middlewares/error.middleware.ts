import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError.js";

const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
};

export default errorHandler;