declare namespace NodeJS {
    interface ProcessEnv {
        ACCESS_TOKEN_SECRET: string;
        ACCESS_TOKEN_EXPIRY: string;

        REFRESH_TOKEN_SECRET: string;
        REFRESH_TOKEN_EXPIRY: string;

        MONGODB_URI: string;
        PORT: string;
    }
}


