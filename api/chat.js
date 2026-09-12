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

    const {
      question,
      action
    } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter something."
      });
    }


    /* =========================
       IMAGE GENERATION
       ========================= */

    if (action === "image") {

      const imageResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization":
              `Bearer ${process.env.OPENAI_API_KEY}`
          },

          body: JSON.stringify({

            model: "gpt-image-2",

            prompt: question.trim(),

            size: "1024x1024"

          })
        }
      );


      const imageData =
        await imageResponse.json();


      if (!imageResponse.ok) {

        console.error(
          "IMAGE ERROR:",
          JSON.stringify(imageData)
        );

        return res.status(
          imageResponse.status
        ).json({

          error:
            imageData?.error?.message ||
            "Image generation failed."

        });

      }


      const image =
        imageData?.data?.[0]?.b64_json;


      if (!image) {

        return res.status(500).json({

          error:
            "The image was generated, but no image data was returned."

        });

      }


      return res.status(200).json({

        image:
          `data:image/png;base64,${image}`

      });

    }


    /* =========================
       NORMAL CHAT
       ========================= */

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

Your tagline is:
"Poch jo poochna hai."

You are a friendly general-purpose AI assistant.

You can help with:
- General questions
- School and learning
- Mathematics
- Science
- Programming
- Writing
- Ideas
- Brainstorming
- Explanations
- Problem solving
- Everyday questions

Explain difficult things simply.

Be friendly, useful and concise.

If the user asks for a document,
give well-organized content that can
be turned into a PDF.

Do not claim that you created an actual
PDF or image when you only generated text.
          `,

          input: question.trim()

        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "OPENAI ERROR:",
        JSON.stringify(data)
      );

      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "OpenAI request failed."

      });

    }


    let answer =
      data.output_text;


    if (!answer && data.output) {

      for (
        const item of data.output
      ) {

        if (item.content) {

          for (
            const content of item.content
          ) {

            if (content.text) {

              answer =
                content.text;

              break;

            }

          }

        }

        if (answer) break;

      }

    }


    if (!answer) {

      return res.status(500).json({

        error:
          "PochoJii responded, but no answer text was found."

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
        "Something went wrong with PochoJii."

    });

  }

}
