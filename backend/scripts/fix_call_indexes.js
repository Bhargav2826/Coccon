
import mongoose from "mongoose";
import dotenv from "dotenv";
import Call from "../src/models/Call.js";

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const collection = mongoose.connection.collection("calls");

        // List current indexes
        const indexes = await collection.indexes();
        console.log("\nCurrent Indexes on 'calls' collection:");
        console.log(JSON.stringify(indexes, null, 2));

        // Find and drop the problematic index
        const indexName = "registerNumber_1";
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`\n⚠️ Found problematic index: ${indexName}`);
            await collection.dropIndex(indexName);
            console.log(`✅ Successfully dropped index: ${indexName}`);
        } else {
            console.log(`\nℹ️ Index ${indexName} not found. No action needed.`);
        }

        // Verify indexes after removal
        const updatedIndexes = await collection.indexes();
        console.log("\nUpdated Indexes on 'calls' collection:");
        console.log(JSON.stringify(updatedIndexes, null, 2));

        mongoose.disconnect();
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixIndexes();
