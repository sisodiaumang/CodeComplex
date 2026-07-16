import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../config/env.js";

import ApiError from "./ApiError.js";

const isCloudinaryConfigured = !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
    });
} else {
    console.warn(
        "[WARN] Cloudinary credentials are not set. Avatar/image upload features will not function."
    );
}

export const uploadOnCloudinary = async (
    localFilePath: string
) => {
    if (!isCloudinaryConfigured) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw new ApiError(500, "Cloudinary is not configured on this server");
    }

    try {

        if (!localFilePath) {
            throw new ApiError(
                400,
                "File path is required"
            );
        }

        const response =
            await cloudinary.uploader.upload(
                localFilePath,
                {
                    resource_type: "auto"
                }
            );

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {

        if (
            localFilePath &&
            fs.existsSync(localFilePath)
        ) {
            fs.unlinkSync(localFilePath);
        }

        throw new ApiError(
            500,
            "Cloudinary upload failed"
        );
    }
};

export const deleteCloudinary = async (
    publicId: string
) => {
    if (!isCloudinaryConfigured) {
        throw new ApiError(500, "Cloudinary is not configured on this server");
    }

    try {

        if (!publicId) {
            throw new ApiError(
                400,
                "Public ID is required"
            );
        }

        const result =
            await cloudinary.uploader.destroy(
                publicId
            );

        if (result.result !== "ok") {
            throw new ApiError(
                404,
                "File not found on Cloudinary"
            );
        }

        return result;

    } catch (error) {

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            500,
            "Failed to delete file from Cloudinary"
        );
    }
};

export const getPublicId = (
    url: string
): string | null => {

    if (!url) {
        return null;
    }

    try {

        const afterUpload =
            url.split("/upload/")[1];

        const noVersion =
            afterUpload.replace(
                /^v\d+\//,
                ""
            );

        return noVersion.replace(
            /\.[^/.]+$/,
            ""
        );

    } catch {

        return null;
    }
};