// Ingredient provenance and server-side confidence scoring.
//
// The model tags each ingredient with where its amount came from and quotes the
// snippet it read it from. We don't take that on trust: the quote has to exist
// in the source text it claims, and has to contain the amount. Anything that
// fails is downgraded to "inferred". Confidence is then computed from those
// verified counts rather than from the model's opinion of itself.

export type IngredientSource =
  | "written"
  | "spoken"
  | "website"
  | "inferred"
  | "confirmed";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface SourceTexts {
  transcript: string | null;
  caption: string | null;
  website: string | null;
}

export interface VerifiedIngredient {
  name: string;
  amount: string;
  unit: string;
  aisle: string;
  source: IngredientSource;
  evidence: string | null;
  isEstimated: boolean;
}

const VALID_AISLES = [
  "produce",
  "meat",
  "seafood",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "spices",
  "beverages",
  "other",
];
const CLAIMABLE_SOURCES: IngredientSource[] = [
  "written",
  "spoken",
  "website",
  "inferred",
];

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": " 1/2",
  "⅓": " 1/3",
  "⅔": " 2/3",
  "¼": " 1/4",
  "¾": " 3/4",
  "⅕": " 1/5",
  "⅛": " 1/8",
  "⅜": " 3/8",
  "⅝": " 5/8",
  "⅞": " 7/8",
};

const NUMBER_WORDS: Record<string, string[]> = {
  "1": ["one", "a", "an"],
  "2": ["two", "couple"],
  "3": ["three"],
  "4": ["four"],
  "5": ["five"],
  "6": ["six"],
  "7": ["seven"],
  "8": ["eight"],
  "9": ["nine"],
  "10": ["ten"],
  "11": ["eleven"],
  "12": ["twelve", "dozen"],
  "15": ["fifteen"],
  "20": ["twenty"],
  "30": ["thirty"],
  "40": ["forty"],
  "50": ["fifty"],
  "100": ["hundred"],
  "1/2": ["half"],
  "1/4": ["quarter"],
  "3/4": ["three quarters"],
  "1/3": ["third"],
  "0.5": ["half"],
  "0.25": ["quarter"],
};

