export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return res.status(503).json({error:'AI processing is not configured. Add OPENAI_API_KEY to Vercel environment variables.'});
 try{
  const {image,document='eid',blazer='navy',background='white',formal=true,autoAlign=true}=req.body||{};
  if(typeof image!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(image))return res.status(400).json({error:'Upload a PNG, JPG, or WEBP portrait.'});
  const bytes=Buffer.from(image.split(',')[1],'base64');
  if(bytes.length>3*1024*1024)return res.status(413).json({error:'Photo exceeds the 3 MB API limit. Please compress the original photo.'});
  const type=image.match(/^data:(image\/[^;]+)/)[1];
  const form=new FormData();
  form.append('model','gpt-image-1');
  form.append('size','1024x1536');
  form.append('quality','high');
  form.append('image',new Blob([bytes],{type}),'portrait.'+(type==='image/png'?'png':type==='image/webp'?'webp':'jpg'));
  form.append('prompt',`Edit the supplied portrait into a realistic professional studio headshot for a ${document==='eid'?'UAE Emirates ID-style':'visa-style'} portrait. Preserve facial identity, proportions, skin tone, age, hairstyle, expression and natural skin texture. ${autoAlign?'Center the face, straight frontal orientation, eyes visible, head and shoulders, with even lighting.':'Maintain the original pose and framing.'} ${background==='white'?'Use a pure uniform white background (#FFFFFF).':''} ${formal?`Dress the subject in a tailored ${blazer==='navy'?'navy blue':blazer==='black'?'black':'charcoal gray'} blazer, crisp white shirt and conservative dark tie.`:'Keep the original clothing.'} Photorealistic, no identifying feature alterations, no text, no watermark. Portrait orientation.`);
  const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form});
  const payload=await response.json();
  if(!response.ok)return res.status(response.status).json({error:payload?.error?.message||'AI image processing failed.'});
  const b64=payload?.data?.[0]?.b64_json;
  if(!b64)return res.status(502).json({error:'AI provider returned no image.'});
  return res.status(200).json({image:`data:image/png;base64,${b64}`});
 }catch(e){return res.status(500).json({error:e?.message||'Unexpected processing error.'});}
}