const ALLOWED_ORIGIN =
  "https://bareerasehar742-gif.github.io";

function cors(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGIN
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

function getText(data) {
  // Best/simple response
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  // Backup extraction
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;

      for (const content of item.content) {
        if (
          content?.type === "output_text" &&
          typeof content.text === "string" &&
          content.text.trim()
        ) {
          return content.text.trim();
        }
      }
    }
  }

  return "";
}

export default async function handler(req, res) {
  cors(res);

  // Browser CORS check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      server: "online",
      message: "PochoJii AI backend is working"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // --------------------------------
    // CHECK API KEY
    // --------------------------------

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          "OPENAI_API_KEY is missing in Vercel Environment Variables."
      });
    }

    // --------------------------------
    // READ REQUEST
    // --------------------------------

    const body = req.body || {};

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "No question received."
      });
    }

    // --------------------------------
    // CONVERSATION MEMORY
    // --------------------------------

    let oldMessages = [];

    if (Array.isArray(body.messages)) {
      oldMessages = body.messages
        .filter(
          (message) =>
            message &&
            (message.role === "user" ||
              message.role === "assistant") &&
            typeof message.content === "string"
        )
        .slice(-20);
    }

    const conversation = [
      ...oldMessages,
      {
        role: "user",
        content: question
      }
    ];

    // --------------------------------
    // OPENAI REQUEST
    // --------------------------------

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model:
            process.env.OPENAI_MODEL ||
            "gpt-5.4-mini",

          instructions: `
You are PochoJii AI.

You are a friendly, helpful general-purpose AI assistant.

Personality:
- Friendly
- Natural
- Helpful
- Clear
- Slightly playful when appropriate
- Do not overuse emojis
- Do not put emojis in every sentence

The user may ask about:
- School
- Programming
- Mathematics
- Science
- Writing
- General knowledge
- Ideas
- Projects
- Coding
- Everyday questions

Give accurate and useful answers.

If the user asks for code, give working code and explain it simply when useful.

If the user asks a simple question, do not give an unnecessarily huge answer.

Remember the conversation context provided in the messages.
          `,

          input: conversation
        })
      }
    );

    // --------------------------------
    // READ OPENAI RESPONSE
    // --------------------------------

    const data = await response.json();

    // OpenAI returned an error
    if (!response.ok) {
      console.error(
        "OpenAI API error:",
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          "OpenAI API request failed."
      });
    }

    // --------------------------------
    // EXTRACT AI TEXT
    // --------------------------------

    const answer = getText(data);

    if (!answer) {
      console.error(
        "No text returned from OpenAI:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        success: false,
        error:
          "OpenAI returned a response, but no text was found."
      });
    }

    // --------------------------------
    // SEND TO WEBSITE
    // --------------------------------

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    console.error(
      "SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Something went wrong on the server."
    });
  }
}
