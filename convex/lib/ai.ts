import OpenAI from 'openai';

export const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

export const model = process.env.AI_MODEL_NAME || 'gpt-5-mini';