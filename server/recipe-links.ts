// Follows the links creators point to for the full recipe: URLs written in the
// caption or description, and the profile link when the post says "link in
// bio". Link-in-bio pages (Linktree and friends) are expanded and the entry
// that matches the dish is picked; a bare blog homepage is searched for it.

export type LinkVia = "caption_link" | "bio_link";

export interface LinkCues {
  linkInBio: boolean;
  blogMention: boolean;
  dmGated: boolean;
}

export interface LinkedRecipe {
  url: string;
  via: LinkVia;
}

const FETCH_TIMEOUT_MS = 8000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const LINK_AGGREGATORS = [
  "linktr.ee",
  "beacons.ai",
  "stan.store",
  "lnk.bio",
  "linkin.bio",
  "tap.bio",
  "campsite.bio",
  "solo.to",
  "bio.link",
  "bio.site",
  "komi.io",
  "hoo.be",
  "msha.ke",
  "linkpop.com",
  "snipfeed.co",
  "shor.by",
  "flowcode.com",
  "later.com",
  "taplink.cc",
  "allmylinks.com",
  "carrd.co",
];

const IGNORED_DOMAINS = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "tiktokcdn.com",
  "tiktokv.com",
  "youtube.com",
  "youtu.be",
  "ytimg.com",
  "googlevideo.com",
  "google.com",
  "gstatic.com",
  "googleapis.com",
  "schema.org",
  "w3.org",
  "apple.com",
  "twitter.com",
  "x.com",
  "threads.net",
  "pinterest.com",
  "amazon.com",
  "amzn.to",
  "a.co",
  "spotify.com",
  "patreon.com",
  "ko-fi.com",
  "shopltk.com",
  "liketk.it",
  "rstyle.me",
  "gofundme.com",
  "whatsapp.com",
  "t.me",
  "discord.gg",
  "twitch.tv",
  "snapchat.com",
  "linkedin.com",
];

const TITLE_STOPWORDS = new Set([
  "recipe",
  "recipes",
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "with",
  "my",
  "our",
  "your",
  "for",
  "to",
  "in",
  "on",
  "how",
  "make",
  "easy",
  "best",
  "homemade",
  "simple",
  "quick",
  "ever",
  "perfect",
  "ultimate",
  "style",
  "is",
  "it",
  "this",
  "that",
  "you",
  "i",
  "at",
  "by",
  "from",
]);

export function detectLinkCues(text: string): LinkCues {
  return {
    linkInBio:
      /link(ed)?\s*(is\s*)?in\s*(my\s*|the\s*)?(bio|profile)|(on|in)\s+(my\s+)?(insta(gram)?\s+|ig\s+|tiktok\s+)?bio\b|recipe\s*(is\s*)?in\s*(my\s*)?bio|bio\s*link|link\s*on\s*(my\s*)?(profile|page)/i.test(
        text,
      ),
    blogMention:
      /(full|written|printable|complete|detailed)\s+recipe\s+(is\s+)?(on|at|over\s+on|linked)|(on|at)\s+(my|the|our)\s+(blog|website|site)|recipe\s+link|full\s+details\s+(on|at|in)|see\s+(my\s+)?(blog|website)/i.test(
        text,
      ),
    dmGated:
      /comment\s+["'“]?[\w\s]{1,25}["'”]?\s+(below\s+)?(and|&|to)\s+(i'?ll|we'?ll|get|receive|have)|(dm|send|message)\s+(you|it\s+to\s+you)\s+the\s+(full\s+)?recipe|recipe\s+(sent\s+)?(via|by|in)\s+dms?/i.test(
        text,
      ),
  };
}

// Instagram's metadata names the poster even when the reel URL doesn't:
// "764K likes, 1,176 comments - dudu_eats on May 13, 2024: ..."
export function extractCaptionHandle(text: string): string | null {
  const match =
    text.match(/comments?\s*-\s*([A-Za-z0-9._]{2,30})\s+on\s/) ||
    text.match(/\(@([A-Za-z0-9._]{2,30})\)/);
  return match ? `@${match[1]}` : null;
}

