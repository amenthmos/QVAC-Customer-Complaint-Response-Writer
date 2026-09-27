// QVAC Customer Complaint Response Writer — core logic.
// Given a customer's complaint, writes a professional, empathetic response
// draft. Never invents a resolution/refund/policy detail that wasn't
// implied by the customer's own complaint — enforced deterministically by
// scanning the output for resolution-type promises absent from the input.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 3) return true;
  if (text.length > 900) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have",
    "i'm sorry, i cannot", "i'm sorry, i can't", "please provide more", "please try again",
    "i'd be happy to help", "could you provide", "can you provide",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function stripWrapping(text) {
  return text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .replace(/^response:\s*/i, "")
    .trim()
    .replace(/^["“]|["”]$/g, "")
    .trim();
}

// Resolution-type promises the model must never invent unless the customer
// themselves mentioned that concept in the complaint (e.g. asked for a
// refund, mentioned a discount code, etc).
const RESOLUTION_KEYWORDS = [
  "refund", "replace", "replacement", "discount", "% off", "percent off",
  "credit", "reimburse", "voucher", "coupon", "free of charge",
  "compensat", "waive", "money back", "store credit", "full refund",
];

function inventedResolution(outputText, inputText) {
  const outLower = outputText.toLowerCase();
  const inLower = inputText.toLowerCase();
  // Match the FULL keyword phrase in the input, not just its first word —
  // checking only kw.split(" ")[0] let "store credit" pass as grounded
  // whenever the complaint merely contained the unrelated word "store"
  // (e.g. "the store was closed"), which defeats the point of the check.
  return RESOLUTION_KEYWORDS.some((kw) => outLower.includes(kw) && !inLower.includes(kw));
}

const FALLBACK = (complaint) =>
  `Thank you for bringing this to our attention, and I'm sorry for the trouble you experienced regarding "${complaint}". ` +
  `I've logged the details and our team is looking into it right away. We'll follow up with next steps as soon as we can — ` +
  `in the meantime, please let us know if there's anything else affecting your experience.`;

export async function generate(modelId, complaint) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write professional, empathetic customer service responses to complaints. Address the SPECIFIC complaint the customer raised — don't be generic. " +
          "Do NOT promise a refund, replacement, discount, credit, or any specific resolution or policy detail unless the customer themselves mentioned wanting one. " +
          "If they didn't ask for a specific resolution, acknowledge the issue, apologize sincerely, and say the team is looking into it / will follow up — without inventing a concrete fix. " +
          "Reply with ONLY the response draft (2-4 sentences), no preamble, no subject line, no signature block.",
      },
      { role: "user", content: "Complaint: My order arrived three days late and the box was crushed, nothing was broken inside but I was worried." },
      {
        role: "assistant",
        content: "I'm really sorry your order arrived three days late and the box showed up crushed — that's not the experience we want for you, even though I'm glad nothing inside was damaged. I've flagged this with our shipping team so we can look into what happened on this delivery. Thank you for letting us know, and please reach out again if anything else comes up.",
      },
      { role: "user", content: `Complaint: ${complaint}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 300 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = stripWrapping(text);

  let response;
  let flagged = false;
  if (looksUnusable(text)) {
    response = FALLBACK(complaint);
  } else if (inventedResolution(text, complaint)) {
    // Model promised something not grounded in the customer's own words —
    // don't ship a fabricated policy detail, use the safe fallback instead.
    response = FALLBACK(complaint);
    flagged = true;
  } else {
    response = text;
  }

  return { response, flagged };
}
