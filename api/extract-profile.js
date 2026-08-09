import { extractProfileFromTranscript } from "../src/server/extractProfile.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { transcript } = req.body || {};
    const profile = await extractProfileFromTranscript(transcript, process.env.ANTHROPIC_API_KEY);
    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message || "Extraction failed." });
  }
}
