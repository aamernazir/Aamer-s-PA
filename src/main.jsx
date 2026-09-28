import React from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";


// GitHub Pages is a static site. Keep the Anthropic key in this browser only;
// never commit it to the public repository.
const ANTHROPIC_KEY_STORAGE = "an-pa:anthropic-api-key";
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url.includes("api.anthropic.com/v1/messages")) return nativeFetch(input, init);

  let apiKey = localStorage.getItem(ANTHROPIC_KEY_STORAGE) || "";
  if (!apiKey) {
    apiKey = window.prompt(
      "To enable AI extraction on GitHub Pages, enter your Anthropic API key. It will be stored only in this browser."
    ) || "";
    apiKey = apiKey.trim();
    if (!apiKey) throw new Error("No Anthropic API key was provided.");
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, apiKey);
  }

  const headers = new Headers(init.headers || {});
  headers.set("x-api-key", apiKey);
  headers.set("anthropic-version", "2023-06-01");
  headers.set("anthropic-dangerous-direct-browser-access", "true");
  const requestInit = { ...init, headers };
  // The original artifact used 1,000 output tokens, which is too small for
  // a project proposal containing a team, budget, objectives, and work packages.
  if (typeof requestInit.body === "string") {
    try {
      const body = JSON.parse(requestInit.body);
      if (body && body.messages) {
        body.max_tokens = Math.max(Number(body.max_tokens) || 0, 3200);
        requestInit.body = JSON.stringify(body);
      }
    } catch (e) {
      // Leave non-JSON request bodies unchanged.
    }
  }
  const response = await nativeFetch(input, requestInit);
  if (response.status === 401) localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
  return response;
};

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
