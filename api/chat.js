export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://bareerasehar742-gif.github.io"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions:
            `You are StudyBuddy AI, a friendly O-Level tutor.

The student is studying:
${subject || "O Levels"}

Explain things clearly and simply at an O-Level level.
Teach the reasoning instead of only giving the answer.
Use examples when helpful.
Be encouraging and concise.`,

          input: question.trim()
        })
      }
    );

    const data = await response.json();

    console.log(
      "OPENAI STATUS:",
      response.status
    );

    console.log(
      "OPENAI RESPONSE:",
      JSON.stringify(data)
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI request failed."
      });
    }

    let answer = data.output_text;

    if (!answer && data.output) {
      for (const item of data.output) {
        if (item.content) {
          for (const content of item.content) {
            if (content.text) {
              answer = content.text;
              break;
            }
          }
        }

        if (answer) break;
      }
    }

    if (!answer) {
      console.log(
        "NO ANSWER TEXT FOUND:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        error:
          "OpenAI responded, but no answer text was found."
      });
    }

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {

    console.error(
      "BACKEND ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Something went wrong with the AI tutor."
    });
  }
}
