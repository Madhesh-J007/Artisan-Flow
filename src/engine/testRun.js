const artisans = require("../data/artisanProfiles.json");
const opportunities = require("../data/opportunities.json");
const {
  DEFAULT_WEIGHTS,
  rankOpportunities,
  adjustWeights,
  generateExplanation,
  generateNegotiationScript
} = require("./scoringEngine");

function printTop(ranked, n, label) {
  console.log(`\n--- ${label} ---`);
  ranked.slice(0, n).forEach((opp, i) => {
    console.log(
      `${i + 1}. [${opp.score.toFixed(3)}] ${opp.title} (${opp.location}) — ` +
        `craft:${opp.breakdown.craftMatch.toFixed(2)} loc:${opp.breakdown.locationFit.toFixed(2)} ` +
        `cap:${opp.breakdown.capacityFit.toFixed(2)} price:${opp.breakdown.priceFit.toFixed(2)} ` +
        `buyer:${opp.breakdown.buyerReqFit.toFixed(2)}`
    );
  });
}

// --- Run for each sample artisan ---
artisans.forEach(profile => {
  console.log(`\n=========================================`);
  console.log(`Artisan: ${profile.name} (${profile.craft}, ${profile.location})`);
  console.log(`=========================================`);

  const initialWeights = DEFAULT_WEIGHTS;
  const ranked = rankOpportunities(profile, opportunities, initialWeights);
  printTop(ranked, 5, "Initial ranking");

  const topMatch = ranked[0];
  console.log(`\nExplanation for top match: ${generateExplanation(profile, topMatch)}`);
  console.log(`Negotiation script: ${generateNegotiationScript(profile, topMatch)}`);

  // --- Simulate feedback: artisan rejects the top match as "too far" ---
  const feedback = { opportunityId: topMatch.id, reaction: "bad", reason: "location" };
  const newWeights = adjustWeights(initialWeights, feedback, topMatch, profile);
  console.log(`\nFeedback: rejected "${topMatch.title}" (reason: ${feedback.reason})`);
  console.log("Weights before:", initialWeights);
  console.log("Weights after: ", newWeights);

  const reRanked = rankOpportunities(profile, opportunities, newWeights);
  printTop(reRanked, 5, "Re-ranked after feedback");
});
