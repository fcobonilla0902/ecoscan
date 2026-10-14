// Servidor de EcoScan: recibe una foto de la app y le pregunta a una IA de visión
// qué residuo es y cómo reciclarlo. La clave de la API vive SOLO aquí, nunca en la app.
//
// Uso (gratis):  GEMINI_API_KEY=tu-clave node server/index.js
const http = require('node:http');

const PORT = process.env.PORT || 3000;
// Proveedor de IA. Por defecto GRATIS con Gemini (plan gratuito de Google AI Studio).
// Si solo defines ANTHROPIC_API_KEY, usa Claude (de pago).
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = process.env.PROVIDER || (GEMINI_KEY ? 'gemini' : ANTHROPIC_KEY ? 'anthropic' : 'gemini');
const MODEL =
  process.env.AI_MODEL ||
  (PROVIDER === 'gemini' ? 'gemini-3.5-flash-lite' : 'claude-haiku-5-5');
const HAS_KEY = PROVIDER === 'gemini' ? Boolean(GEMINI_KEY) : Boolean(ANTHROPIC_KEY);
const CATEGORIES = ['plastico', 'papel', 'vidrio', 'metal', 'organico', 'otro'];

const SYSTEM = `Eres el motor de identificación de residuos de la app EcoScan (México/Latinoamérica).
Recibes una foto de un objeto que una persona quiere desechar. Identifica el objeto principal y di cómo desecharlo.
Responde SOLO con un objeto JSON válido, sin texto extra ni markdown, con esta forma exacta:
{
  "found": true,
  "name": "nombre corto del objeto en español",
  "category": "plastico" | "papel" | "vidrio" | "metal" | "organico" | "otro",
  "recyclable": true | false,
  "instructions": "1-2 frases: cómo prepararlo y desecharlo",
  "tip": "1 frase con un dato útil o consejo",
  "confidence": número entre 0 y 1
}
Reglas:
- "otro" es para residuos especiales (pilas, electrónicos, focos, medicinas, unicel, aceite) o mezclas difíciles.
- Envases multicapa tipo Tetra Pak van en "papel" y recyclable true, indicando que no todos los centros los reciben.
- Si no hay un objeto claro o la foto está borrosa, responde {"found": false, "message": "motivo breve"}.
- Sé honesto con "confidence": baja si dudas del material.`;

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Imagen demasiado grande'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Respuesta sin JSON');
  return JSON.parse(text.slice(start, end + 1));
}

function normalize(r) {
  if (!r || r.found === false) {
    return { found: false, message: (r && r.message) || 'No pude identificar el objeto. Intenta con otra foto.' };
  }
  const category = CATEGORIES.includes(r.category) ? r.category : 'otro';
  return {
    found: true,
    name: String(r.name || 'Objeto').slice(0, 80),
    category,
    recyclable: Boolean(r.recyclable),
    instructions: String(r.instructions || 'Consulta el centro de acopio más cercano.').slice(0, 400),
    tip: String(r.tip || 'Separar bien tus residuos ayuda a que sí se reciclen.').slice(0, 300),
    confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0.5)),
  };
}

const USER_PROMPT = '¿Qué residuo es y cómo lo desecho? Responde solo con el JSON.';

function apiError(res, data) {
  const msg = data?.error?.message || `Error ${res.status} del proveedor de IA`;
  if (res.status === 429) {
    return Object.assign(new Error('Se alcanzó el límite gratuito de la IA. Espera un minuto e inténtalo de nuevo.'), { status: 429 });
  }
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    return Object.assign(new Error(`La clave o el modelo no son válidos: ${msg}`), { status: 500 });
  }
  return Object.assign(new Error(msg), { status: 502 });
}

async function classifyGemini(imageBase64, mediaType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': GEMINI_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: 'user',
          parts: [{ inline_data: { mime_type: mediaType, data: imageBase64 } }, { text: USER_PROMPT }],
        },
      ],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 600 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw apiError(res, data);
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw Object.assign(new Error('La IA no devolvió respuesta (puede que la foto fuera bloqueada).'), { status: 502 });
  return normalize(extractJson(text));
}

async function classifyAnthropic(imageBase64, mediaType) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw apiError(res, data);
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return normalize(extractJson(text));
}

const classify = (img, type) => (PROVIDER === 'gemini' ? classifyGemini(img, type) : classifyAnthropic(img, type));

const server = http.createServer(async (req, res) => {
  const send = (status, obj) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return send(200, { ok: true, provider: PROVIDER, model: MODEL, hasKey: HAS_KEY });
    }
    if (req.method === 'POST' && req.url === '/identify') {
      if (!HAS_KEY) {
        return send(500, { error: `Falta la clave de la IA en el servidor (${PROVIDER === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'}). Ver README.` });
      }
      const body = JSON.parse(await readBody(req));
      if (!body.image) return send(400, { error: 'Falta la imagen' });
      const mediaType = ['image/jpeg', 'image/png', 'image/webp'].includes(body.mediaType) ? body.mediaType : 'image/jpeg';
      const result = await classify(body.image, mediaType);
      console.log(new Date().toLocaleTimeString(), '→', result.found ? `${result.name} (${result.category}, ${Math.round(result.confidence * 100)}%)` : 'no identificado');
      return send(200, result);
    }
    send(404, { error: 'No encontrado' });
  } catch (e) {
    console.error('Error:', e.message);
    send(e.status || 500, { error: e.message || 'Error interno' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`EcoScan server en http://0.0.0.0:${PORT}  (IA: ${PROVIDER} / ${MODEL})`);
  if (!HAS_KEY) console.warn('⚠️  Falta la clave de la IA (GEMINI_API_KEY): /identify no funcionará.');
});

module.exports = { normalize, extractJson };
