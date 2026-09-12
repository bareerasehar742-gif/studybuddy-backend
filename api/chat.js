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


  /* Handle browser preflight */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  /* Only allow POST */

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    const { question } = req.body || {};


    /* Check question */

    if (!question || !question.trim()) {

      return res.status(400).json({
        error: "Please enter a question."
      });

    }


    /* Ask OpenAI */

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
            `You are PochoJii AI, a friendly general-purpose AI assistant.

Your tagline is: "Poch jo poochna hai."

Answer the user's questions clearly, accurately, and safely.

You can help with:
- General questions
- School and learning
- Mathematics
- Science
- Programming
- Writing
- Ideas and brainstorming
- Explanations
- Problem solving
- Everyday questions

Explain difficult things simply when helpful.

Be friendly, useful, and concise.

Do not pretend to be a teacher for only one specific subject or exam.`,

          input: question.trim()

        })

      }
    );


    const data = await response.json();


    console.log(
      "OPENAI STATUS:",
      response.status
    );


    /* OpenAI error */

    if (!response.ok) {

      console.log(
        "OPENAI ERROR:",
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI request failed."
      });

    }


    /* Get answer */

    let answer = data.output_text;


    /* Backup answer extraction */

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


    /* No answer */

    if (!answer) {

      console.log(
        "NO ANSWER:",
        JSON.stringify(data)
      );

      return res.status(500).json({

        error:
          "PochoJii responded, but no answer text was found."

      });

    }


    /* Send answer to website */

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
        "Something went wrong with PochoJii AI."

    });

  }

}
