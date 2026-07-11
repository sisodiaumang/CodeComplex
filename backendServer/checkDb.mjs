import mongoose from 'mongoose';

const uri = "mongodb+srv://umangsisodia2006_db_user:fqAQWlkeH9QSurNm@cluster0.nbrpx3d.mongodb.net/test?appName=Cluster0"; 

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  // Query raw documents from users collection
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users in database.`);
  
  users.forEach(u => {
    console.log(`- Username: ${u.username}`);
    console.log(`  Mascot Field:`, JSON.stringify(u.mascot));
  });

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
