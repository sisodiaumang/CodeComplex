
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { IRefreshToken } from "../interfaces/refreshToken.interface.js";



const refreshTokenSchema =
    new mongoose.Schema<IRefreshToken>(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            token: {
                type: String,
                required: true,
                select: false
            },

            expiresAt: {
                type: Date,
                required: true,
                index: true
            }

        },
        {
            timestamps: true
        });

refreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

refreshTokenSchema.index(
    {
        userId: 1
    },
    {
        unique: true
    }
);


refreshTokenSchema.pre(
    "save",
    async function () {

        if (
            !this.isModified("token")
        ) {
            return;
        }

        this.token =
            await bcrypt.hash(
                this.token,
                10
            );

    });


refreshTokenSchema.methods.compareToken =
    async function (
        token: string
    ): Promise<boolean> {

        return bcrypt.compare(
            token,
            this.token
        );

    };


refreshTokenSchema.methods.isExpired = function (): boolean {
    return this.expiresAt.getTime() < Date.now();
};

const RefreshToken: mongoose.Model<IRefreshToken> =
    (mongoose.models.RefreshToken as mongoose.Model<IRefreshToken>) ||
    mongoose.model<IRefreshToken>(
        "RefreshToken",
        refreshTokenSchema
    );

export default RefreshToken;
