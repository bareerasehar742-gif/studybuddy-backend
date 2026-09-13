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

  // CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // TEST
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      server: "online",
      message: "PochoJii backend is working"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const question =
      typeof body.question === "string"
        ? body.question
        : "";

    if (!question.trim()) {
      return res.status(400).json({
        success: false,
        error: "No question received"
      });
    }

    // IMPORTANT:
    // This test does NOT call OpenAI.
    return res.status(200).json({
      success: true,
      answer:
        "TEST SUCCESS! I received your message: " +
        question
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Backend crashed"
    });
  }
}
