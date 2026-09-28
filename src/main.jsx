import React from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";

// GitHub Pages is a static site. Keep the OpenAI key in this browser only;
// never commit it to the public repository. A server-side proxy is safer for
// a public deployment; this browser-only mode is intended for personal use.
const OPENAI_KEY_STORAGE = "an-pa:openai-api-key";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
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

function convertAnthropicContent(content) {
  if (typeof content === "string") return [{ type: "input_text", text: content }];
  if (!Array.isArray(content)) return [{ type: "input_text", text: "" }];

  return content.flatMap((block) => {
    if (typeof block === "string") return [{ type: "input_text", text: block }];
    if (block?.type === "text") return [{ type: "input_text", text: block.text || "" }];

    if (block?.type === "document" && block.source?.type === "base64") {
      const mediaType = block.source.media_type || "application/pdf";
      return [{
        type: "input_file",
        filename: mediaType === "application/pdf" ? "uploaded-document.pdf" : "uploaded-document",
        file_data: `data:${mediaType};base64,${block.source.data}`,
        detail: "high",
      }];
    }

    if (block?.type === "image" && block.source?.type === "base64") {
      const mediaType = block.source.media_type || "image/jpeg";
      return [{
        type: "input_image",
        image_url: `data:${mediaType};base64,${block.source.data}`,
        detail: "high",
      }];
    }

    return [];
  });
}

function convertAnthropicRequest(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const request = {
    model: "gpt-4.1",
    input: messages.map((message) => ({
      role: message.role || "user",
      content: convertAnthropicContent(message.content),
    })),
    max_output_tokens: Math.max(Number(body?.max_tokens) || 0, 3200),
  };

  const systemText = textFromAnthropicContent(body?.system);
  if (systemText) request.instructions = systemText;

  // The old UI uses Anthropic's web-search tool in a few research modules.
  // Preserve those requests as ordinary model prompts for now; PDF extraction
  // does not depend on a search tool and continues to work through GPT.
  return request;
}

function responsesText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  return (data?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((block) => block?.type === "output_text" || typeof block?.text === "string")
    .map((block) => block.text || "")
    .join("\n");
}

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url.includes("api.anthropic.com/v1/messages")) return nativeFetch(input, init);

  let apiKey = localStorage.getItem(OPENAI_KEY_STORAGE) || "";
  if (!apiKey) {
    apiKey = window.prompt(
      "To enable GPT extraction on GitHub Pages, enter your OpenAI API key. It will be stored only in this browser."
    ) || "";
    apiKey = apiKey.trim();
    if (!apiKey) throw new Error("No OpenAI API key was provided.");
    localStorage.setItem(OPENAI_KEY_STORAGE, apiKey);
  }

  let body = {};
  try {
    body = typeof init.body === "string" ? JSON.parse(init.body) : {};
  } catch (e) {
    throw new Error("The AI request could not be prepared.");
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", `Bearer ${apiKey}`);
  const response = await nativeFetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(convertAnthropicRequest(body)),
  });

  let result;
  try {
    result = await response.json();
  } catch (e) {
    throw new Error(`The OpenAI service returned an unreadable response (HTTP ${response.status}).`);
  }

  if (response.status === 401) localStorage.removeItem(OPENAI_KEY_STORAGE);
  if (!response.ok || result.error) {
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const compatibilityResult = {
    content: [{ type: "text", text: responsesText(result) }],
    stop_reason: result.status === "incomplete" ? "max_tokens" : "end_turn",
    usage: result.usage,
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
