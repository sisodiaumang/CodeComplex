import dns from 'dns';
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import mongoose from 'mongoose';

const uri = "mongodb+srv://umangsisodia2006_db_user:fqAQWlkeH9QSurNm@cluster0.nbrpx3d.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  // Find latest submission
  const submissions = await db.collection('submissions').find({}).sort({ createdAt: -1 }).limit(1).toArray();
  
  if (submissions.length === 0) {
    console.log("No submissions found.");
  } else {
    const s = submissions[0];
    console.log("--- LATEST SUBMISSION ---");
    console.log("ID:", s._id);
    console.log("Status:", s.status);
    console.log("Result:", s.judgeResult);
    console.log("Score:", s.score);
    console.log("Pass rate:", s.passedTestCases, "/", s.totalTestCases);
    console.log("Feedback:\n", s.feedback);
    console.log("Source Code:\n", s.sourceCode);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
