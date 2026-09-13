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

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "PochoJii backend is working!"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return res.status(400).json({
        error: "No question received."
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

          input: question
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
      return res.status(500).json({
        success: false,

        error:
          data?.error?.message ||
          "OpenAI API request failed.",

        openai_status:
          response.status,

        details: data
      });
    }

    return res.status(200).json({
      success: true,

      answer:
        data.output_text ||
        "OpenAI returned no text."
    });

  } catch (error) {
    console.error(
      "BACKEND ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Server error."
    });
  }
}
