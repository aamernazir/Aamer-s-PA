import React from "react";
import { createRoot } from "react-dom/client";
import App from "../an-personal-assistant.jsx";

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
