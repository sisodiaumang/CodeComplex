import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import fs from "fs";

const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const logMsg = `\n--- ERROR AT ${new Date().toISOString()} ---\nMessage: ${err.message}\nStack: ${err.stack}\nBody: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync("backend_error.log", logMsg);
    } catch (logErr) {
        console.error("Failed to write to backend_error.log", logErr);
    }

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