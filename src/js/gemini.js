/**
 * Gemini API クライアント (BYOK & レートリミット・安全ガードレール付き)
 * 
 * 🔒 セキュリティポリシー:
 * 1. APIキーはブラウザの localStorage ('gemini_user_api_key') にのみ保持。
 * 2. サーバーや外部へのキー送信は一切行わず、Google の公式エンドポイントへのみ送信。
 * 3. クライアント側レートリミット（最大3回/分）と入力文字数制限（最大25,000字）で不当課金・悪用を防止。
 */

const STORAGE_KEY = 'gemini_user_api_key';
const MAX_REQUESTS_PER_MINUTE = 3;
const MAX_INPUT_CHARS = 25000;

export const GEMINI_MODELS = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash (Fast · Free Tier Recommended)',
    desc: 'Google AI Studio 無料枠対応・高速要約'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Next-Gen · High Quality)',
    desc: '次世代マルチモーダル・高品質要約'
  }
];

class GeminiService {
  constructor() {
    this.requestTimestamps = [];
  }

  getApiKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  setApiKey(key) {
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  clearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
  }

  hasApiKey() {
    return Boolean(this.getApiKey());
  }

  /**
   * レートリミット検証 (1分間に最大3回)
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > oneMinuteAgo);

    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
      const oldest = this.requestTimestamps[0];
      const waitSeconds = Math.ceil((oldest + 60 * 1000 - now) / 1000);
      throw new Error(`Rate limit exceeded for cost protection. Please wait ${waitSeconds}s before next request.`);
    }
  }

  recordRequest() {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Gemini API によるストリーミング要約生成
   * @param {Object} params
   * @param {string} params.model
   * @param {string} params.systemInstruction
   * @param {string} params.prompt
   * @param {function} onChunk (textChunk) => void
   * @returns {Promise<string>} Full response text
   */
  async generateSummaryStream({ model = 'gemini-1.5-flash', systemInstruction = '', prompt = '' }, onChunk = () => {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API Key is not set. Please configure your API key above.');
    }

    this.checkRateLimit();

    // 入力長の安全ガード
    const sanitizedPrompt = prompt.slice(0, MAX_INPUT_CHARS);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: sanitizedPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    this.recordRequest();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || response.statusText;
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(`Gemini API error (${response.status}): ${errorDetail}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace(/^data:\s*/, '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            const candidate = data.candidates?.[0];
            const partText = candidate?.content?.parts?.[0]?.text || '';
            if (partText) {
              fullText += partText;
              onChunk(partText, fullText);
            }
          } catch (e) {
            // パースエラーは無視して継続
          }
        }
      }
    }

    return fullText;
  }
}

export const geminiService = new GeminiService();
