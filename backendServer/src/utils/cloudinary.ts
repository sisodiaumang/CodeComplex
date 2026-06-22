import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import ApiError from "./ApiError.js";

if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
) {
    throw new Error(
        "Cloudinary environment variables are missing"
    );
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (
    localFilePath: string
) => {

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