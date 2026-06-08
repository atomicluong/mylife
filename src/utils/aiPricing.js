// ============================================================
// Danh sách model Gemini mới nhất — cập nhật tháng 6/2026
// Nguồn: https://ai.google.dev/pricing
// ============================================================
export const GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    desc: 'Mới nhất · Agentic · Thinking',
    inputPricePerMillion: 1.50,
    outputPricePerMillion: 9.00,
    contextWindow: '1M',
    supportsThinking: true
  },
  {
    id: 'gemini-3.1-pro',
    label: 'Gemini 3.1 Pro',
    desc: 'Flagship · Video & Audio · 2M context',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    contextWindow: '2M',
    supportsThinking: true
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    desc: 'Nhẹ nhất · Tiết kiệm nhất',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.50,
    contextWindow: '1M',
    supportsThinking: true
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3.5-flash';

export const USD_TO_VND_RATE = 25500;

export function getModelInfo(modelId) {
  return GEMINI_MODELS.find(m => m.id === modelId) || GEMINI_MODELS[0];
}

export function calculateAICost(modelId, inputTokens, outputTokens, currency = 'USD') {
  const model = getModelInfo(modelId);
  const inputCostUSD  = (inputTokens  / 1_000_000) * model.inputPricePerMillion;
  const outputCostUSD = (outputTokens / 1_000_000) * model.outputPricePerMillion;
  const totalCostUSD  = inputCostUSD + outputCostUSD;

  if (currency === 'VND') {
    return {
      inputCost:  inputCostUSD  * USD_TO_VND_RATE,
      outputCost: outputCostUSD * USD_TO_VND_RATE,
      totalCost:  totalCostUSD  * USD_TO_VND_RATE
    };
  }
  return { inputCost: inputCostUSD, outputCost: outputCostUSD, totalCost: totalCostUSD };
}