// Accounts the caption sends you to for the recipe: "on @Mob website",
// "recipe is on @bbcgoodfood's site".
export function extractPublisherMentions(text: string): string[] {
  const handles = new Set<string>();
  const patterns = [
    /@([A-Za-z0-9._]{2,30})(?:'s)?\s+(?:website|site|app|blog|page)\b/gi,
    /recipe\s+(?:is\s+)?(?:on|at|over\s+on)\s+@([A-Za-z0-9._]{2,30})/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) handles.add(match[1].toLowerCase());
  }
  return [...handles];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function hostMatches(host: string, domains: string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function isAggregator(url: string): boolean {
  return hostMatches(hostOf(url), LINK_AGGREGATORS);
}

function isUsableLink(url: string): boolean {
  const host = hostOf(url);
  if (!host || hostMatches(host, IGNORED_DOMAINS)) return false;
  return !/\.(jpe?g|png|gif|webp|svg|mp4|mov|js|css|ico|woff2?)(\?|$)/i.test(
    url,
  );
}

export function extractUrls(text: string): string[] {
  const cleaned = text
    .replace(/\\\//g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&");

  const found: string[] = [];
  for (const match of cleaned.matchAll(/https?:\/\/[^\s"'<>)\]]+/gi)) {
    found.push(match[0]);
  }
  // Instagram captions aren't hyperlinked, so creators often write a bare
  // domain: "full recipe on halfbakedharvest.com". Skip emails and @handles.
  const bareDomain =
    /(^|[\s(:])((?:[a-z0-9-]+\.)+(?:com\.au|co\.uk|co\.nz|co\.za|com|co|net|org|blog|kitchen|recipes|food|cooking|me|ca|ie|nz))(?![a-z0-9-])((?:\/[^\s"'<>)\]]*)?)/gi;
  for (const match of cleaned.matchAll(bareDomain)) {
    found.push(`https://${match[2]}${match[3]}`);
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const raw of found) {
    const url = raw.replace(/[.,;:!?…]+$/, "");
    const key = url
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "")
      .toLowerCase();
    if (seen.has(key) || !isUsableLink(url)) continue;
    seen.add(key);
    urls.push(url);
  }
  return urls;
}

function titleTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !TITLE_STOPWORDS.has(t));
}

// How much of a candidate's title is about the dish we're after. Scored against
// the candidate (short) rather than the hint (possibly a whole caption).
export function titleMatchScore(candidate: string, hint: string): number {
  const candidateTokens = [...new Set(titleTokens(candidate))];
  if (candidateTokens.length === 0) return 0;
  const hintTokens = new Set(titleTokens(hint));
  const hits = candidateTokens.filter((t) => hintTokens.has(t)).length;
  return hits / candidateTokens.length;
}

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        ...headers,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replace(/\\\//g, "/");
  }
}

function pageTitle(html: string): string {
  const og =
    html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
    );
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return (og?.[1] || title?.[1] || "").trim();
}

function hasRecipeSchema(html: string): boolean {
  return /"@type"\s*:\s*(\[[^\]]*)?"Recipe"/.test(html);
}

interface Candidate {
  url: string;
  label: string;
}

// Pull the outbound links off a link-in-bio page, with their button labels.
function linksFromAggregator(html: string): Candidate[] {
  const candidates: Candidate[] = [];
  for (const m of html.matchAll(
    /"title"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,[^{}]*?"url"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
  )) {
    candidates.push({
      label: decodeJsonString(m[1]),
      url: decodeJsonString(m[2]),
    });
  }
  for (const m of html.matchAll(
    /"url"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,[^{}]*?"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
  )) {
    candidates.push({
      label: decodeJsonString(m[2]),
      url: decodeJsonString(m[1]),
    });
  }
  for (const m of html.matchAll(
    /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    candidates.push({
      url: m[1],
      label: m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    });
  }
  return candidates.filter(
    (c) =>
      /^https?:\/\//.test(c.url) && isUsableLink(c.url) && !isAggregator(c.url),
  );
}

function titleHits(candidate: string, hint: string): number {
  const hintTokens = new Set(titleTokens(hint));
  return new Set(titleTokens(candidate).filter((t) => hintTokens.has(t))).size;
}

function rankByTitle(candidates: Candidate[], hint: string): Candidate[] {
  return candidates
    .map((c) => ({
      c,
      score: Math.max(
        titleMatchScore(c.label, hint),
        titleMatchScore(slugOf(c.url), hint),
      ),
      // More words in common means a more specific match: "pan-fried-soup-dumplings-sheng-jian-bao"
      // beats "chilli-oil" when the caption mentions both.
      hits: Math.max(titleHits(c.label, hint), titleHits(slugOf(c.url), hint)),
    }))
    .sort((a, b) => b.score - a.score || b.hits - a.hits)
    .map(({ c }) => c);
}

function slugOf(url: string): string {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}

function isHomepage(url: string): boolean {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    return path === "" || /^\/(recipes?|blog|index\.html?)$/i.test(path);
  } catch {
    return false;
  }
}

// Most food blogs run WordPress, whose search API is far more reliable than
// scraping; fall back to the HTML search results page.
async function searchSiteForDish(
  siteUrl: string,
  hint: string,
): Promise<string[]> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return [];
  }
  // "@Mob website" puts "mob" in the hint, which would match "mob-fried-chicken".
  const siteName = hostOf(origin).split(".")[0];
  hint = hint.replace(new RegExp(`\\b${siteName}\\b`, "gi"), " ");
  const query = titleTokens(hint).slice(0, 5).join(" ");
  if (!query) return [];

  const apiBody = await fetchText(
    `${origin}/wp-json/wp/v2/search?search=${encodeURIComponent(query)}&per_page=5`,
    { Accept: "application/json" },
  );
  if (apiBody) {
    try {
      const results = JSON.parse(apiBody) as Array<{
        url?: string;
        title?: string;
      }>;
      const candidates = results
        .filter((r) => r.url)
        .map((r) => ({ url: r.url!, label: r.title || "" }));
      if (candidates.length)
        return rankByTitle(candidates, hint).map((c) => c.url);
    } catch {
      // not WordPress - try the search page below
    }
  }

  const searchHtml = await fetchText(
    `${origin}/?s=${encodeURIComponent(query)}`,
  );
  if (searchHtml) {
    const host = hostOf(origin);
    const sameSite = linksFromAggregator(searchHtml).filter(
      (c) => hostOf(c.url) === host && !isHomepage(c.url),
    );
    // Some sites ignore ?s= and serve the homepage, so only links that clearly
    // name the dish count as search results.
    const found = rankByTitle(sameSite, hint)
      .filter(
        (c) =>
          titleMatchScore(slugOf(c.url), hint) >= MATCH_STRICT &&
          titleHits(slugOf(c.url), hint) >= 2,
      )
      .map((c) => c.url);
    if (found.length) return found;
  }

  // Sites with client-rendered search (Mob, many headless CMSs) still publish
  // every recipe URL in their sitemap, and recipe slugs name the dish.
  const sitemapCandidates = (await sitemapUrls(origin)).map((url) => ({
    url,
    label: "",
  }));
  return rankByTitle(sitemapCandidates, hint)
    .filter(
      (c) =>
        titleMatchScore(slugOf(c.url), hint) >= MATCH_STRICT &&
        titleHits(slugOf(c.url), hint) >= 2,
    )
    .map((c) => c.url);
}

const MAX_SITEMAP_FETCHES = 30;

async function sitemapUrls(origin: string): Promise<string[]> {
  const robots = await fetchText(`${origin}/robots.txt`);
  let queue = [...(robots?.matchAll(/^sitemap:\s*(\S+)/gim) ?? [])].map(
    (m) => m[1],
  );
  if (queue.length === 0) queue = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];

  const pages: string[] = [];
  let fetched = 0;
  while (queue.length && fetched < MAX_SITEMAP_FETCHES) {
    const batch = queue.splice(0, Math.min(8, MAX_SITEMAP_FETCHES - fetched));
    fetched += batch.length;
    const bodies = await Promise.all(
      batch.map((url) => fetchText(url, { Accept: "application/xml,text/xml" })),
    );
    for (const xml of bodies) {
      if (!xml) continue;
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) =>
        m[1].replace(/&amp;/g, "&"),
      );
      if (/<sitemapindex/i.test(xml)) {
        // Recipe and post sitemaps first; skip images, tags, authors etc. when we can.
        const preferred = locs.filter((l) => /recipe|post/i.test(l));
        queue.push(...(preferred.length ? preferred : locs));
      } else {
        pages.push(...locs);
      }
    }
  }
  return pages;
}

