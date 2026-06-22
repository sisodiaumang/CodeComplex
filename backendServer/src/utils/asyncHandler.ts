import { RequestHandler } from "express";

const asyncHandler = (
    requestHandler: RequestHandler
): RequestHandler =>
    (req, res, next) =>
        Promise.resolve(
            requestHandler(req, res, next)
        ).catch(next);

export default asyncHandler;