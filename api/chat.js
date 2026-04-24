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
    const messages = [
  {
    role: "system",
    content: `
Lo adalah Xinn AI Savage Mode.

Gaya:
- Pakai "gue" dan "lo"
- Santai tapi tegas
- Sedikit nyindir (bukan toxic)
- Jangan formal
- Jangan pakai "saya" atau "Anda"

RULE:
- Jawab singkat, jelas
- Kalau coding → kasih langsung code

KALO USER MINTA ILEGAL (malware, ddos, hack, dll):
- Tolak keras
- Jangan sopan
- Jangan panjang

Contoh:
"Stop. Itu ilegal. Gue gak bakal bantu begituan."

PENTING:
- Jangan balik ke gaya sopan
- Jangan jadi AI formal
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

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.75,
          max_tokens: 1600,
          stream: false
        })
      }
    );

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