// Find a publisher's site from its handle ("@Mob" -> mob.co.uk), only trusting a
// domain whose homepage links back to that Instagram/TikTok account.
async function findPublisherSite(handle: string): Promise<string | null> {
  const name = handle.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!name) return null;
  const domains = ["com", "co.uk", "com.au", "co"].map((tld) => `https://www.${name}.${tld}`);
  const pages = await Promise.all(domains.map((d) => fetchText(d)));
  const backlink = new RegExp(`(instagram|tiktok)\\.com/@?${name}(?![a-z0-9._])`, "i");
  const index = pages.findIndex((html) => html && backlink.test(html));
  return index >= 0 ? domains[index] : null;
}

// Accept a page only if it's a recipe for this dish. How closely the title must
// match depends on how we got there: the only link in the caption needs no
// match, while a page found by expanding a bio link has to name the dish.
const MATCH_ANY = 0;
const MATCH_LOOSE = 0.2; // top hits from the creator's own site search
const MATCH_STRICT = 0.34;

// Many food blogs sit behind bot protection that 403s server fetches of the
// page itself while leaving the WordPress REST API open. The post's rendered
// content still carries the recipe card (WPRM, Tasty etc.), so fall back to it.
export async function fetchRecipePageHtml(url: string): Promise<string | null> {
  const direct = await fetchText(url);
  if (direct) return direct;

  const slug = slugOf(url);
  if (!slug) return null;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return null;
  }
  for (const type of ["posts", "pages"]) {
    const body = await fetchText(
      `${origin}/wp-json/wp/v2/${type}?slug=${encodeURIComponent(slug)}&_fields=title,content`,
      { Accept: "application/json" },
    );
    if (!body) continue;
    try {
      const [post] = JSON.parse(body) as Array<{
        title?: { rendered?: string };
        content?: { rendered?: string };
      }>;
      if (post?.content?.rendered) {
        console.log(
          `Page fetch blocked; using WordPress API content for ${url}`,
        );
        return `<title>${post.title?.rendered || ""}</title>\n${post.content.rendered}`;
      }
    } catch {
      // not WordPress
    }
  }
  return null;
}

