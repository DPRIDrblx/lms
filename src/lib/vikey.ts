// src/lib/vikey.ts

export interface VikeyMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VikeyChatOptions {
  messages: VikeyMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export function getVikeyApiKey(): string {
  return process.env.VIKEY_API_KEY || process.env.GEMINI_API_KEY || '';
}

export function getVikeyModel(): string {
  return process.env.VIKEY_MODEL || 'deepseek/deepseek-v4.1-flash';
}

export function getVikeyBaseUrl(): string {
  return process.env.VIKEY_BASE_URL || 'https://api.vikey.ai/v1';
}

/**
 * Sends a chat completion request to Vikey AI (OpenAI-compatible endpoint).
 */
export async function askVikey({
  messages,
  model,
  temperature = 0.7,
  max_tokens,
  response_format,
}: VikeyChatOptions): Promise<string> {
  const apiKey = getVikeyApiKey();
  if (!apiKey) {
    throw new Error('VIKEY_API_KEY is not configured in .env.local');
  }

  const selectedModel = model || getVikeyModel();
  const baseUrl = getVikeyBaseUrl();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      temperature,
      ...(max_tokens ? { max_tokens } : {}),
      ...(response_format ? { response_format } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Vikey API error (${response.status}): ${errorText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // keep raw errorText
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return content;
}

/**
 * Utility to parse JSON response from LLM cleanly (removes markdown backticks).
 */
export function parseAiJsonResponse<T = any>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip markdown codeblocks
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  
  // If there's surrounding text before/after JSON object or array, extract it
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }

  return JSON.parse(cleaned);
}
