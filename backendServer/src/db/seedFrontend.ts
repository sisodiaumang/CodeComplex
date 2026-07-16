import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./connectDB.js";
import FrontendQuestion from "../models/frontendQuestion.model.js";

function getFilesRecursively(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (item.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function seed() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully!");

    const questionsDir = path.join(process.cwd(), "src/db/frontend/questions");
    if (!fs.existsSync(questionsDir)) {
      console.error(`Frontend questions directory not found at: ${questionsDir}`);
      process.exit(1);
    }

    console.log(`Scanning frontend questions in: ${questionsDir}`);
    const jsonFiles = getFilesRecursively(questionsDir);
    console.log(`Found ${jsonFiles.length} JSON files.`);

    console.log("Cleaning up old frontend questions from database...");
    await FrontendQuestion.deleteMany({});
    console.log("Database cleared.");

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");
        const json = JSON.parse(content);

        if (!json._id) {
          console.warn(`File ${path.basename(file)} has no _id field, skipping.`);
          continue;
        }

        const existing = await FrontendQuestion.findOne({
          $or: [
            { _id: json._id },
            { slug: json.slug }
          ]
        });
        if (existing) {
          // Merge and save, preventing modifying immutable _id
          const { _id, ...updateData } = json;
          Object.assign(existing, updateData);
          await existing.save();
          updatedCount++;
        } else {
          // Create new
          const newDoc = new FrontendQuestion(json);
          await newDoc.save();
          insertedCount++;
        }
      } catch (error: any) {
        console.error(`Error processing file ${path.basename(file)}:`, error?.message || error);
        errorCount++;
      }
    }

    console.log(`\nFrontend Seeding completed!`);
    console.log(`Successfully Inserted: ${insertedCount}`);
    console.log(`Successfully Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (err) {
    console.error("Database connection or seeding failure:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
    process.exit(0);
  }
}

seed();
