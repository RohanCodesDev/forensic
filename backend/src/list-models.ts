import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

async function listModels() {
  try {
    const models = await groq.models.list();
    console.log("Available models:");
    models.data.forEach((m) => {
      console.log(`- ${m.id}`);
    });
  } catch (err: any) {
    console.error('Failed to fetch models:', err.message);
  }
}

listModels();
