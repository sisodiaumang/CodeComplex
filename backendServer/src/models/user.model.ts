import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../interfaces/user.interface.js";
import jwt from "jsonwebtoken";
import { isReservedUsername } from "../constants/reservedUsernames.js";


const userSchema = new mongoose.Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
            validate: {
                validator: (value: string) => !isReservedUsername(value),
                message: "This username is reserved and cannot be used"
            }
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            // FIX: Removed lowercase: true — "John Doe" was being stored as
            // "john doe", breaking display formatting everywhere.
            minlength: 3,
            maxlength: 50
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        avatar: {
            profileImageURL: {
                type: String,
                default: process.env.DEFAULT_AVATAR_URL
            },
            profileImagePublicId: {
                type: String,
                default: process.env.DEFAULT_AVATAR_PUBLIC_URL
            }
        },

        bio: {
            type: String,
            default: "",
            maxlength: 200
        },

        country: {
            type: String,
            default: "IN",
            uppercase: true,
            minlength: 2,
            maxlength: 2
        },

        // FIX: "OWNER" role is intentionally kept but must only be assigned
        // via a seed/migration script — never through a user-facing API.
        // All role-elevation endpoints must guard against assigning OWNER.
        role: {
            type: String,
            enum: ["USER", "ADMIN", "MODERATOR", "OWNER"],
            default: "USER"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isBanned: {
            type: Boolean,
            default: false
        },

        lastSeen: {
            type: Date,
            default: Date.now
        },

        // FIX: This field is now actively used in generateAccessToken (via iat
        // comparison) and in socketAuthMiddleware to reject tokens issued
        // before a password change. Do NOT remove it.
        lastPasswordChangedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });


// Matches bcrypt hash output ($2a$, $2b$, or $2y$ prefix) so we never
// re-hash a value that's already a bcrypt hash.
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    // FIX (C4): verifyUser (user_controllers.ts) creates the User doc with
    // password set to the already-bcrypt-hashed value from
    // OTP.pendingUser.passwordHash (hashed at signup time — see C1). Without
    // this guard, this hook would hash that hash again, and
    // bcrypt.compare(plainPassword, hashOfHash) would always return false,
    // permanently locking the user out of their own account.
    if (BCRYPT_HASH_PATTERN.test(this.password)) {
        this.lastPasswordChangedAt = new Date();
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
    this.lastPasswordChangedAt = new Date();
});


userSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};


userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            // FIX: Embed passwordChangedAt so socketAuthMiddleware and HTTP
            // auth middleware can reject tokens issued before a password reset.
            // Stored as Unix epoch (seconds) to keep the JWT compact.
            passwordChangedAt: this.lastPasswordChangedAt
                ? Math.floor(this.lastPasswordChangedAt.getTime() / 1000)
                : 0
        },
        process.env.ACCESS_TOKEN_SECRET!,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET!,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
        }
    );
};


const User =
    (mongoose.models.User as mongoose.Model<IUser>) ||
    mongoose.model<IUser>("User", userSchema);

export default User;