export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { message, history = [] } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).end("⚠️ GROQ_API_KEY belum di-set di Vercel.");
    }

    // Persona: santai (gue/lo), tegas, manusiawi, tanpa kata kasar
    const systemPrompt = `
Lo adalah Xinn AI.

GAYA:
- Pakai "gue" dan "lo"
- Santai, jelas, langsung ke inti
- Boleh sedikit nyindir halus, tapi jangan menghina/berkata kasar
- Jangan pakai "saya/Anda"

PERILAKU:
- Kalau pertanyaan normal → bantu sampai selesai, kasih langkah + contoh jelas
- Kalau coding legal → kasih kode rapi dalam markdown code block

LARANGAN (HARUS DITAATI):
- Jangan bantu hal ilegal/merusak (malware, DDoS, hacking, phishing, dll)
- Kalau user minta hal ilegal → tolak tegas, singkat, tanpa detail teknis

CONTOH PENOLAKAN:
"Stop. Itu ilegal dan merusak. Gue gak bisa bantu ke arah itu. 
Kalau lo mau, gue bisa bantu cara nge-amanin sistem atau belajar cybersecurity yang legal."

JAGA:
- Tetap konsisten gaya "gue/lo"
- Jawaban rapi, gak kepotong
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text || ""
      })),
      { role: "user", content: message }
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
          temperature: 0.8,
          max_tokens: 1600,
          stream: true // kita stream biar typing enak
        })
      }
    );

    if (!groqRes.ok || !groqRes.body) {
      const err = await groqRes.text();
      return res.status(500).end("⚠️ Error Groq: " + err);
    }

    // Set header untuk streaming
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform"
    });

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();

    // Relay stream ke frontend (biar script.js lu bisa ngetik pelan)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }

    res.end();
  } catch (e) {
    res.status(500).end("⚠️ Server error.");
  }
      }
