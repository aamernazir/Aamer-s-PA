const GK = "an-pa:gemini-api-key";
const RK = "an-pa:openrouter-api-key";
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

const textOf = (content) => typeof content === "string" ? content : Array.isArray(content)
  ? content.map((item) => item?.type === "text" ? item.text : item?.type === "tool_result" ? JSON.stringify(item.content || "") : typeof item === "string" ? item : "").filter(Boolean).join(" ")
  : "";

const parts = (content, openRouter) => {
  if (typeof content === "string") return openRouter ? [{ type: "text", text: content }] : [{ text: content }];
  return (Array.isArray(content) ? content : []).flatMap((item) => {
    if (item?.type === "text") return openRouter ? [{ type: "text", text: item.text || "" }] : [{ text: item.text || "" }];
    if (item?.type === "tool_result") return openRouter ? [{ type: "text", text: JSON.stringify(item.content || "") }] : [{ text: JSON.stringify(item.content || "") }];
    if (item?.source?.type !== "base64") return [];
    const mime = item.source.media_type || (item.type === "document" ? "application/pdf" : "image/jpeg");
    return openRouter
      ? item.type === "document" ? [{ type: "file", file: { filename: "upload.pdf", file_data: "data:" + mime + ";base64," + item.source.data } }] : [{ type: "image_url", image_url: { url: "data:" + mime + ";base64," + item.source.data } }]
      : [{ inline_data: { mime_type: mime, data: item.source.data } }];
  });
};

const geminiBody = (body) => {
  const request = {
    contents: (body.messages || []).map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: parts(message.content, false) })),
    generationConfig: { maxOutputTokens: Math.max(Number(body.max_tokens) || 0, 3200) },
  };
  const system = textOf(body.system);
  if (system) request.systemInstruction = { parts: [{ text: system }] };
  return request;
};

const openRouterBody = (body) => {
  const messages = (body.messages || []).map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: parts(message.content, true) }));
  const system = textOf(body.system);
  if (system) messages.unshift({ role: "system", content: system });
  return { model: "openrouter/free", messages, max_tokens: Math.max(Number(body.max_tokens) || 0, 3200), temperature: 0.1 };
};

const anthropicLikeResponse = (text) => new Response(JSON.stringify({ content: [{ type: "text", text }], stop_reason: "end_turn" }), { status: 200, headers: { "Content-Type": "application/json" } });

export function installAiFallback(nativeFetch) {
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.includes("api.anthropic.com/v1/messages")) return nativeFetch(input, init);

    const body = JSON.parse(init.body || "{}");
    let geminiKey = localStorage.getItem(GK);
    if (!geminiKey) {
      geminiKey = prompt("Enter your Google AI Studio API key. It stays only in this browser.");
      if (!geminiKey) throw new Error("No Gemini API key was provided.");
      localStorage.setItem(GK, geminiKey);
    }

    const errors = [];
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await nativeFetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(geminiKey), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiBody(body)) });
          const result = await response.json();
          const answer = (result.candidates || []).flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join(" ");
          if (!response.ok || result.error) throw new Error(result.error?.message || ("HTTP " + response.status));
          if (answer.trim()) return anthropicLikeResponse(answer);
        } catch (error) {
          errors.push("Gemini " + model + ": " + error.message);
          if (!attempt) await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }

    // OpenRouter is optional and configured once. Never interrupt normal use
    // with a fallback-key popup just because Gemini is temporarily unavailable.
    const openRouterKey = localStorage.getItem(RK);
    if (openRouterKey) {
      try {
        const response = await nativeFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + openRouterKey }, body: JSON.stringify(openRouterBody(body)) });
        const result = await response.json();
        const answer = result.choices?.[0]?.message?.content;
        if (!response.ok || result.error) throw new Error(result.error?.message || ("HTTP " + response.status));
        if (answer?.trim()) return anthropicLikeResponse(answer);
      } catch (error) { errors.push("OpenRouter: " + error.message); }
    }

    throw new Error("Nyx AI is temporarily unavailable. Gemini did not respond successfully. Please try again shortly. Technical details: " + errors.join("; "));
  };
}