async function confirmRecipePage(
  url: string,
  hint: string,
  minScore: number,
): Promise<boolean> {
  const html = await fetchRecipePageHtml(url);
  if (!html) return false;
  const isRecipe =
    hasRecipeSchema(html) ||
    /class=["'][^"']*(wprm-recipe|tasty-recipes|recipe-card|mv-create)/i.test(
      html,
    );
  if (!isRecipe) return false;
  if (minScore === MATCH_ANY) return true;
  const score = Math.max(
    titleMatchScore(pageTitle(html), hint),
    titleMatchScore(slugOf(url), hint),
  );
  return score > 0 && score >= minScore;
}

async function resolveLink(
  url: string,
  hint: string,
  via: LinkVia,
  minScore: number,
): Promise<LinkedRecipe | null> {
  let candidates: string[];
  if (isAggregator(url)) {
    const html = await fetchText(url);
    if (!html) return null;
    const links = rankByTitle(linksFromAggregator(html), hint);
    const matching = links.filter(
      (c) =>
        Math.max(
          titleMatchScore(c.label, hint),
          titleMatchScore(slugOf(c.url), hint),
        ) >= MATCH_STRICT,
    );
    // No button names the dish - the creator's blog homepage is the next best lead.
    candidates = matching.length
      ? matching.slice(0, 3).map((c) => c.url)
      : links
          .filter((c) => isHomepage(c.url))
          .slice(0, 1)
          .map((c) => c.url);
    minScore = Math.max(minScore, MATCH_STRICT);
  } else {
    candidates = [url];
  }

  for (const candidate of candidates) {
    if (isHomepage(candidate)) {
      for (const found of (await searchSiteForDish(candidate, hint)).slice(
        0,
        3,
      )) {
        if (await confirmRecipePage(found, hint, MATCH_LOOSE))
          return { url: found, via };
      }
      continue;
    }
    if (await confirmRecipePage(candidate, hint, minScore))
      return { url: candidate, via };
  }
  return null;
}

