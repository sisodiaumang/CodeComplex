import { upload } from "./multer.middleware.js";



export const uploadAvatar = upload.single("avatar");