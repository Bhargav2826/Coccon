import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Call from '../src/models/Call.js';
import User from '../src/models/User.js';

async function verifyTranscriptSystem() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Check total calls in database
        const totalCalls = await Call.countDocuments();
        console.log(`📊 Total Calls in Database: ${totalCalls}`);

        // 2. Check calls with transcripts
        const callsWithTranscripts = await Call.countDocuments({
            'transcripts.0': { $exists: true }
        });
        console.log(`📝 Calls with Transcripts: ${callsWithTranscripts}`);

        // 3. Check calls without transcripts
        const callsWithoutTranscripts = totalCalls - callsWithTranscripts;
        console.log(`⚠️  Calls without Transcripts: ${callsWithoutTranscripts}`);

        // 4. Show sample calls with transcripts
        console.log('\n📋 Sample Calls with Transcripts:');
        const sampleCalls = await Call.find({ 'transcripts.0': { $exists: true } })
            .populate('transcripts.sender', 'fullName role')
            .populate('participants', 'fullName role')
            .limit(5)
            .sort({ createdAt: -1 });

        sampleCalls.forEach((call, index) => {
            console.log(`\n--- Call ${index + 1} ---`);
            console.log(`Room ID: ${call.roomId}`);
            console.log(`Type: ${call.type}`);
            console.log(`Status: ${call.status}`);
            console.log(`Started: ${call.startedAt}`);
            console.log(`Participants: ${call.participants.map(p => `${p.fullName} (${p.role})`).join(', ')}`);
            console.log(`Transcript Count: ${call.transcripts.length}`);

            if (call.transcripts.length > 0) {
                console.log('Sample Transcript Lines:');
                call.transcripts.slice(0, 3).forEach((t, i) => {
                    console.log(`  ${i + 1}. [${t.sender?.fullName || 'Unknown'}]: ${t.text.substring(0, 50)}...`);
                });
            }

            if (call.summary) {
                console.log(`Summary: ${call.summary.substring(0, 100)}...`);
            }
        });

        // 5. Check for ongoing calls (potential issues)
        const ongoingCalls = await Call.countDocuments({ status: 'ongoing' });
        console.log(`\n⏳ Ongoing Calls: ${ongoingCalls}`);

        if (ongoingCalls > 0) {
            console.log('⚠️  Warning: There are ongoing calls. These should be marked as "ended" after completion.');
            const ongoing = await Call.find({ status: 'ongoing' })
                .select('roomId startedAt')
                .limit(5);
            ongoing.forEach(call => {
                const duration = Date.now() - new Date(call.startedAt).getTime();
                const hours = Math.floor(duration / (1000 * 60 * 60));
                console.log(`  - ${call.roomId} (started ${hours} hours ago)`);
            });
        }

        // 6. Verify transcript data integrity
        console.log('\n🔍 Verifying Transcript Data Integrity...');
        const callsWithInvalidTranscripts = await Call.find({
            'transcripts.0': { $exists: true }
        });

        let invalidCount = 0;
        for (const call of callsWithInvalidTranscripts) {
            for (const transcript of call.transcripts) {
                if (!transcript.text || transcript.text.trim() === '') {
                    invalidCount++;
                }
            }
        }

        console.log(`❌ Invalid/Empty Transcripts: ${invalidCount}`);

        // 7. Check if transcripts have sender information
        const transcriptsWithoutSender = await Call.aggregate([
            { $unwind: '$transcripts' },
            { $match: { 'transcripts.sender': { $exists: false } } },
            { $count: 'count' }
        ]);

        const noSenderCount = transcriptsWithoutSender.length > 0 ? transcriptsWithoutSender[0].count : 0;
        console.log(`⚠️  Transcripts without Sender: ${noSenderCount}`);

        // 8. Summary
        console.log('\n📈 Summary:');
        console.log(`✅ System is ${callsWithTranscripts > 0 ? 'WORKING' : 'NOT WORKING'}`);
        console.log(`✅ Transcripts are being saved: ${callsWithTranscripts > 0 ? 'YES' : 'NO'}`);
        console.log(`✅ Data persistence: ${callsWithTranscripts > 0 ? 'CONFIRMED' : 'FAILED'}`);

        if (callsWithoutTranscripts > 0) {
            console.log(`\n💡 Tip: ${callsWithoutTranscripts} calls don't have transcripts. This is normal if:`);
            console.log('   - Participants didn\'t speak during the call');
            console.log('   - The call was very short');
            console.log('   - Audio streaming wasn\'t enabled');
        }

        console.log('\n✅ Verification Complete!');

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run verification
verifyTranscriptSystem();
