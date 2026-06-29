const { Queue, Worker } = require('bullmq');
const { generateSummaryFromGemini } = require('../utils/summaryUtils');
const Summary = require('../models/Summary');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  maxRetriesPerRequest: null,
};

const JOB_OPTIONS = { attempts: 3, backoff: { type: 'fixed', delay: 10000 } };

const summaryQueue = new Queue('summaryQueue', { connection });

const worker = new Worker(
  'summaryQueue',
  async (job) => {
    const { videoId } = job.data;
    console.log(`📽️ [PROCESSING] videoId: ${videoId}, attempt: ${job.attemptsMade + 1}`);

    const video = await Summary.findOne({ videoId });
    if (!video) return;
    if (video.status === 'completed') return;

    const summary = await generateSummaryFromGemini(videoId);
    if (!summary) throw new Error('Empty summary returned');

    video.summary = summary;
    video.status = 'completed';
    video.attempts = job.attemptsMade + 1;
    await video.save();
    console.log(`✅ [SUCCESS] Summary saved for ${videoId}`);
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  const { videoId } = job.data;
  const isFinal = job.attemptsMade >= job.opts.attempts;

  console.error(
    `${isFinal ? '❌ [FINAL FAILURE]' : '⚠️ [ATTEMPT FAILED]'} videoId: ${videoId}, attempt ${job.attemptsMade} - ${err.message}`
  );

  await Summary.findOneAndUpdate(
    { videoId },
    { attempts: job.attemptsMade, ...(isFinal ? { status: 'failed' } : {}) }
  );
});

// Re-queue pending/failed jobs on startup (safety net for Redis crash)
const startSummaryWorker = async () => {
  const tasks = await Summary.find({
    status: 'pending',
    attempts: { $lt: 3 },
  });

  for (const task of tasks) {
    console.log(`📌 [QUEUEING] Re-adding videoId: ${task.videoId}`);
    await summaryQueue.add(
      'generateSummary',
      { videoId: task.videoId },
      { ...JOB_OPTIONS, jobId: task.videoId }
    );
  }

  console.log(`[✔] Summary worker restarted with ${tasks.length} tasks`);
};

module.exports = { summaryQueue, startSummaryWorker, JOB_OPTIONS };
