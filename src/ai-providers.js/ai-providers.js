const GK = "an-pa:gemini-api-key";
const RK = "an-pa:openrouter-api-key";
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
let modelCache = { expires: 0, models: [] };
async function discoverModels(nativeFetch, key) {
  if (modelCache.expires > Date.now() && modelCache.models.length) return modelCache.models;
  try {
    let pageToken = "";
    const names = [];
    for (let page = 0; page < 2; page += 1) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=" + encodeURIComponent(key) + (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
      const response = await nativeFetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) break;
      const json = await response.json();
      for (const model of json.models || []) {
        if ((model.supportedGenerationMethods || []).includes("generateContent") && /^models\/gemini-/i.test(model.name || "")) names.push(model.name.replace(/^models\//, ""));
      }
      pageToken = json.nextPageToken || "";
      if (!pageToken) break;
    }
    const score = (name) => {
      const version = [...name.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))[0] || 0;
      const lite = /flash-lite/i.test(name);
      const flash = /flash/i.test(name);
      return (lite ? 1000 : flash ? 500 : 0) + version * 10 - (/preview|exp/i.test(name) ? 5 : 0);
    };
    const candidates = names.filter((name) => /flash/i.test(name) && !/tts|image|audio|live|native|robotics/i.test(name)).sort((a, b) => score(b) - score(a));
    const ordered = [...new Set([...candidates, ...FALLBACK_MODELS])];
    modelCache = { models: ordered, expires: Date.now() + 6 * 60 * 60 * 1000 };
    return ordered;
  } catch {
    return FALLBACK_MODELS;
  }
}


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
    const needsWebSearch = Array.isArray(body.tools) && body.tools.some((tool) => String(tool?.type || "").includes("web_search"));
    let geminiKey = localStorage.getItem(GK);
    if (!geminiKey) {
      geminiKey = prompt("Enter your Google AI Studio API key. It stays only in this browser.");
      if (!geminiKey) throw new Error("No Gemini API key was provided.");
      localStorage.setItem(GK, geminiKey);
    }

    const errors = [];
    if (needsWebSearch) return nativeFetch(input, init);
    const models = await discoverModels(nativeFetch, geminiKey);
    // One fast model and one distinct fallback keep an unavailable model from
    // holding the upload spinner through every model returned by discovery.
    const selectedModels = init.signal ? [...new Set([models.find((name) => /flash-lite/i.test(name)), models.find((name) => /flash(?!-lite)/i.test(name)), models[0]].filter(Boolean))].slice(0, 2) : models;
    for (const model of selectedModels) {
      if (init.signal?.aborted) throw new Error("AI processing exceeded two minutes. Please retry the file.");
      try {
        const response = await nativeFetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(geminiKey), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiBody(body)), signal: init.signal,
        });
        const result = await response.json();
        const answer = (result.candidates || []).flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join(" ");
        if (response.ok && !result.error && answer.trim()) {
          modelCache.models = [model, ...models.filter((name) => name !== model)];
          return anthropicLikeResponse(answer);
        }
        const reason = result.error?.message || "HTTP " + response.status;
        errors.push(model + ": " + String(reason).slice(0, 140));
        if (response.status === 429) break;
        if (response.status === 401 || response.status === 403) break;
        if (response.status >= 500) await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (error) { if (init.signal?.aborted) throw new Error("AI processing exceeded two minutes. Please retry the file."); errors.push(model + ": " + String(error.message).slice(0, 140)); }
    }

    // OpenRouter is optional and configured once. Never interrupt normal use
    // with a fallback-key popup just because Gemini is temporarily unavailable.
    const openRouterKey = localStorage.getItem(RK);
    if (openRouterKey) {
      try {
        const response = await nativeFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + openRouterKey }, body: JSON.stringify(openRouterBody(body)), signal: init.signal });
        const result = await response.json();
        const answer = result.choices?.[0]?.message?.content;
        if (!response.ok || result.error) throw new Error(result.error?.message || ("HTTP " + response.status));
        if (answer?.trim()) return anthropicLikeResponse(answer);
      } catch (error) { if (init.signal?.aborted) throw new Error("AI processing exceeded two minutes. Please retry the file."); errors.push("OpenRouter: " + error.message); }
    }

    throw new Error("Nyx AI could not process this item. Check the Gemini API key, model access, or quota, then retry. " + (errors[0] || "No available model").slice(0, 170));
  };
}
