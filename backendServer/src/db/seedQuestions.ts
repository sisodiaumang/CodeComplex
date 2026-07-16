import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./connectDB.js";
import Question from "../models/question.model.js";

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

function cleanConstraintValue(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^(-?\d+)\^(\d+)$/.test(trimmed)) {
      const match = trimmed.match(/^(-?\d+)\^(\d+)$/);
      if (match) return Math.pow(parseInt(match[1], 10), parseInt(match[2], 10));
    }
    if (/^(-?\d+)\*\*(\d+)$/.test(trimmed)) {
      const match = trimmed.match(/^(-?\d+)\*\*(\d+)$/);
      if (match) return Math.pow(parseInt(match[1], 10), parseInt(match[2], 10));
    }
    if (/^2\^31\s*-\s*1$/.test(trimmed) || /^2\*\*31\s*-\s*1$/.test(trimmed)) {
      return 2147483647;
    }
    if (/^-2\^31$/.test(trimmed) || /^-2\*\*31$/.test(trimmed)) {
      return -2147483648;
    }
  }
  return undefined;
}

async function seed() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully!");

    const questionsDir = path.join(process.cwd(), "src/db/dsa/questions");
    if (!fs.existsSync(questionsDir)) {
      console.error(`Questions directory not found at: ${questionsDir}`);
      process.exit(1);
    }

    console.log(`Scanning questions in: ${questionsDir}`);
    const jsonFiles = getFilesRecursively(questionsDir);
    console.log(`Found ${jsonFiles.length} JSON files.`);

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

        // Clean constraints values for Mongoose Schema (needs Number type)
        if (json.statement && Array.isArray(json.statement.constraints)) {
          for (const c of json.statement.constraints) {
            c.min = cleanConstraintValue(c.min);
            c.max = cleanConstraintValue(c.max);
          }
        }

        // Normalize empty inputs and verify visibility counts
        if (Array.isArray(json.testCases)) {
          for (const tc of json.testCases) {
            if (tc.input === "") {
              tc.input = "\n";
            }
          }
          const visibleTcs = json.testCases.filter((tc: any) => tc.isVisible);
          const hiddenTcs = json.testCases.filter((tc: any) => !tc.isVisible);
          if (visibleTcs.length === json.testCases.length && json.testCases.length > 1) {
            json.testCases[json.testCases.length - 1].isVisible = false;
          } else if (hiddenTcs.length === json.testCases.length && json.testCases.length > 1) {
            json.testCases[0].isVisible = true;
          }
        }

        // Fill missing solutions with placeholders to satisfy mongoose validation
        if (json.solutions && json.judgeConfig && Array.isArray(json.judgeConfig.supportedLanguages)) {
          for (const lang of json.judgeConfig.supportedLanguages) {
            if (!json.solutions[lang]) {
              json.solutions[lang] = lang === "python" ? "# Reference solution placeholder" : "// Reference solution placeholder";
            }
          }
        }

        const existing = await Question.findById(json._id);
        if (existing) {
          // Merge and save
          Object.assign(existing, json);
          await existing.save();
          updatedCount++;
        } else {
          // Create new
          const newDoc = new Question(json);
          await newDoc.save();
          insertedCount++;
        }
      } catch (error: any) {
        console.error(`Error processing file ${path.basename(file)}:`, error?.message || error);
        errorCount++;
      }
    }

    console.log(`\nSeeding completed!`);
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
