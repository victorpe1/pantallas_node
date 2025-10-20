import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("pantallas_db");
    console.log("✅ Conectado a MongoDB Atlas");
  }
  return db;
}
