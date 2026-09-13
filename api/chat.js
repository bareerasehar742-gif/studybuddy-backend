```js
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

function extractText(data) {
  // Normal Responses API output
  if (typeof data?.output_text === "string" &&
      data.output_text.trim()) {
    return data.output_text.trim();
  }

  // Manually extract output_text items
  const parts = [];

  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;

    for (const content of item.content || []) {
      if (
        content?.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function cleanMessages(messages, question) {
  let list = Array.isArray(messages)
    ? messages
        .filter(
          (m) =>
            (m.role === "user" ||
             m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim()
        )
        .map((m) => ({
          role: m.role,
          content: m.content.trim()
        }))
    : [];

  if (list.length > 40) {
    list = list.slice(-40);
  }

  if (
    list.length === 0 &&
    typeof question === "string" &&
    question.trim()
  ) {
    list = [
      {
        role: "user",
        content: question.trim()
      }
    ];
  }

  return list;
}

function makeTranscript(messages) {
  return messages
    .map((m) => {
      if (m.role === "user") {
        return "USER:\n" + m.content;
      }

      return "POCHOJII AI:\n" + m.content;
    })
    .join("\n\n");
}

async function askOpenAI(messages) {
  const transcript =
    makeTranscript(messages);

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

        instructions: `
You are PochoJii AI.

You are a friendly study assistant.

The conversation transcript below is your short-term
conversation memory.

Use previous messages when answering follow-up questions.

If the user asks what they said earlier,
what their name was, what they were discussing,
or what "it", "that", or "this" refers to,
look at the transcript.

Do not claim to forget information that appears
in the transcript.

Give clear, beginner-friendly explanations.
`,

        input:
          "Conversation so far:\n\n" +
          transcript +
          "\n\nContinue the conversation naturally.",

        text: {
          verbosity: "medium"
        }
      })
    }
  );

  const data = await response.json();

  console.log(
    "OPENAI STATUS:",
    response.status
  );

  if (!response.ok) {
    console.error(
      "OPENAI ERROR:",
      JSON.stringify(data)
    );

    throw new Error(
      data?.error?.message ||
      "OpenAI request failed."
    );
  }

  const answer = extractText(data);

  if (!answer) {
    console.error(
      "NO TEXT RESPONSE:",
      JSON.stringify(data)
    );

    throw new Error(
      "OpenAI returned a response without text."
    );
  }

  return answer;
}

async function generateImage(prompt) {
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

        input: prompt,

        tools: [
          {
            type: "image_generation",
            model: "gpt-image-2"
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "IMAGE ERROR:",
      JSON.stringify(data)
    );

    throw new Error(
      data?.error?.message ||
      "Image generation failed."
    );
  }

  const imageCall =
    (data.output || []).find(
      (item) =>
        item.type ===
        "image_generation_call"
    );

  if (!imageCall?.result) {
    console.error(
      "IMAGE RESPONSE:",
      JSON.stringify(data)
    );

    throw new Error(
      "Image was not returned."
    );
  }

  return imageCall.result;
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "PochoJii AI backend is online!"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const action =
      body.action || "chat";

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (action === "image") {
      if (!question) {
        return res.status(400).json({
          error:
            "Please describe the image."
        });
      }

      const image =
        await generateImage(question);

      return res.status(200).json({
        success: true,
        image:
          "data:image/png;base64," +
          image
      });
    }

    const messages =
      cleanMessages(
        body.messages,
        question
      );

    if (!messages.length) {
      return res.status(400).json({
        error:
          "Please enter a message."
      });
    }

    const answer =
      await askOpenAI(messages);

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    console.error(
      "POCHOJII ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Something went wrong."
    });
  }
}
```
