import connectDB from "./connectDB.js";
import Report from "../models/report.model.js";

async function run() {
    await connectDB();
    console.log("Attempting to insert a mock QUESTION report...");
    try {
        const report = await Report.create({
            reporter: "648f29f0c29f28a34b22c710", // mock user ObjectId
            targetType: "QUESTION",
            reportedQuestion: "648f29f0c29f28a34b22c720", // mock question ObjectId
            reason: "WRONG_STARTER_CODE",
            details: "i dont think it is correct",
            status: "PENDING"
        });
        console.log("Mock report inserted successfully:", report);
    } catch (err) {
        console.error("FAIL:", err);
    }
    process.exit(0);
}

run().catch(console.error);
