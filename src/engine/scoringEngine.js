import { getDistanceKm } from "../data/distances.js";

// Default weights — tunable, and mutated per-artisan by the feedback loop.
export const DEFAULT_WEIGHTS = {
  craftMatch: 0.30,
  locationFit: 0.15,
  capacityFit: 0.25,
  priceFit: 0.20,
  buyerReqFit: 0.10
};

const MAX_RELEVANT_DISTANCE_KM = 700; // beyond this, location score bottoms out near 0
const MARGIN_TARGET = 0.20; // artisan wants at least 20% margin over cost

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// --- Sub-score functions -----------------------------------------

function scoreCraftMatch(profile, opp) {
  if (profile.craft === opp.craft) return 1;
  const overlap = profile.productKeywords.filter(k =>
    opp.productKeywords.includes(k)
  ).length;
  const denom = Math.max(profile.productKeywords.length, 1);
  return clamp01(overlap / denom);
}

function scoreLocationFit(profile, opp) {
  const distanceKm = getDistanceKm(profile.location, opp.location);
  if (distanceKm === null) return 0.5;
  return clamp01(1 - distanceKm / MAX_RELEVANT_DISTANCE_KM);
}

function scoreCapacityFit(profile, opp) {
  const availableUnits = profile.weeklyCapacityUnits * opp.timelineWeeks;
  const ratio = availableUnits / opp.quantityNeeded;
  return clamp01(ratio);
}

function scorePriceFit(profile, opp) {
  const priceFloor = profile.productionCostPerUnit * (1 + MARGIN_TARGET);
  if (priceFloor <= opp.priceRangeMax) {
    const headroom = (opp.priceRangeMax - priceFloor) / (opp.priceRangeMax - opp.priceRangeMin || 1);
    return clamp01(0.7 + 0.3 * clamp01(headroom));
  }
  const gapRatio = (priceFloor - opp.priceRangeMax) / opp.priceRangeMax;
  return clamp01(1 - gapRatio * 1.5);
}

function scoreBuyerReqFit(profile, opp) {
  let base = 0.55 + Math.min(profile.yearsExperience, 10) * 0.04;
  const strictReqs = opp.buyerRequirements.filter(r =>
    /certif|GI tag|consistent|registered/i.test(r)
  );
  const penalty = strictReqs.length * (profile.yearsExperience >= 8 ? 0.02 : 0.08);
  return clamp01(base - penalty);
}

// --- Main scoring API ----------------------------------------------

export function scoreOpportunity(profile, opp, weights = DEFAULT_WEIGHTS) {
  const breakdown = {
    craftMatch: scoreCraftMatch(profile, opp),
    locationFit: scoreLocationFit(profile, opp),
    capacityFit: scoreCapacityFit(profile, opp),
    priceFit: scorePriceFit(profile, opp),
    buyerReqFit: scoreBuyerReqFit(profile, opp)
  };

  const totalScore = Object.keys(breakdown).reduce(
    (sum, key) => sum + breakdown[key] * weights[key],
    0
  );

  return {
    opportunityId: opp.id,
    score: Number(totalScore.toFixed(4)),
    breakdown
  };
}

export function rankOpportunities(profile, opportunities, weights = DEFAULT_WEIGHTS) {
  return opportunities
    .map(opp => {
      const result = scoreOpportunity(profile, opp, weights);
      return { ...opp, ...result };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Retailer-side view: rank artisan profiles against a single requirement.
 * Reuses the exact same scoreOpportunity math — a requirement is just an
 * "opportunity" shape, and each artisan is scored against it the same way
 * an artisan would be scored against any opportunity. Same engine, same
 * weights, same explainability — just applied in the other direction.
 */
export function rankArtisansForRequirement(requirement, artisanProfiles, weights = DEFAULT_WEIGHTS) {
  return artisanProfiles
    .map(artisan => {
      const result = scoreOpportunity(artisan, requirement, weights);
      return { ...artisan, ...result };
    })
    .sort((a, b) => b.score - a.score);
}

// --- Feedback loop: adjusts weights based on artisan reaction -------

const WEIGHT_STEP = 0.05;
const WEIGHT_MIN = 0.05;
const WEIGHT_MAX = 0.5;

/**
 * feedback: { opportunityId, reaction: 'good' | 'bad', reason?: 'price' | 'location' | 'capacity' | 'craft' }
 * Nudges the weight of the dimension most likely responsible, then re-normalizes
 * so weights still sum to 1.
 */
export function adjustWeights(currentWeights, feedback, opp, profile) {
  const newWeights = { ...currentWeights };
  const dimension = inferDimension(feedback, opp, profile);

  if (dimension) {
    const delta = feedback.reaction === "good" ? WEIGHT_STEP : -WEIGHT_STEP;
    newWeights[dimension] = clampWeight(newWeights[dimension] + delta);
  }

  return normalizeWeights(newWeights);
}

function inferDimension(feedback, opp, profile) {
  if (feedback.reason) {
    const map = {
      price: "priceFit",
      location: "locationFit",
      capacity: "capacityFit",
      craft: "craftMatch"
    };
    return map[feedback.reason] || null;
  }
  const result = scoreOpportunity(profile, opp, DEFAULT_WEIGHTS);
  const entries = Object.entries(result.breakdown);
  entries.sort((a, b) =>
    feedback.reaction === "bad" ? a[1] - b[1] : b[1] - a[1]
  );
  return entries[0][0];
}

function clampWeight(w) {
  return Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, w));
}

function normalizeWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = {};
  Object.keys(weights).forEach(k => {
    normalized[k] = Number((weights[k] / sum).toFixed(4));
  });
  return normalized;
}

