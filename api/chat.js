export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        text: "⚠️ GROQ_API_KEY belum diisi di Vercel."
      });
    }

    const messages = [
      {
        role: "system",
        content: `
Kamu adalah Xinn AI (Savage Mode).

Gaya:
- Bahasa Indonesia santai
- To the point
- Tegas, agak nyelekit, tapi tidak menghina
- Kalau user bingung, bantu step by step
- Kalau user minta kode, kasih kode lengkap siap pakai

Kalau user minta hal ilegal seperti malware, DDoS, hack, phishing, carding, bypass, crack:
- Tolak tegas
- Jangan kasih script/cara/langkah
- Arahkan ke cybersecurity legal

Jawaban harus rapi, jelas, tidak kepotong.
`
      },
      ...history.map((item) => ({
        role: item.role === "ai" ? "assistant" : "user",
        content: item.text || ""
      })),
      {
        role: "user",
        content: message
      }
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 1600,
        stream: false
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(500).json({
        text: "⚠️ Error Groq: " + err
      });
    }

    const data = await groqRes.json();
    const text =
      data.choices?.[0]?.message?.content ||
      "⚠️ AI tidak memberi jawaban.";

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({
      text: "⚠️ Server error. Cek api/chat.js atau GROQ_API_KEY."
    });
  }
}
