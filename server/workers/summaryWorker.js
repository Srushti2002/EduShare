const Queue = require('bull');
const { generateSummaryFromGemini } = require('../utils/summaryUtils');
const Summary = require('../models/Summary');

const summaryQueue = new Queue('summaryQueue');

summaryQueue.process(async (job, done) => {
  const { videoId, playlistId } = job.data;
  console.log(
    `📽️ [PROCESSING] Starting summary for videoId: ${videoId}, playlistId: ${playlistId}`
  );

  try {
    let video = await Summary.findOne({ videoId, playlistId });

    if (!videoId) {
      //   console.log(`⚠️ [SKIP] Video not found in DB for videoId: ${videoId}`);
      return done();
    }

    if (video.status === 'completed') {
      console.log(`✅ [SKIP] Already completed: ${videoId}`);
      return done();
    }

    if (video.attempts >= 3) {
      console.log(`❌ [SKIP] Max attempts reached for videoId: ${videoId}`);
      return done();
    }

    for (let attempt = video.attempts + 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `🔁 [TRY ${attempt}] Generating summary for videoId: ${videoId}`
        );
        const summary = await generateSummaryFromGemini(videoId);

        if (!summary) throw new Error('Empty summary returned');

        console.log(`📝 [SUCCESS] Summary for ${videoId}:\n${summary}`);

        video.summary = summary;
        video.status = 'completed';
        video.attempts = attempt;
        await video.save();

        return done();
      } catch (err) {
        console.log(
          `⚠️ [ERROR] Attempt ${attempt} failed for ${videoId}: ${err.message}`
        );
        video.attempts = attempt;
        await video.save();

        if (attempt < 3) {
          console.log(`⏱️ [WAITING] Retrying ${videoId} in 10 seconds...`);
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }

    // After 3 attempts
    console.log(`❌ [FAILED] Final failure for ${videoId}`);
    video.status = 'failed';
    await video.save();
    return done();
  } catch (err) {
    console.error(
      `🔥 [CRITICAL ERROR] Processing failed for videoId: ${videoId}`,
      err.message
    );
    return done(err);
  }
});

// 🔁 Restart pending/failed jobs on server restart
const startSummaryWorker = async () => {
  const tasks = await Summary.find({
    status: { $in: ['pending', 'failed'] },
    attempts: { $lt: 3 },
  });

  tasks.forEach((task) => {
    console.log(
      `📌 [QUEUEING] Re-adding task for videoId: ${task.videoId}, playlistId: ${task.playlistId}`
    );
    summaryQueue.add(
      { videoId: task.videoId, playlistId: task.playlistId },
      { jobId: `${task.videoId}-${task.playlistId}` }
    );
  });

  console.log(`[✔] Summary worker restarted with ${tasks.length} tasks`);
};

// ❗ Add listener to see job-level errors
summaryQueue.on('failed', (job, err) => {
  console.error(
    `🚨 [JOB FAILED] videoId: ${job.data.videoId}, playlistId: ${job.data.playlistId} - ${err.message}`
  );
});

module.exports = { summaryQueue, startSummaryWorker };
