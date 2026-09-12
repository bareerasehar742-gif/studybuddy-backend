export default async function handler(req, res) {
  // Allow the StudyBuddy website to communicate with this backend
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://bareerasehar742-gif.github.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle browser permission check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { question, subject } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: `You are StudyBuddy AI, a friendly O-Level tutor.

The student is studying: ${subject || "O Levels"}.

Explain things clearly and simply at an O-Level level.
Teach the reasoning instead of only giving the answer.
Use examples when helpful.
Be encouraging and concise.`,
        input: question.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error: "OpenAI could not answer the question."
      });
    }

    return res.status(200).json({
      answer: data.output_text || "Sorry, I couldn't generate an answer."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong with the AI tutor."
    });
  }
}
