import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// Web Worker 内で WebLLM エンジンハンドラーを起動
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
  handler.onmessage(msg);
};
