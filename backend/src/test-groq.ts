import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('GROQ_API_KEY available:', !!process.env.GROQ_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

async function test() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello world' }],
      model: 'qwen/qwen3.8-27b',
    });
    console.log('Success:', chatCompletion.choices[0]?.message?.content);
  } catch (err: any) {
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    if (err.status) console.error('Status:', err.status);
    if (err.error) console.error('Details:', err.error);
  }
}

test();