export function normalizeForMatch(text: string): string {
  // ".5tsp" -> "0.5tsp" so a quote starting with the decimal matches the page text.
  let out = text.toLowerCase().replace(/(^|[^\d])\.(\d)/g, "$10.$2");
  for (const [glyph, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    out = out.split(glyph).join(ascii);
  }
  return out
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9/.'\s]/g, " ")
    .replace(/(\D)\.|\.(\D)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeForMatch(text).split(" ").filter(Boolean);
}

// True when the quote appears in the text, either verbatim (after
// normalisation) or as a tight window holding nearly all of its words, which
// tolerates the model tidying punctuation or dropping a filler word.
export function quoteAppearsIn(quote: string, text: string | null): boolean {
  if (!text || !quote) return false;
  const normQuote = normalizeForMatch(quote);
  if (!normQuote) return false;
  const normText = normalizeForMatch(text);
  if (normText.includes(normQuote)) return true;

  const quoteTokens = normQuote.split(" ");
  if (quoteTokens.length < 3) return false;
  const textTokens = normText.split(" ");
  const windowSize = Math.ceil(quoteTokens.length * 1.5);
  const needed = Math.ceil(quoteTokens.length * 0.8);

  for (
    let start = 0;
    start + Math.min(windowSize, textTokens.length) <= textTokens.length;
    start++
  ) {
    const window = new Set(textTokens.slice(start, start + windowSize));
    let hits = 0;
    for (const token of quoteTokens) {
      if (window.has(token)) hits++;
    }
    if (hits >= needed) return true;
  }
  return false;
}

// The evidence must state the amount, otherwise the model may have quoted the
// ingredient being mentioned and made up the quantity.
export function evidenceContainsAmount(
  evidence: string,
  amount: string,
): boolean {
  const normAmount = normalizeForMatch(amount);
  if (!/\d/.test(normAmount)) return true; // "to taste", "a pinch" etc. - nothing numeric to check
  const evidenceTokens = new Set(tokenize(evidence));
  const normEvidence = normalizeForMatch(evidence);

  return normAmount
    .split(" ")
    .filter((t) => /\d/.test(t))
    .every((part) => {
      if (evidenceTokens.has(part) || normEvidence.includes(part)) return true;
      // "1/2" in the amount vs "0.5" in the source, or the other way round
      const equivalent = FRACTION_DECIMALS[part];
      if (equivalent && evidenceTokens.has(equivalent)) return true;
      const words = NUMBER_WORDS[part] || [];
      return words.some((w) =>
        w.includes(" ") ? normEvidence.includes(w) : evidenceTokens.has(w),
      );
    });
}

const FRACTION_DECIMALS: Record<string, string> = {
  "1/2": "0.5",
  "0.5": "1/2",
  "1/4": "0.25",
  "0.25": "1/4",
  "3/4": "0.75",
  "0.75": "3/4",
};

function textForSource(
  source: IngredientSource,
  texts: SourceTexts,
): string | null {
  if (source === "spoken") return texts.transcript;
  if (source === "written") return texts.caption;
  if (source === "website") return texts.website;
  return null;
}

function sourceNaming(name: string, texts: SourceTexts): IngredientSource | null {
  const words = tokenize(name).filter((w) => w.length > 2);
  if (words.length === 0) return null;
  const candidates: [IngredientSource, string | null][] = [
    ["website", texts.website],
    ["written", texts.caption],
    ["spoken", texts.transcript],
  ];
  for (const [source, text] of candidates) {
    if (!text) continue;
    const textTokens = new Set(tokenize(text).map((t) => t.replace(/s$/, "")));
    if (words.every((w) => textTokens.has(w.replace(/s$/, "")))) return source;
  }
  return null;
}

export function verifyIngredients(
  rawIngredients: any[],
  texts: SourceTexts,
): VerifiedIngredient[] {
  return (rawIngredients || [])
    .filter((ing) => ing && typeof ing.name === "string" && ing.name.trim())
    .map((ing) => {
      const amount = ing.amount != null ? String(ing.amount) : "";
      const unit = ing.unit != null ? String(ing.unit) : "";
      const claimed: IngredientSource = CLAIMABLE_SOURCES.includes(ing.source)
        ? ing.source
        : "inferred";
      const evidence =
        typeof ing.evidence === "string"
          ? ing.evidence.trim().slice(0, 240)
          : null;

      let source: IngredientSource = claimed;
      if (!/\d/.test(amount) && claimed === "inferred") {
        // No quantity to estimate ("scallions", "salt to taste") - if the ingredient
        // itself is named in a source, it isn't a guess.
        source = sourceNaming(ing.name, texts) ?? "inferred";
      } else if (claimed !== "inferred") {
        const sourceText = textForSource(claimed, texts);
        const verified =
          !!evidence &&
          quoteAppearsIn(evidence, sourceText) &&
          evidenceContainsAmount(evidence, `${amount} ${unit}`.trim());
        if (!verified) {
          source = "inferred";
        }
      }

      return {
        name: ing.name.trim(),
        amount,
        unit,
        aisle: VALID_AISLES.includes(ing.aisle) ? ing.aisle : "other",
        source,
        evidence: source === "inferred" ? null : evidence,
        isEstimated: source === "inferred",
      };
    });
}

export function countSources(
  ingredients: { source?: IngredientSource }[],
): Record<IngredientSource, number> {
  const counts: Record<IngredientSource, number> = {
    written: 0,
    spoken: 0,
    website: 0,
    inferred: 0,
    confirmed: 0,
  };
  for (const ing of ingredients) {
    counts[ing.source ?? "inferred"]++;
  }
  return counts;
}

export interface ConfidenceInput {
  ingredients: { source?: IngredientSource }[];
  instructionsInferred: boolean;
  websiteVerified: boolean;
}

export interface ConfidenceResult {
  confidence: ConfidenceLevel;
  summary: string;
}

export function computeConfidence({
  ingredients,
  instructionsInferred,
  websiteVerified,
}: ConfidenceInput): ConfidenceResult {
  const counts = countSources(ingredients);
  const total = ingredients.length;

  if (total === 0) {
    return {
      confidence: "low",
      summary: "No ingredient amounts could be found.",
    };
  }

  const inferredShare = counts.inferred / total;
  let confidence: ConfidenceLevel;
  if (inferredShare === 0) {
    confidence = "high";
  } else if (inferredShare <= 0.25) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // A website we couldn't tie to the creator might be someone else's version of the dish.
  if (confidence === "high" && !websiteVerified && counts.website > total / 2) {
    confidence = "medium";
  }
  if (confidence === "high" && instructionsInferred) {
    confidence = "medium";
  }

  const parts: string[] = [];
  if (counts.website) parts.push(`${counts.website} from the recipe page`);
  if (counts.written) parts.push(`${counts.written} written in the post`);
  if (counts.spoken) parts.push(`${counts.spoken} heard in the video`);
  if (counts.inferred) parts.push(`${counts.inferred} estimated`);
  const summary = `Amounts: ${parts.join(", ")}.`;

  return { confidence, summary };
}