// --- Explanation generation (deterministic fallback; LLM agent can enrich this) --

export function generateExplanation(profile, scoredOpp) {
  const { breakdown } = scoredOpp;
  const reasons = [];

  if (breakdown.craftMatch >= 0.8) {
    reasons.push(`it matches your ${profile.craft} craft closely`);
  }
  if (breakdown.locationFit >= 0.7) {
    reasons.push(`it's fairly close to ${profile.location}`);
  }
  if (breakdown.capacityFit >= 0.8) {
    reasons.push(`you can comfortably meet the quantity and timeline`);
  }
  if (breakdown.priceFit >= 0.7) {
    reasons.push(`the price range covers your costs with good margin`);
  }
  if (reasons.length === 0) {
    reasons.push("it's a reasonable overall fit based on your profile");
  }

  return `This opportunity is ranked highly because ${reasons.join(", ")}.`;
}

// Craft names as spoken in Tamil, used by the Tamil explanation/negotiation
// functions below. Falls back to the English craft label if not in this map.
const CRAFT_TAMIL = {
  pottery: "மண்பாண்டங்கள்",
  weaving: "நெசவு",
  "bamboo craft": "மூங்கில் கைவினை"
};

/**
 * Tamil version of generateExplanation, for text-to-speech playback on the
 * artisan side. Mirrors the same breakdown-driven logic, just phrased in
 * Tamil rather than English — same thresholds, same reasons, different language.
 */
export function generateExplanationTamil(profile, scoredOpp) {
  const { breakdown } = scoredOpp;
  const reasons = [];
  const craftTamil = CRAFT_TAMIL[profile.craft] || profile.craft;

  if (breakdown.craftMatch >= 0.8) {
    reasons.push(`இது உங்கள் ${craftTamil} கைவினைக்கு பொருந்துகிறது`);
  }
  if (breakdown.locationFit >= 0.7) {
    reasons.push(`இது ${profile.location}க்கு அருகில் உள்ளது`);
  }
  if (breakdown.capacityFit >= 0.8) {
    reasons.push(`நீங்கள் இந்த அளவையும் காலக்கெடுவையும் சுலபமாக பூர்த்தி செய்யலாம்`);
  }
  if (breakdown.priceFit >= 0.7) {
    reasons.push(`இந்த விலை உங்கள் செலவை ஈடுகட்டி நல்ல லாபம் தரும்`);
  }
  if (reasons.length === 0) {
    reasons.push("இது உங்கள் விவரங்களுக்கு ஏற்ற வாய்ப்பாக உள்ளது");
  }

  return `இந்த வாய்ப்பு உங்களுக்கு சிறந்தது, ஏனெனில் ${reasons.join(", ")}.`;
}

/**
 * Retailer-facing version of the explanation — phrased from the buyer's
 * perspective evaluating an artisan match, using the same breakdown scores.
 */
export function generateArtisanMatchExplanation(requirement, scoredArtisan) {
  const { breakdown } = scoredArtisan;
  const reasons = [];

  if (breakdown.craftMatch >= 0.8) {
    reasons.push(`their craft closely matches what you're sourcing`);
  }
  if (breakdown.locationFit >= 0.7) {
    reasons.push(`they're located conveniently close to you`);
  }
  if (breakdown.capacityFit >= 0.8) {
    reasons.push(`they can fulfill your quantity within your timeline`);
  }
  if (breakdown.priceFit >= 0.7) {
    reasons.push(`their pricing fits comfortably within your budget`);
  }
  if (reasons.length === 0) {
    reasons.push("they're a reasonable overall fit for this requirement");
  }

  return `${scoredArtisan.name} is ranked highly because ${reasons.join(", ")}.`;
}

// --- Negotiation script generation ---------------------------------

export function generateNegotiationScript(profile, opp) {
  const cost = profile.productionCostPerUnit;
  const fairPrice = Math.round(cost * (1 + MARGIN_TARGET));
  const marketMid = Math.round((opp.priceRangeMin + opp.priceRangeMax) / 2);

  return (
    `Your production cost is ₹${cost} per unit. ` +
    `Similar ${profile.craft} products in this market typically sell for around ₹${marketMid}. ` +
    `A fair price for you would be at least ₹${fairPrice} — don't accept less than ₹${cost} ` +
    `since that would mean no profit at all.`
  );
}

/**
 * Tamil version of generateNegotiationScript, for TTS playback. Same numbers,
 * same logic, phrased for an artisan to actually hear and repeat to a buyer.
 */
export function generateNegotiationScriptTamil(profile, opp) {
  const cost = profile.productionCostPerUnit;
  const fairPrice = Math.round(cost * (1 + MARGIN_TARGET));
  const marketMid = Math.round((opp.priceRangeMin + opp.priceRangeMax) / 2);
  const craftTamil = CRAFT_TAMIL[profile.craft] || profile.craft;

  return (
    `உங்கள் தயாரிப்பு செலவு ஒரு யூனிட்டுக்கு ரூபாய் ${cost}. ` +
    `இதே போன்ற ${craftTamil} பொருட்கள் இந்த சந்தையில் சுமார் ரூபாய் ${marketMid}க்கு விற்கப்படுகிறது. ` +
    `உங்களுக்கு நியாயமான விலை குறைந்தது ரூபாய் ${fairPrice} ஆக இருக்க வேண்டும் — ரூபாய் ${cost}க்கும் குறைவாக ஒப்புக்கொள்ள வேண்டாம், ` +
    `அது எந்த லாபமும் இல்லாமல் போகும்.`
  );
}