async function fetchProfileLinks(
  platform: string,
  handle: string,
): Promise<string[]> {
  const username = handle.replace(/^@/, "").trim();
  if (!username) return [];

  if (platform === "instagram") {
    const body = await fetchText(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { "x-ig-app-id": "936619743392459", Accept: "application/json" },
    );
    if (body) {
      try {
        const user = JSON.parse(body)?.data?.user;
        const links = [
          user?.external_url,
          ...(user?.bio_links || []).map((l: any) => l?.url),
          ...extractUrls(user?.biography || ""),
        ].filter((l): l is string => typeof l === "string" && isUsableLink(l));
        if (links.length) return [...new Set(links)];
      } catch {
        // fall through to scraping the profile page
      }
    }
    const html = await fetchText(
      `https://www.instagram.com/${encodeURIComponent(username)}/`,
    );
    const external = html?.match(/"external_url"\s*:\s*"((?:[^"\\]|\\.)+)"/);
    return external ? [decodeJsonString(external[1])].filter(isUsableLink) : [];
  }

  if (platform === "tiktok") {
    const html = await fetchText(
      `https://www.tiktok.com/@${encodeURIComponent(username)}`,
    );
    if (!html) return [];
    const links: string[] = [];
    const bioLink = html.match(
      /"bioLink"\s*:\s*\{[^}]*"link"\s*:\s*"((?:[^"\\]|\\.)+)"/,
    );
    if (bioLink) {
      const link = decodeJsonString(bioLink[1]);
      links.push(/^https?:\/\//.test(link) ? link : `https://${link}`);
    }
    const signature = html.match(/"signature"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (signature) links.push(...extractUrls(decodeJsonString(signature[1])));
    return [...new Set(links)].filter(isUsableLink);
  }

  return [];
}

export interface FindLinkedRecipeInput {
  captionText: string;
  titleHint: string;
  platform: string;
  creatorHandle: string | null;
}

export async function findCreatorLinkedRecipe({
  captionText,
  titleHint,
  platform,
  creatorHandle,
}: FindLinkedRecipeInput): Promise<{
  recipe: LinkedRecipe | null;
  cues: LinkCues;
}> {
  const cues = detectLinkCues(captionText);
  const hint = titleHint || captionText.slice(0, 300);

  const captionUrls = extractUrls(captionText).slice(0, 4);
  // A single link in the caption is almost certainly "the recipe"; with several
  // (shop links, gear, socials) we make each one prove it matches the dish.
  const captionMinScore = captionUrls.length === 1 ? MATCH_ANY : MATCH_STRICT;
  for (const url of captionUrls) {
    console.log(`Following caption link: ${url}`);
    const found = await resolveLink(url, hint, "caption_link", captionMinScore);
    if (found) return { recipe: found, cues };
  }

  for (const publisher of extractPublisherMentions(captionText)) {
    if (creatorHandle && publisher === creatorHandle.replace(/^@/, "").toLowerCase()) continue;
    const site = await findPublisherSite(publisher);
    console.log(`Caption points to @${publisher}; site: ${site || "not found"}`);
    if (!site) continue;
    for (const found of (await searchSiteForDish(site, hint)).slice(0, 3)) {
      if (await confirmRecipePage(found, hint, MATCH_STRICT)) {
        return { recipe: { url: found, via: "caption_link" }, cues };
      }
    }
  }

  if ((cues.linkInBio || cues.blogMention) && creatorHandle) {
    const profileLinks = (
      await fetchProfileLinks(platform, creatorHandle)
    ).slice(0, 3);
    console.log(
      `Link-in-bio cue found; profile links: ${profileLinks.join(", ") || "none"}`,
    );
    for (const url of profileLinks) {
      const found = await resolveLink(url, hint, "bio_link", MATCH_STRICT);
      if (found) return { recipe: found, cues };
    }
  }

  return { recipe: null, cues };
}
