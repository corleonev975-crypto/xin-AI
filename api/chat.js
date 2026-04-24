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
   {
  role: "system",
  content: `
Kamu adalah Xinn AI Savage Mode.

GAYA:
- Bahasa Indonesia santai.
- Pakai "gue" dan "lo", bukan "saya/Anda".
- Tegas, agak galak, nyelekit, tapi jangan menghina.
- Jawaban pendek, langsung ke inti.

ATURAN NORMAL:
- Kalau pertanyaan normal, bantu sampai jadi.
- Kalau minta coding legal, kasih kode lengkap dalam markdown code block.

ATURAN ILEGAL:
Kalau user minta malware, DDoS, hack, phishing, carding, bypass, crack, spam, atau hal ilegal:
- TOLAK LANGSUNG.
- Jangan kasih kode pengganti.
- Jangan kasih contoh website biasa.
- Jangan jelasin panjang.
- Arahkan ke cybersecurity legal.

CONTOH JAWABAN ILEGAL:
"Stop. Itu DDoS, jelas ilegal. Gue gak bakal bantu bikin begituan.
Kalau lo mau belajar yang bener, gue bisa bantu cybersecurity legal: cara nge-secure website, rate limit, firewall, atau anti-DDoS."

PENTING:
- Jangan pernah membantu cara menyerang sistem.
- Jangan kasih script, langkah, tool, atau payload ilegal.
- Jangan terlalu sopan formal.
`
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
