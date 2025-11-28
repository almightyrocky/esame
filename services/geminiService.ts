import { Attachment, Message } from '../types';

const MODEL_ID = 'gemini-1.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const SAMPLE_RATE = 24000;

interface AgentRequest {
  text: string;
  files: File[];
  history: Message[];
}

const getApiKey = (): string => {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') ||
    ''
  );
};

const summarizeFiles = (files: File[]): string => {
  if (!files.length) return '';
  return files
    .map((file) => `${file.type || 'file'} (${Math.round(file.size / 1024)}KB)`)
    .join(', ');
};

const buildPrompt = (text: string, files: File[]): string => {
  const attachmentsSummary = summarizeFiles(files);
  return `Agisci come un tecnico senior che coordina un gemello digitale domestico.

Richiesta utente:
${text}

Media caricati: ${attachmentsSummary || 'Nessuno'}.

Rispondi SEMPRE in italiano, seguendo con precisione questo formato:

### 1. Diagnosi
- ...

### 2. Azioni Immediate
- ...

### 3. Soluzione
Descrivi la soluzione e fornisci JSON valido nel seguente schema:
\`\`\`json
{
  "partners": [
    {
      "name": "Nome partner",
      "details": ["vantaggio 1", "vantaggio 2"],
      "phone": "+39020000000",
      "url": "https://..."
    }
  ],
  "web": [
    { "name": "Risorsa", "details": ["nota"], "url": "https://..." }
  ]
}
\`\`\`

### 4. Prevenzione
- ...

Chiudi con **Fonti Web Consultate:** se citi link.`;
};

const buildHistoryParts = (history: Message[]) =>
  history.slice(-6).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text: `${msg.role === 'user' ? 'Utente' : 'Twin'}: ${msg.text}`
      }
    ]
  }));

const fallbackReport = (text: string): string => {
  const sanitized = text.trim() || 'il segnale ricevuto';
  return `### 1. Diagnosi
- Il gemello rileva anomalie coerenti con **${sanitized}**. Sensoristica incrociata indica squilibrio termico e possibile attrito meccanico.

### 2. Azioni Immediate
- Metti in **stand-by** l'elettrodomestico e scollega l'alimentazione se noti odore di bruciato.
- Scatta una foto dettagliata dell'area calda o rumorosa per l'analisi successiva.

### 3. Soluzione
{
  "partners": [
    {
      "name": "HydraFix 24/7",
      "details": [
        "Tecnico certificato ARISTON · SLA 4h",
        "Diagnostica AI e parti di ricambio originali"
      ],
      "phone": "+39 02 1234 5678"
    }
  ],
  "web": [
    {
      "name": "Guida manutenzione caldaia",
      "details": [
        "Pulizia scambiatore e spurgo aria circuito"
      ],
      "url": "https://www.ariston.com/it-it/supporto"
    }
  ]
}

### 4. Prevenzione
- Programma un ciclo di spurgo e riequilibrio ogni 6 mesi.
- Mantieni i sensori IAQ liberi da polvere e aggiorna il firmware del sistema.`;
};

export const runHomeAgent = async ({ text, files, history }: AgentRequest): Promise<string> => {
  const apiKey = getApiKey();
  const prompt = buildPrompt(text, files);

  if (!apiKey) {
    return fallbackReport(text);
  }

  try {
    const response = await fetch(`${API_BASE}/${MODEL_ID}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          ...buildHistoryParts(history),
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          topK: 32
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini error', await response.text());
      return fallbackReport(text);
    }

    const data = await response.json();
    const generated =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('\n')
        .trim() ?? '';

    return generated || fallbackReport(text);
  } catch (error) {
    console.error('Gemini request failed', error);
    return fallbackReport(text);
  }
};

const encodePcm16ToBase64 = (data: Int16Array): string => {
  const bytes = new Uint8Array(data.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
};

export const generateSimulatedCall = async (techName: string, context: string): Promise<string | null> => {
  try {
    const seconds = 2.5;
    const totalSamples = Math.floor(SAMPLE_RATE * seconds);
    const samples = new Int16Array(totalSamples);
    const carrier = 210;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.min(1, t / 0.2) * Math.max(0, 1 - (t - 1.5) * 0.7);
      samples[i] = Math.floor(Math.sin(2 * Math.PI * carrier * t) * 0.2 * envelope * 32767);
    }
    return encodePcm16ToBase64(samples);
  } catch (error) {
    console.error('Audio synthesis failed', error);
    return null;
  }
};

