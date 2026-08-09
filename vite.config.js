import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import "dotenv/config";
import { extractProfileFromTranscript } from "./src/server/extractProfile.js";

// Mirrors api/extract-profile.js so `npm run dev` behaves the same as the
// deployed Vercel serverless function, without needing the Vercel CLI locally.
function extractProfileDevMiddleware() {
  return {
    name: "dev-api-extract-profile",
    configureServer(server) {
      server.middlewares.use("/api/extract-profile", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", async () => {
          try {
            const { transcript } = JSON.parse(body || "{}");
            const profile = await extractProfileFromTranscript(transcript, process.env.ANTHROPIC_API_KEY);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ profile }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Extraction failed." }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), extractProfileDevMiddleware()]
});
