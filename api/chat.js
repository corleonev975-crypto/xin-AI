export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const {message,history=[]}=req.body;
    const apiKey=process.env.GROQ_API_KEY;
    if(!apiKey)return res.status(500).json({error:"GROQ_API_KEY belum diisi"});

    const messages=[
      {role:"system",content:"Kamu adalah Xinn AI seperti ChatGPT. Jawab bahasa Indonesia natural, rapi, jelas. Jika coding, gunakan markdown code block html/css/javascript/python valid."},
      ...history.map(c=>({role:c.role==="ai"?"assistant":"user",content:c.text})),
      {role:"user",content:message}
    ];

    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:"llama-3.3-70b-versatile",messages,temperature:.5,max_tokens:1200,stream:true})
    });

    if(!r.ok)return res.status(r.status).send(await r.text());
    res.writeHead(200,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-cache"});

    const reader=r.body.getReader(),decoder=new TextDecoder();
    while(true){
      const {done,value}=await reader.read();if(done)break;
      const lines=decoder.decode(value,{stream:true}).split("\n");
      for(const line of lines){
        if(!line.startsWith("data:"))continue;
        const data=line.replace("data:","").trim();
        if(!data||data==="[DONE]")continue;
        try{const j=JSON.parse(data);const t=j.choices?.[0]?.delta?.content||"";if(t)res.write(t)}catch{}
      }
    }
    res.end();
  }catch{res.status(500).json({error:"Server error"})}
      }
