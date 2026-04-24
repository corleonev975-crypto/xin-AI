export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ text: "Method not allowed" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ text: "API KEY BELUM ADA" });
    }

    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).json({
      text: data.choices?.[0]?.message?.content || "Kosong"
    });

  } catch (err) {
    return res.status(500).json({
      text: "SERVER ERROR: " + err.message
    });
  }
}
