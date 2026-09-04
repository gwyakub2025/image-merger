import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required. Please configure your API key in Settings > Secrets.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const PRIMARY_MODEL = 'gemini-3.1-flash-image-preview';
const FALLBACK_MODEL = 'gemini-3.1-flash-image';
const BACKUP_MODEL = 'gemini-3.1-flash-lite-image';

async function generateImageWithFallback(prompt: string, aspectRatio: string = '1:1') {
  const ai = getGeminiClient();
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, BACKUP_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageBase64: string | null = null;
      let mimeType = 'image/png';
      let textOutput = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data;
            if (part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
          } else if (part.text) {
            textOutput += part.text;
          }
        }
      }

      if (imageBase64) {
        return {
          modelUsed: model,
          dataUrl: `data:${mimeType};base64,${imageBase64}`,
          text: textOutput,
        };
      }
      throw new Error(`Model ${model} completed but returned no image data part.`);
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate image with Gemini image models.');
}

async function editImageWithFallback(prompt: string, rawBase64: string, mimeType: string = 'image/png') {
  const ai = getGeminiClient();
  const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const cleanMime = mimeType.replace(/^data:/, '').split(';')[0] || 'image/png';
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, BACKUP_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Attempting image edit with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: cleanMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let imageBase64: string | null = null;
      let outputMime = 'image/png';
      let textOutput = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data;
            if (part.inlineData.mimeType) {
              outputMime = part.inlineData.mimeType;
            }
          } else if (part.text) {
            textOutput += part.text;
          }
        }
      }

      if (imageBase64) {
        return {
          modelUsed: model,
          dataUrl: `data:${outputMime};base64,${imageBase64}`,
          text: textOutput,
        };
      }
      throw new Error(`Model ${model} completed edit but returned no image data part.`);
    } catch (err: any) {
      console.warn(`[Gemini API] Edit failed with model ${model}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to edit image with Gemini image models.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser with generous limit for image base64 data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      models: {
        primary: PRIMARY_MODEL,
        fallback: FALLBACK_MODEL,
        backup: BACKUP_MODEL,
      },
    });
  });

  // POST /api/gemini/create-image
  app.post('/api/gemini/create-image', async (req, res) => {
    try {
      const { prompt, aspectRatio = '1:1' } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'A non-empty prompt string is required.' });
        return;
      }

      const result = await generateImageWithFallback(prompt.trim(), aspectRatio);
      res.json({
        success: true,
        dataUrl: result.dataUrl,
        modelUsed: result.modelUsed,
        text: result.text,
      });
    } catch (error: any) {
      console.error('[API /api/gemini/create-image error]:', error);
      res.status(500).json({
        error: error?.message || 'Internal server error while generating image with Gemini.',
      });
    }
  });

  // POST /api/gemini/edit-image
  app.post('/api/gemini/edit-image', async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType = 'image/png' } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'A non-empty prompt string is required.' });
        return;
      }
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Image base64 data is required for image editing.' });
        return;
      }

      const result = await editImageWithFallback(prompt.trim(), imageBase64, mimeType);
      res.json({
        success: true,
        dataUrl: result.dataUrl,
        modelUsed: result.modelUsed,
        text: result.text,
      });
    } catch (error: any) {
      console.error('[API /api/gemini/edit-image error]:', error);
      res.status(500).json({
        error: error?.message || 'Internal server error while editing image with Gemini.',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bulk Image Batcher server listening on port ${PORT}`);
  });
}

startServer();
