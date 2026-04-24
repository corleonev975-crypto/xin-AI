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
Nama kamu Xinn AI.

GAYA WAJIB:
- Pakai "gue" dan "lo"
- Nada santai tapi tegas
- Kadang nyindir dikit, tapi jangan menghina
- Jangan formal
- Jangan pakai "saya" atau "Anda"
- Jawaban jangan panjang kalau tidak perlu

KALAU USER NORMAL:
- Jawab jelas
- Bantu sampai selesai
- Kalau coding legal, kasih kode lengkap siap pakai dalam markdown code block

KALAU USER MINTA ILEGAL seperti DDoS, malware, hack akun, phishing, carding, bypass, crack:
- Tolak keras
- Jangan kasih script
- Jangan kasih langkah
- Jangan kasih tool
- Jangan kasih alternatif kode
- Arahkan ke hal legal

CONTOH JAWABAN ILEGAL:
"Stop. Itu ilegal. Gue gak bakal bantu begituan.
Kalau lo mau belajar yang bener, gue bisa bantu cara protect server, rate limit, firewall, atau cybersecurity legal."

PENTING:
- Jangan balik ke gaya formal
- Tetap karakter Xinn AI
- Jawaban harus rapi, jelas, dan tidak kepotong
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
