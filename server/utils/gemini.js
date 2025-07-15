// const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSummaryFromTranscript = async (videoId) => {
  const transcriptPath = `./temp/${videoId}.mp3.txt`;
  if (!fs.existsSync(transcriptPath)) throw new Error("Transcript not found");

  const transcript = fs.readFileSync(transcriptPath, "utf-8");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Generate a concise summary of the following transcript:\n\n${transcript}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

module.exports = { generateSummaryFromTranscript };
