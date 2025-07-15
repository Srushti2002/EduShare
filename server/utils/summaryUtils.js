// summaryUtils.js
const fetch = require("node-fetch");
const dotenv = require('dotenv');
dotenv.config();

const generateSummaryFromGemini = async (videoId) => {
  // CORRECTED: Use a standard YouTube watch URL
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const apiKey = process.env.GEMINI_API_KEY;

  // The text part of the prompt
  const textPrompt = `Summarize this YouTube video in 1 lines. Avoid adding code snippets to the summary. Focus on the main points.`;

  // Construct the contents array for multimodal input
  const contents = [
    {
      parts: [
        { text: textPrompt }, // Your text instructions
        {
          fileData: {
            mimeType: "video/mp4", // Specify the mime type for video
            fileUri: videoUrl,    // The actual YouTube video URL for the model to process
          },
        },
      ],
    },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: contents }), // Pass the correctly structured contents
      }
    );

    const data = await res.json();
    console.log(
      `📥 [RESPONSE] Gemini API response for ${videoId}:`,
      JSON.stringify(data, null, 2)
    );

    // Check for API errors in the response
    if (data.error) {
      console.error(`❌ [ERROR] Gemini API returned an error for videoId: ${videoId}`, data.error);
      // You might want to throw an error here to be caught by a retry mechanism
      return null;
    }

    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(summary)
    if (!summary) {
      console.warn(`⚠️ [WARNING] No summary found in Gemini API response for videoId: ${videoId}`);
      return null;
    }
    return summary;
  } catch (error) {
    console.error(`❌ [ERROR] Failed to fetch summary for videoId: ${videoId}`, error);
    return null;
  }
};

async function generateMCQsWithGemini(combinedSummary, count = 20) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Generate ${count} multiple-choice questions (MCQs) based on the following combined summaries.
  Output ONLY a JSON array of objects. Do NOT include any introductory or concluding text, explanations, or code block formatting (like \`\`\`json).
  Each question object must have "question" (string), "options" (array of 4 strings), and "ans" (string, A, B, C, or D).

  Example Format:
  [
    {
      "question": "Example question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "ans": "A"
    }
  ]

  Combined Summaries:
  ${combinedSummary}
  `;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error("Gemini API error:", data.error);
      return null;
    }
    const mcqText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!mcqText) {
      console.warn("No MCQs found in Gemini API response.");
      return null;
    }

    // Attempt to clean and parse the JSON string
    let cleanedMcqText = mcqText.trim();
    // Remove potential leading/trailing markdown code blocks or extra text
    if (cleanedMcqText.startsWith('```json')) {
      cleanedMcqText = cleanedMcqText.substring(7);
    }
    if (cleanedMcqText.endsWith('```')) {
      cleanedMcqText = cleanedMcqText.substring(0, cleanedMcqText.length - 3);
    }
    // Remove any other common non-JSON characters like `json` or leading/trailing whitespace
    cleanedMcqText = cleanedMcqText.replace(/^json\s*/, '').trim();
    cleanedMcqText = cleanedMcqText.replace(/\s*json$/, '').trim(); // In case 'json' is at the end

    try {
      const mcqs = JSON.parse(cleanedMcqText);
      console.log("✅ Successfully parsed MCQs.");
      return mcqs; // Return the parsed JSON array
    } catch (parseError) {
      console.error("❌ Failed to parse MCQ JSON:", parseError);
      console.error("Raw MCQ text received:", cleanedMcqText);
      return null;
    }

  } catch (error) {
    console.error("Gemini MCQ generation error:", error);
    return null;
  }
}


module.exports = { generateSummaryFromGemini, generateMCQsWithGemini };