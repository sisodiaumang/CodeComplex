import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../interfaces/user.interface.js";




const userSchema =new mongoose.Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30
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
            profileImageURL:{
                type:String,
                default : process.env.DEFAULT_AVATAR_URL,
            },
            profileImagePublicId:{
                type:String,
                default:process.env.DEFAULT_AVATAR_PUBLIC_URL
            }

        },

        bio: {
            type: String,
            default: "",
            maxlength: 200
        },

        country: {
            type: String,
            default: "India"
        },

        role: {
            type: String,
            enum: ["USER", "ADMIN","MODERATOR","OWNER"],
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
        lastPasswordChangedAt: {
            type: Date
        },

    },
    {
        timestamps: true
    });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });


userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(
        this.password,
        12
    );

    this.lastPasswordChangedAt = new Date();
});

userSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {

    return bcrypt.compare(
        password,
        this.password
    );
};

const User =
    (mongoose.models.User as mongoose.Model<IUser>) ||
    mongoose.model<IUser>("User", userSchema);

export default User;