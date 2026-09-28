import React from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";

// GitHub Pages is a static site. Keep the Gemini key in this browser only;
// never commit it to the public repository. A server-side proxy is safer for
// a public deployment; this browser-only mode is intended for personal use.
const GEMINI_KEY_STORAGE = "an-pa:gemini-api-key";
const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const nativeFetch = window.fetch.bind(window);

function textFromAnthropicContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (typeof block === "string") return block;
      if (block?.type === "text") return block.text || "";
      if (block?.type === "tool_result") return JSON.stringify(block.content || "");
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function convertGeminiContent(content) {
  if (typeof content === "string") return [{ text: content }];
  if (!Array.isArray(content)) return [{ text: "" }];

  return content.flatMap((block) => {
    if (typeof block === "string") return [{ text: block }];
    if (block?.type === "text") return [{ text: block.text || "" }];
    if (block?.type === "tool_result") {
      return [{ text: JSON.stringify(block.content || "") }];
    }

    if (block?.type === "document" && block.source?.type === "base64") {
      const mediaType = block.source.media_type || "application/pdf";
      return [{
        inline_data: {
          mime_type: mediaType,
          data: block.source.data,
        },
      }];
    }

    if (block?.type === "image" && block.source?.type === "base64") {
      const mediaType = block.source.media_type || "image/jpeg";
      return [{
        inline_data: {
          mime_type: mediaType,
          data: block.source.data,
        },
      }];
    }

    return [];
  });
}

function convertGeminiRequest(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const request = {
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: convertGeminiContent(message.content),
    })),
    generationConfig: {
      maxOutputTokens: Math.max(Number(body?.max_tokens) || 0, 3200),
    },
  };

  const systemText = textFromAnthropicContent(body?.system);
  if (systemText) request.systemInstruction = { parts: [{ text: systemText }] };

  // The old UI uses Anthropic's web-search tool in a few research modules.
  // Preserve those requests as ordinary model prompts for now; PDF extraction
  // does not depend on a search tool and continues to work through Gemini.
  return request;
}

function geminiText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .filter((part) => typeof part?.text === "string")
    .map((part) => part.text)
    .join("\n");
}

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url.includes("api.anthropic.com/v1/messages")) return nativeFetch(input, init);

  let apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  if (!apiKey) {
    apiKey = window.prompt(
      "To enable Gemini extraction on GitHub Pages, enter your Google AI Studio API key. It will be stored only in this browser."
    ) || "";
    apiKey = apiKey.trim();
    if (!apiKey) throw new Error("No Gemini API key was provided.");
    localStorage.setItem(GEMINI_KEY_STORAGE, apiKey);
  }

  let body = {};
  try {
    body = typeof init.body === "string" ? JSON.parse(init.body) : {};
  } catch (e) {
    throw new Error("The AI request could not be prepared.");
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("x-goog-api-key", apiKey);
  let response;
  try {
    response = await nativeFetch(GEMINI_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(convertGeminiRequest(body)),
    });
  } catch (error) {
    const message = error?.message || "The browser could not connect to Gemini.";
    window.alert(`Gemini connection failed: ${message}`);
    throw new Error(`Gemini connection failed: ${message}`);
  }

  let result;
  try {
    result = await response.json();
  } catch (e) {
    throw new Error(`The Gemini service returned an unreadable response (HTTP ${response.status}).`);
  }

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
  if (!response.ok || result.error) {
    const message = result.error?.message || result.error?.code || `HTTP ${response.status}`;
    window.alert(`Gemini request failed (${response.status}): ${message}`);
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const compatibilityResult = {
    content: [{ type: "text", text: geminiText(result) }],
    stop_reason: result.candidates?.[0]?.finishReason === "MAX_TOKENS" ? "max_tokens" : "end_turn",
    usage: result.usageMetadata,
  };
  return new Response(JSON.stringify(compatibilityResult), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};

// Claude's preview environment provides window.storage. This browser shim
// keeps the same async API while storing data locally for GitHub Pages.
if (!window.storage) {
  const prefix = "an-pa:";
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(prefix + key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      localStorage.setItem(prefix + key, value);
      return { value };
    },
    async delete(key) {
      localStorage.removeItem(prefix + key);
      return true;
    },
    async list(prefixKey = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || "";
        if (key.startsWith(prefix + prefixKey)) keys.push(key.slice(prefix.length));
      }
      return { keys };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
