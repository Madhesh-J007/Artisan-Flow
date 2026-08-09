// Shared logic for the Profile Extraction Agent: takes a transcript of what
// an artisan said (in English, or English translation of Tamil speech) and
// returns a structured artisan profile via the Claude API.
//
// Used by both:
//   - api/extract-profile.js       (Vercel serverless function, production)
//   - vite.config.js dev middleware (local `npm run dev`, same behavior)
//
// The API key never reaches the browser — this file only ever runs server-side.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // fast + cheap, plenty for structured extraction

const SYSTEM_PROMPT = `You are a data extraction assistant for a rural artisan platform in Tamil Nadu, India.
You will receive a transcript of an artisan describing their craft business. It may be in Tamil script, English, or a mix of both — read and understand it directly regardless of language, you do not need it pre-translated.

Extract structured profile fields. Respond with ONLY a raw JSON object — no markdown fences, no preamble, no explanation — matching exactly this shape:

{
  "craft": string,               // short lowercase label, e.g. "pottery", "weaving", "bamboo craft" — infer the closest sensible label even if not stated in those exact words
  "product": string,              // short description of what they make, e.g. "hand-painted terracotta pots and decor items"
  "productKeywords": string[],    // 3-5 lowercase keywords useful for matching against buyer requirements
  "location": string,             // town/city name, capitalized, e.g. "Madurai"
  "weeklyCapacityUnits": number,  // units they can produce per week
  "productionCostPerUnit": number,// cost in rupees per unit, digits only, no currency symbol
  "yearsExperience": number       // best estimate; if not mentioned, use 5 as a reasonable default
}

If a field cannot be determined from the transcript, make the most reasonable estimate rather than leaving it null or empty — this profile must be immediately usable by a matching engine.`;

export async function extractProfileFromTranscript(transcript, apiKey) {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Missing or invalid transcript.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }]
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find(block => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic response had no text content.");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*|^```\s*|```$/g, "");

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Could not parse extraction result as JSON: ${cleaned.slice(0, 200)}`);
  }

  return parsed;
}
