export const OPENAI_CONFIG_KEY = "sikola_openai_config";

export interface OpenAIConfig {
  apiKey: string;
  systemPrompt: string;
  model: string;
}

export const getOpenAIConfig = (): OpenAIConfig | null => {
  const saved = localStorage.getItem(OPENAI_CONFIG_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const saveOpenAIConfig = (config: OpenAIConfig) => {
  localStorage.setItem(OPENAI_CONFIG_KEY, JSON.stringify(config));
};

export const generateLessonContent = async (topicTitle: string, config: OpenAIConfig) => {
  if (!config.apiKey) throw new Error("API Key is missing. Please set it in AI Settings.");

  const prompt = `Topic: ${topicTitle}
Generate a comprehensive lesson for this topic. Return the data ONLY as a valid JSON object with this structure:
{
  "title": "Topic Name",
  "intro": "Short lesson goal",
  "coreContent": "Detailed explanation using markdown",
  "examples": [
    {"title": "Example 1", "problem": "...", "solution": "...", "keyTakeaway": "..."}
  ],
  "questions": [
    {"question": "...", "answers": ["A", "B", "C", "D"], "correctAnswerIndex": 0}
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to fetch from OpenAI");
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
};
