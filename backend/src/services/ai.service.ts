import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface AiAnalysis {
  aiConfidence: number; // 0-100
  aiSummary: string;
  manipulationTechniques: {
    technique: string;
    quote: string;
    explanation: string;
  }[];
  recommendedAction: string;
}

/**
 * Sends email content and forensic context to Groq for deep semantic analysis.
 */
export const analyzeWithAI = async (
  emailBody: string,
  subject: string,
  forensicContext: any
): Promise<AiAnalysis | null> => {
  dotenv.config();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Service] GROQ_API_KEY not found in environment. Skipping LLM Analysis.');
    return null;
  }

  const groq = new Groq({ apiKey });

  const prompt = `
You are an elite Cybersecurity Incident Responder and Forensic Analyst. 
Analyze the following email and its technical forensic indicators to determine if it is a phishing, Business Email Compromise (BEC), or social engineering attack.

Email Subject: ${subject}
Email Body:
${emailBody.substring(0, 4000)} // Truncating to avoid token limits

Technical Forensic Context:
${JSON.stringify(forensicContext, null, 2)}

Your task is to analyze the semantic intent, psychological manipulation, and combined technical risks.
Return your analysis strictly in the following JSON format without markdown wrapping, markdown tags, or any other text.
{
  "aiConfidence": <number 0-100 indicating probability of malicious intent>,
  "aiSummary": "<1-2 paragraph professional SOC analyst summary of the threat vector and intent>",
  "manipulationTechniques": [
    {
      "technique": "<Name of technique, e.g., Urgency, CEO Fraud, Credential Harvesting>",
      "quote": "<Exact quote from the email body>",
      "explanation": "<Why this is malicious>"
    }
  ],
  "recommendedAction": "<Concise recommendation, e.g., Quarantine immediately, Safe to deliver>"
}
`;

  try {
    console.log('[AI Service] Calling Groq LLM (qwen/qwen3.8-27b)...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'qwen/qwen3.8-27b',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (responseContent) {
      const parsed = JSON.parse(responseContent) as AiAnalysis;
      console.log('[AI Service] Groq LLM analysis successful, confidence:', parsed.aiConfidence);
      return parsed;
    }
    return null;
  } catch (error: any) {
    console.error('[AI Service] Groq AI Analysis failed:', error.message || error);
    return null;
  }
};
