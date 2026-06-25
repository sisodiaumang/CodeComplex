import { IUser } from "../interfaces/user.interface.js";

declare global {
    namespace Express {
        interface Request {
            user: IUser;
        }
    }
}

export {};