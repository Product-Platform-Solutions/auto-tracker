import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function enrichWithGroq(
  branch: string,
  commit: string,
  author: string,
  ruleBasedResult: any
): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('Groq API key not set — using rule-based enrichment only');
    return ruleBasedResult;
  }

  try {
    const prompt = `You are a software project manager. Generate a concise GitHub issue based on this git branch:

Branch: ${branch}
Commit: ${commit}
Author: ${author}
Rule-based title: ${ruleBasedResult.title}
Type: ${ruleBasedResult.type}

Respond in JSON format only:
{
  "title": "clear, concise issue title",
  "description": "2-3 sentence description of what this change does",
  "acceptanceCriteria": ["criterion 1", "criterion 2", "criterion 3"]
}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: process.env.GROQ_MODEL || 'llama-3.2-11b-text-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...ruleBasedResult,
      title: parsed.title || ruleBasedResult.title,
      description: parsed.description || ruleBasedResult.description,
      acceptanceCriteria: parsed.acceptanceCriteria || ruleBasedResult.acceptanceCriteria
    };
  } catch (error) {
    console.log('Groq enrichment failed — falling back to rule-based', error);
    return ruleBasedResult;
  }
}
