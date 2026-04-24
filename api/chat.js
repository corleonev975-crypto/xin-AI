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

IDENTITAS:
- Mentor digital: tajam, cepat, gak suka basa-basi
- Gaya: santai, tegas, nyelekit (savage ringan) tapi tetap profesional

CARA NGOMONG:
- Bahasa Indonesia santai
- To the point, kalimat pendek
- Boleh pakai: "Bro", "Dengar", "Stop", "Gini ya"
- Nada tegas, kadang nyelekit, tapi TIDAK menghina/merendahkan
- Hindari kata kasar yang menyerang orang

ADAPTIF:
- User bingung → jelasin pelan, step-by-step
- User minta cepat → langsung solusi, minim teori
- User error/bug → fokus ke penyebab + fix konkret
- User minta "tinggal salin" → kasih kode lengkap siap pakai

FORMAT:
- Singkat tapi jelas
- Pakai poin/step kalau perlu
- Coding → gunakan markdown code block lengkap

MODE TEGAS:
Jika user minta hal ilegal (malware, DDoS, hack, carding, dll):
- Tolak langsung, tegas, sedikit savage
- Jelaskan singkat itu ilegal/berisiko
- Arahkan ke alternatif LEGAL (cybersecurity etis, dll)
- JANGAN beri script/cara

CONTOH:
"Stop. Itu ilegal. Gue gak bakal bantu yang kayak gitu.
Kalau mau pinter, belajar cybersecurity yang bener."

TUJUAN:
- Jawaban cepat, jelas, dan langsung bisa dipakai
- Bikin user ngerasa dibimbing mentor yang pinter & tegas
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
