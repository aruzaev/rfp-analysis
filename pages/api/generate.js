import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "POST":
      if (req.query.endpoint === "categorize") {
        // Handle POST to /api/generate?endpoint=categorize
        const rfpText = req.body.rfpText;
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert in construction proposals and document categorization.",
              },
              {
                role: "user",
                content: `Please categorize and organize the following detailed RFP by creating appropriate headings and subheadings for each section. Ensure that each section includes specific and relevant details:

                ${rfpText}

                Make sure that each point is detailed, reflects the content, and organizes the information in a logical, structured manner.`,
              },
            ],
            max_tokens: 1000,
          });

          const categorizedRFP = completion.choices[0].message.content;
          res.status(200).json({ categorizedRFP });
        } catch (error) {
          console.error("Error categorizing RFP:", error);
          res.status(500).json({ error: "Failed to categorize RFP" });
        }
      } else {
        res.status(404).json({ error: "Not Found" });
      }
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
