const Queue = require('bull');
const { generateSummaryFromGemini } = require('../utils/summaryUtils');
const Summary = require('../models/Summary');

const JOB_OPTIONS = { attempts: 3, backoff: { type: 'fixed', delay: 10000 } };

const summaryQueue = new Queue('summaryQueue');

summaryQueue.process(async (job) => {
  const { videoId, playlistId } = job.data;
  console.log(`📽️ [PROCESSING] videoId: ${videoId}, attempt: ${job.attemptsMade + 1}`);

  const video = await Summary.findOne({ videoId, playlistId });
  if (!video) return;
  if (video.status === 'completed') return;

  const summary = await generateSummaryFromGemini(videoId);
  if (!summary) throw new Error('Empty summary returned');

  video.summary = summary;
  video.status = 'completed';
  video.attempts = job.attemptsMade + 1;
  await video.save();
  console.log(`✅ [SUCCESS] Summary saved for ${videoId}`);
});

summaryQueue.on('failed', async (job, err) => {
  const { videoId, playlistId } = job.data;
  const isFinal = job.attemptsMade >= job.opts.attempts;

  console.error(
    `${isFinal ? '❌ [FINAL FAILURE]' : '⚠️ [ATTEMPT FAILED]'} videoId: ${videoId}, attempt ${job.attemptsMade} - ${err.message}`
  );

  await Summary.findOneAndUpdate(
    { videoId, playlistId },
    { attempts: job.attemptsMade, ...(isFinal ? { status: 'failed' } : {}) }
  );
});

// Re-queue pending/failed jobs on startup (safety net for Redis crash)
const startSummaryWorker = async () => {
  const tasks = await Summary.find({
    status: { $in: ['pending', 'failed'] },
    attempts: { $lt: 3 },
  });

  tasks.forEach((task) => {
    console.log(`📌 [QUEUEING] Re-adding videoId: ${task.videoId}`);
    summaryQueue.add(
      { videoId: task.videoId, playlistId: task.playlistId },
      { ...JOB_OPTIONS, jobId: `${task.videoId}-${task.playlistId}` }
    );
  });

  console.log(`[✔] Summary worker restarted with ${tasks.length} tasks`);
};

module.exports = { summaryQueue, startSummaryWorker, JOB_OPTIONS };
