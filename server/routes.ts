import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface PageContent {
  text: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  profileImageUrl: string | null;
}

async function fetchPageContent(url: string): Promise<PageContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return { text: null, imageUrl: null, videoUrl: null, profileImageUrl: null };
    }

    const html = await response.text();
    
    const extractedContent: string[] = [];
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let profileImageUrl: string | null = null;
    
    // Helper to decode HTML entities
    const decodeHtmlEntities = (str: string) => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };
    
    // Extract image URL (og:image)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      imageUrl = decodeHtmlEntities(ogImageMatch[1]);
    }
    
    // Extract video URL (og:video)
    const ogVideoMatch = html.match(/<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i) ||
                         html.match(/<meta[^>]*property=["']og:video:url["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video:url["']/i);
    if (ogVideoMatch) {
      videoUrl = decodeHtmlEntities(ogVideoMatch[1]);
    }
    
    // Also try to find video URLs in JSON data
    const videoUrlPatterns = [
      /"video_url"\s*:\s*"([^"]+)"/,
      /"playback_url"\s*:\s*"([^"]+)"/,
      /"contentUrl"\s*:\s*"([^"]+)"/,
    ];
    
    if (!videoUrl) {
      for (const pattern of videoUrlPatterns) {
        const match = html.match(pattern);
        if (match) {
          videoUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          break;
        }
      }
    }
    
    // Also try to find high-res images in JSON
    const imageUrlPatterns = [
      /"display_url"\s*:\s*"([^"]+)"/,
      /"thumbnail_url"\s*:\s*"([^"]+)"/,
    ];
    
    if (!imageUrl) {
      for (const pattern of imageUrlPatterns) {
        const match = html.match(pattern);
        if (match) {
          imageUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          break;
        }
      }
    }
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      extractedContent.push(`Page Title: ${titleMatch[1]}`);
    }
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (metaDescMatch) {
      extractedContent.push(`Description: ${metaDescMatch[1]}`);
    }
    
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch) {
      extractedContent.push(`Post Content: ${ogDescMatch[1]}`);
    }
    
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch) {
      extractedContent.push(`Post Title: ${ogTitleMatch[1]}`);
    }

    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData.description) {
          extractedContent.push(`Structured Data: ${jsonData.description}`);
        }
        if (jsonData.name) {
          extractedContent.push(`Name: ${jsonData.name}`);
        }
        if (jsonData.caption) {
          extractedContent.push(`Caption: ${jsonData.caption}`);
        }
        // Extract media from JSON-LD
        if (jsonData.thumbnailUrl && !imageUrl) {
          imageUrl = jsonData.thumbnailUrl;
        }
        if (jsonData.contentUrl && !videoUrl) {
          videoUrl = jsonData.contentUrl;
        }
      } catch (e) {
      }
    }

    const captionPatterns = [
      /"caption"\s*:\s*"([^"]+)"/g,
      /"text"\s*:\s*"([^"]+)"/g,
      /"description"\s*:\s*"([^"]+)"/g,
    ];
    
    for (const pattern of captionPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const text = match[1];
        if (text.length > 50 && text.length < 5000 && !extractedContent.some(c => c.includes(text))) {
          extractedContent.push(`Content: ${text.replace(/\\n/g, '\n').replace(/\\u[\dA-Fa-f]{4}/g, '')}`);
        }
      }
    }

    // Extract profile/avatar image
    const profileImagePatterns = [
      /"profile_pic_url"\s*:\s*"([^"]+)"/,
      /"profile_pic_url_hd"\s*:\s*"([^"]+)"/,
      /"avatarThumb"\s*:\s*"([^"]+)"/,
      /"avatarMedium"\s*:\s*"([^"]+)"/,
      /"avatar"\s*:\s*"([^"]+)"/,
      /"owner"\s*:\s*\{[^}]*"profile_pic_url"\s*:\s*"([^"]+)"/,
    ];
    
    for (const pattern of profileImagePatterns) {
      const match = html.match(pattern);
      if (match) {
        profileImageUrl = decodeHtmlEntities(match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''));
        break;
      }
    }

    console.log(`Extracted media - Image: ${imageUrl ? 'found' : 'none'}, Video: ${videoUrl ? 'found' : 'none'}, Profile: ${profileImageUrl ? 'found' : 'none'}`);

    return {
      text: extractedContent.length > 0 ? extractedContent.join('\n\n') : null,
      imageUrl,
      videoUrl,
      profileImageUrl,
    };
  } catch (error) {
    console.error("Error fetching page content:", error);
    return { text: null, imageUrl: null, videoUrl: null, profileImageUrl: null };
  }
}

async function transcribeVideoFromUrl(videoUrl: string): Promise<string | null> {
  const tempId = randomUUID();
  const tempDir = os.tmpdir();
  const videoPath = path.join(tempDir, `video_${tempId}.mp4`);
  const audioPath = path.join(tempDir, `audio_${tempId}.mp3`);
  
  try {
    console.log(`Downloading video for transcription...`);
    
    // Download video
    const videoResponse = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });
    
    if (!videoResponse.ok) {
      console.log(`Failed to download video: ${videoResponse.status}`);
      return null;
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    await writeFile(videoPath, Buffer.from(videoBuffer));
    console.log(`Video downloaded to ${videoPath}`);
    
    // Extract audio using ffmpeg
    console.log(`Extracting audio...`);
    await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 -y "${audioPath}" 2>/dev/null`);
    console.log(`Audio extracted to ${audioPath}`);
    
    // Read audio file for transcription
    const audioBuffer = await readFile(audioPath);
    const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });
    
    // Transcribe with OpenAI Whisper
    console.log(`Transcribing audio with Whisper...`);
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
    });
    
    console.log(`Transcription complete: ${transcription.text.substring(0, 100)}...`);
    
    // Cleanup temp files
    await unlink(videoPath).catch(() => {});
    await unlink(audioPath).catch(() => {});
    
    return transcription.text;
  } catch (error) {
    console.error("Error transcribing video:", error);
    // Cleanup on error
    await unlink(videoPath).catch(() => {});
    await unlink(audioPath).catch(() => {});
    return null;
  }
}

interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
  isVerified: boolean;
  verificationMethod?: 'domain_match' | 'instagram_link' | 'unverified';
  domainName?: string;
}

function normalizeHandle(handle: string): string {
  return handle.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]/g, '');
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return '';
  }
}

function checkDomainMatchesCreator(domain: string, creatorHandle: string): boolean {
  const normalizedHandle = normalizeHandle(creatorHandle);
  const normalizedDomain = domain.toLowerCase().replace(/\.(com|net|org|io|co|ie|uk|ca|blog)$/, '').replace(/[^a-z0-9]/g, '');
  
  if (normalizedDomain.includes(normalizedHandle) || normalizedHandle.includes(normalizedDomain)) {
    return true;
  }
  
  const handleWords = normalizedHandle.replace(/([a-z])([A-Z])/g, '$1 $2').split(/(?=[A-Z])|[^a-z0-9]+/).filter(Boolean);
  const domainWords = normalizedDomain.split(/[^a-z0-9]+/).filter(Boolean);
  
  const matchingWords = handleWords.filter(word => 
    domainWords.some(dWord => dWord.includes(word) || word.includes(dWord))
  );
  
  return matchingWords.length >= Math.min(2, handleWords.length);
}

async function verifyCreatorWebsite(websiteUrl: string, creatorHandle: string): Promise<{ isVerified: boolean; method: 'domain_match' | 'instagram_link' | 'unverified' }> {
  const domain = extractDomain(websiteUrl);
  const normalizedHandle = normalizeHandle(creatorHandle);
  
  if (checkDomainMatchesCreator(domain, creatorHandle)) {
    console.log(`Domain "${domain}" matches creator handle "${creatorHandle}" - verified by domain match`);
    return { isVerified: true, method: 'domain_match' };
  }
  
  try {
    console.log(`Checking website for Instagram link to verify creator...`);
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    
    if (!response.ok) {
      return { isVerified: false, method: 'unverified' };
    }
    
    const html = await response.text();
    
    const instagramPatterns = [
      /instagram\.com\/([a-zA-Z0-9._]+)/gi,
      /href=["'][^"']*instagram\.com\/([a-zA-Z0-9._]+)["']/gi,
    ];
    
    for (const pattern of instagramPatterns) {
      const matches = [...html.matchAll(pattern)];
      for (const match of matches) {
        const foundHandle = match[1].toLowerCase();
        if (foundHandle === normalizedHandle || foundHandle === normalizedHandle.replace(/[^a-z0-9]/g, '')) {
          console.log(`Found matching Instagram link: @${foundHandle} - verified!`);
          return { isVerified: true, method: 'instagram_link' };
        }
      }
    }
    
    console.log(`No matching Instagram link found on website`);
    return { isVerified: false, method: 'unverified' };
  } catch (error) {
    console.log(`Error verifying website: ${error}`);
    return { isVerified: false, method: 'unverified' };
  }
}

async function performWebSearch(query: string): Promise<Array<{url: string, title: string, snippet: string}>> {
  // Try Serper.dev API first (reliable, 2500 free searches/month)
  const serperApiKey = process.env.SERPER_API_KEY;
  if (serperApiKey) {
    const serperResults = await performSerperSearch(query, serperApiKey);
    if (serperResults.length > 0) {
      return serperResults;
    }
    console.log(`Serper returned no results, falling back to scraping for: "${query}"`);
  } else {
    console.log(`No SERPER_API_KEY found, falling back to scraping for: "${query}"`);
  }
  
  // Fallback to Google scraping (may be blocked)
  const googleResults = await performGoogleSearch(query);
  if (googleResults.length > 0) {
    return googleResults;
  }
  
  // Final fallback to DuckDuckGo
  console.log(`Google returned no results, trying DuckDuckGo for: "${query}"`);
  return performDuckDuckGoSearch(query);
}

async function performSerperSearch(query: string, apiKey: string): Promise<Array<{url: string, title: string, snippet: string}>> {
  console.log(`Serper search: "${query}"`);
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        gl: 'us',
        hl: 'en',
      }),
    });
    
    if (!response.ok) {
      console.log(`Serper search failed: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const results: Array<{url: string, title: string, snippet: string}> = [];
    
    // Parse organic results
    if (data.organic && Array.isArray(data.organic)) {
      for (const result of data.organic) {
        if (result.link) {
          results.push({
            url: result.link,
            title: result.title || '',
            snippet: result.snippet || '',
          });
        }
      }
    }
    
    console.log(`Found ${results.length} results from Serper`);
    return results;
  } catch (error) {
    console.log(`Serper search error: ${error}`);
    return [];
  }
}

async function performGoogleSearch(query: string): Promise<Array<{url: string, title: string, snippet: string}>> {
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=10`;
  
  console.log(`Google search: "${query}"`);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
    });
    
    if (!response.ok) {
      console.log(`Google search failed: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const results: Array<{url: string, title: string, snippet: string}> = [];
    
    // Parse Google search results - look for result links
    // Google results have URLs in various formats, try multiple patterns
    
    // Pattern 1: Standard search result links with /url?q=
    const urlPattern = /\/url\?q=([^&"]+)/gi;
    const urlMatches = [...html.matchAll(urlPattern)];
    
    // Pattern 2: Direct href links to results (data-ved links usually have real URLs)
    const hrefPattern = /href="(https?:\/\/(?!www\.google|google|accounts\.google|support\.google|maps\.google)[^"]+)"/gi;
    const hrefMatches = [...html.matchAll(hrefPattern)];
    
    const seenUrls = new Set<string>();
    
    // Process /url?q= matches
    for (const match of urlMatches) {
      try {
        const decodedUrl = decodeURIComponent(match[1]);
        // Skip Google's own URLs and tracking
        if (decodedUrl.includes('google.com') || 
            decodedUrl.includes('youtube.com') ||
            decodedUrl.includes('webcache') ||
            seenUrls.has(decodedUrl)) {
          continue;
        }
        seenUrls.add(decodedUrl);
        results.push({
          url: decodedUrl,
          title: '',
          snippet: '',
        });
      } catch (e) {
        // Skip malformed URLs
      }
    }
    
    // Also check direct hrefs if we didn't get enough results
    if (results.length < 5) {
      for (const match of hrefMatches) {
        const url = match[1];
        if (!seenUrls.has(url) && 
            !url.includes('google.com') &&
            !url.includes('gstatic.com') &&
            !url.includes('youtube.com')) {
          seenUrls.add(url);
          results.push({
            url: url,
            title: '',
            snippet: '',
          });
        }
      }
    }
    
    console.log(`Found ${results.length} results from Google`);
    return results.slice(0, 10);
  } catch (error) {
    console.log(`Google search error: ${error}`);
    return [];
  }
}

async function performDuckDuckGoSearch(query: string): Promise<Array<{url: string, title: string, snippet: string}>> {
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  
  console.log(`DuckDuckGo search: "${query}"`);
  
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  
  if (!response.ok) {
    console.log(`DuckDuckGo search failed: ${response.status}`);
    return [];
  }
  
  const html = await response.text();
  
  const results: Array<{url: string, title: string, snippet: string}> = [];
  
  const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]*)</gi;
  const matches = [...html.matchAll(resultPattern)];
  
  console.log(`Found ${matches.length} raw results from DuckDuckGo`);
  
  for (const match of matches) {
    const resultUrl = match[1];
    const title = match[2];
    const snippet = match[3] || '';
    
    const decodedUrl = decodeURIComponent(resultUrl.replace(/.*uddg=([^&]+).*/, '$1'));
    
    results.push({
      url: decodedUrl,
      title: title.trim(),
      snippet: snippet.trim(),
    });
  }
  
  return results;
}

function validateRecipeMatch(candidateTitle: string, candidateSnippet: string, targetRecipeName: string): boolean {
  const normalizedTarget = targetRecipeName.toLowerCase().trim();
  const normalizedTitle = candidateTitle.toLowerCase();
  const normalizedSnippet = candidateSnippet.toLowerCase();
  
  // Extract key words from target recipe name (ignore common words)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'with', 'in', 'on', 'for', 'to', 'of', 'recipe', 'easy', 'best', 'homemade', 'simple', 'quick'];
  const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
  
  if (targetWords.length === 0) return true; // No meaningful words to match
  
  // Check how many key words appear in title or snippet
  const combinedText = `${normalizedTitle} ${normalizedSnippet}`;
  const matchedWords = targetWords.filter(word => combinedText.includes(word));
  const matchRatio = matchedWords.length / targetWords.length;
  
  // Require at least 70% of key words to match
  const isMatch = matchRatio >= 0.7;
  
  if (!isMatch) {
    console.log(`Recipe match validation failed: target="${targetRecipeName}", matched ${matchedWords.length}/${targetWords.length} words (${(matchRatio * 100).toFixed(0)}%)`);
    console.log(`  Target words: ${targetWords.join(', ')}`);
    console.log(`  Matched: ${matchedWords.join(', ')}`);
  }
  
  return isMatch;
}

async function searchForCreatorRecipe(recipeName: string, creatorHandle: string | null): Promise<WebSearchResult | null> {
  try {
    const creatorName = creatorHandle ? creatorHandle.replace('@', '').replace(/[_.-]/g, ' ') : '';
    const normalizedCreatorName = normalizeHandle(creatorName);
    
    // Check if we have a valid recipe name (not just "Unknown" or placeholder text)
    const hasValidRecipeName = recipeName && 
      !recipeName.toLowerCase().includes('unknown') && 
      !recipeName.toLowerCase().includes('not provided') &&
      recipeName.length > 3;
    
    console.log(`Searching for recipe: "${recipeName}" (valid: ${hasValidRecipeName}) by creator: "${creatorName || 'unknown'}"`);
    
    const excludeDomains = ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com', 'twitter.com', 'pinterest.com', 'amazon.com', 'reddit.com'];
    
    interface CandidateResult {
      url: string;
      title: string;
      snippet: string;
      domainMatchScore: number;
      source: string;
    }
    
    const allCandidates: CandidateResult[] = [];
    
    // Strategy 0: If we only have creator handle but no recipe name, search for their recipes page
    if (creatorName && !hasValidRecipeName) {
      console.log(`No valid recipe name - searching for creator's recipe website directly...`);
      
      // Try to find creator's recipes page
      const creatorWebsiteQuery = `${creatorName} recipes`;
      const websiteResults = await performWebSearch(creatorWebsiteQuery);
      
      for (const result of websiteResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        const domain = extractDomain(result.url);
        const domainMatches = checkDomainMatchesCreator(domain, creatorName);
        
        // Prioritize results that match creator's domain
        if (domainMatches) {
          allCandidates.push({
            ...result,
            domainMatchScore: 25, // Highest priority for domain match without recipe name
            source: 'creator-website-direct',
          });
          console.log(`Found creator's website: ${result.url}`);
        }
      }
      
      // If we found the creator's website, return immediately
      if (allCandidates.length > 0) {
        const best = allCandidates[0];
        const verification = await verifyCreatorWebsite(best.url, creatorHandle || '');
        console.log(`Returning creator's website directly: ${best.url}`);
        return {
          url: best.url,
          title: best.title,
          snippet: best.snippet,
          isVerified: verification.isVerified,
          verificationMethod: verification.method,
          domainName: extractDomain(best.url),
        };
      }
    }
    
    // Strategy 1: Search specifically on creator's likely domain
    if (creatorName && hasValidRecipeName) {
      const siteSearchQuery = `site:${normalizedCreatorName}.* ${recipeName} recipe`;
      const siteResults = await performWebSearch(siteSearchQuery);
      
      for (const result of siteResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        const domain = extractDomain(result.url);
        allCandidates.push({
          ...result,
          domainMatchScore: 20, // Highest priority for site-specific search
          source: 'site-search',
        });
        console.log(`Site search found: ${result.url}`);
      }
    }
    
    // Strategy 2: Search with creator name and recipe
    if (creatorName && hasValidRecipeName) {
      const creatorSearchQuery = `${creatorName} ${recipeName} recipe`;
      const creatorResults = await performWebSearch(creatorSearchQuery);
      
      for (const result of creatorResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        // Check if this URL is already in candidates
        if (allCandidates.some(c => c.url === result.url)) continue;
        
        const domain = extractDomain(result.url);
        const domainMatches = checkDomainMatchesCreator(domain, creatorName);
        
        allCandidates.push({
          ...result,
          domainMatchScore: domainMatches ? 15 : 5,
          source: 'creator-search',
        });
        
        if (domainMatches) {
          console.log(`Creator search found matching domain: ${result.url}`);
        }
      }
    }
    
    // Strategy 3: Generic recipe search as fallback (quoted) - only if we have valid recipe name
    if (hasValidRecipeName) {
      const genericSearchQuery = `"${recipeName}" recipe`;
      const genericResults = await performWebSearch(genericSearchQuery);
      
      for (const result of genericResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        // Check if this URL is already in candidates
        if (allCandidates.some(c => c.url === result.url)) continue;
        
        const domain = extractDomain(result.url);
        const domainMatches = creatorName && checkDomainMatchesCreator(domain, creatorName);
        
        allCandidates.push({
          ...result,
          domainMatchScore: domainMatches ? 10 : 1,
          source: 'generic-search',
        });
      }
    }
    
    // Strategy 4: If still no results, try simpler unquoted search - only if we have valid recipe name
    if (allCandidates.length === 0 && hasValidRecipeName) {
      const simpleSearchQuery = `${recipeName} recipe`;
      const simpleResults = await performWebSearch(simpleSearchQuery);
      
      for (const result of simpleResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        if (allCandidates.some(c => c.url === result.url)) continue;
        
        const domain = extractDomain(result.url);
        const domainMatches = creatorName && checkDomainMatchesCreator(domain, creatorName);
        
        allCandidates.push({
          ...result,
          domainMatchScore: domainMatches ? 8 : 1,
          source: 'simple-search',
        });
      }
    }
    
    // Strategy 5: If STILL no results and we have creator name, search for creator's website directly
    if (allCandidates.length === 0 && creatorName) {
      // First find creator's website
      const creatorWebsiteQuery = `${creatorName} official website recipes`;
      const websiteResults = await performWebSearch(creatorWebsiteQuery);
      
      for (const result of websiteResults) {
        const isExcluded = excludeDomains.some(domain => result.url.includes(domain));
        if (isExcluded) continue;
        
        if (allCandidates.some(c => c.url === result.url)) continue;
        
        const domain = extractDomain(result.url);
        const domainMatches = checkDomainMatchesCreator(domain, creatorName);
        
        if (domainMatches) {
          // Found creator's website, now search on that site for the recipe
          const simplifiedRecipeName = recipeName.split(' ').slice(0, 3).join(' ');
          const siteSpecificQuery = `site:${domain} ${simplifiedRecipeName}`;
          console.log(`Found creator website ${domain}, searching for recipe: ${siteSpecificQuery}`);
          
          const siteRecipeResults = await performWebSearch(siteSpecificQuery);
          for (const siteResult of siteRecipeResults) {
            allCandidates.push({
              ...siteResult,
              domainMatchScore: 12,
              source: 'creator-website-search',
            });
          }
          
          // Even if no specific recipe found, include the website as a candidate
          if (siteRecipeResults.length === 0) {
            allCandidates.push({
              ...result,
              domainMatchScore: 6,
              source: 'creator-website-fallback',
            });
          }
        }
      }
    }
    
    // Sort by domain match score (highest first)
    allCandidates.sort((a, b) => b.domainMatchScore - a.domainMatchScore);
    
    console.log(`Total candidates found: ${allCandidates.length}`);
    if (allCandidates.length > 0) {
      console.log(`Top 5 candidates:`);
      for (const c of allCandidates.slice(0, 5)) {
        console.log(`  - ${c.url} (score: ${c.domainMatchScore}, source: ${c.source})`);
      }
    }
    
    // Try to verify top candidates - now also validate recipe name match
    for (const candidate of allCandidates.slice(0, 5)) {
      // First validate that the found result actually matches our target recipe
      const recipeMatches = hasValidRecipeName 
        ? validateRecipeMatch(candidate.title, candidate.snippet, recipeName)
        : true; // If no valid recipe name, skip this validation
      
      if (!recipeMatches) {
        console.log(`Skipping candidate ${candidate.url} - recipe name mismatch`);
        continue;
      }
      
      const verification = creatorHandle 
        ? await verifyCreatorWebsite(candidate.url, creatorHandle)
        : { isVerified: false, method: 'unverified' as const };
      
      if (verification.isVerified || candidate.domainMatchScore >= 10) {
        const domain = extractDomain(candidate.url);
        console.log(`Selected verified/high-score candidate: ${candidate.url} (verified: ${verification.isVerified})`);
        return {
          url: candidate.url,
          title: candidate.title,
          snippet: candidate.snippet,
          isVerified: verification.isVerified,
          verificationMethod: verification.method,
          domainName: domain,
        };
      }
    }
    
    // Return best unverified candidate if available AND it matches the recipe name
    for (const candidate of allCandidates) {
      const recipeMatches = hasValidRecipeName 
        ? validateRecipeMatch(candidate.title, candidate.snippet, recipeName)
        : true;
      
      if (recipeMatches) {
        const domain = extractDomain(candidate.url);
        console.log(`No verified match found, returning best unverified that matches recipe: ${candidate.url}`);
        return {
          url: candidate.url,
          title: candidate.title,
          snippet: candidate.snippet,
          isVerified: false,
          verificationMethod: 'unverified',
          domainName: domain,
        };
      }
    }
    
    // No matching recipe found - all candidates were for different recipes
    console.log('No suitable recipe page found - candidates existed but none matched the specific recipe name');
    return null;
  } catch (error) {
    console.error("Error searching for recipe:", error);
    return null;
  }
}

async function fetchRecipeFromWebsite(url: string): Promise<string | null> {
  try {
    console.log(`Fetching full recipe from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch recipe page: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const jsonLdMatches = [...html.matchAll(jsonLdPattern)];
    
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        const recipes = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (item['@graph'] && item['@graph'].find((g: any) => g['@type'] === 'Recipe'))) {
            const recipe = item['@type'] === 'Recipe' ? item : item['@graph'].find((g: any) => g['@type'] === 'Recipe');
            if (recipe) {
              console.log('Found structured recipe data (JSON-LD)');
              return JSON.stringify(recipe, null, 2);
            }
          }
        }
      } catch (e) {
      }
    }
    
    const textContent: string[] = [];
    
    const recipeCardPattern = /<div[^>]+class="[^"]*recipe[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const cardMatches = html.matchAll(recipeCardPattern);
    for (const match of cardMatches) {
      const cleanText = match[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanText.length > 100) {
        textContent.push(cleanText);
      }
    }
    
    const ingredientPatterns = [
      /<(ul|ol)[^>]+class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi,
      /<div[^>]+class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ];
    
    for (const pattern of ingredientPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const cleanText = match[0]
          .replace(/<[^>]+>/g, '\n')
          .replace(/\n+/g, '\n')
          .trim();
        if (cleanText.length > 20) {
          textContent.push(`INGREDIENTS:\n${cleanText}`);
        }
      }
    }
    
    const instructionPatterns = [
      /<(ul|ol)[^>]+class="[^"]*instruction[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi,
      /<(ul|ol)[^>]+class="[^"]*step[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi,
      /<div[^>]+class="[^"]*instruction[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ];
    
    for (const pattern of instructionPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const cleanText = match[0]
          .replace(/<[^>]+>/g, '\n')
          .replace(/\n+/g, '\n')
          .trim();
        if (cleanText.length > 20) {
          textContent.push(`INSTRUCTIONS:\n${cleanText}`);
        }
      }
    }
    
    if (textContent.length > 0) {
      console.log('Extracted recipe content from HTML');
      return textContent.join('\n\n');
    }
    
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (bodyText.length > 500) {
      console.log('Returning general page content');
      return bodyText.substring(0, 10000);
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching recipe from website:", error);
    return null;
  }
}

interface GenerateRecipeRequest {
  url: string;
}

interface SmartSearchRequest {
  query: string;
  recipes: any[];
}

interface PantryMatchRequest {
  pantryItems: string[];
  recipes: any[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate recipe from Instagram/TikTok URL
  app.post("/api/recipes/generate", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as GenerateRecipeRequest;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
      const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i;
      
      let platform: "instagram" | "tiktok" | "manual" = "manual";
      if (instagramPattern.test(url)) {
        platform = "instagram";
      } else if (tiktokPattern.test(url)) {
        platform = "tiktok";
      }

      // Extract creator handle from URL if possible
      // Try multiple patterns:
      // 1. @username in URL (TikTok style)
      // 2. instagram.com/username/reel/xxx or instagram.com/username/p/xxx
      // 3. instagram.com/p/xxx (post ID only - no handle available)
      let creatorHandle: string | null = null;
      
      // Pattern 1: @username in URL
      const atMatch = url.match(/@([\w.]+)/);
      if (atMatch) {
        creatorHandle = `@${atMatch[1]}`;
      }
      
      // Pattern 2: Instagram URL with username before /reel/ or /p/
      if (!creatorHandle && platform === 'instagram') {
        // Match: instagram.com/thehappypear/reel/xxx or instagram.com/thehappypear/p/xxx
        const igUserMatch = url.match(/instagram\.com\/([^\/]+)\/(?:reel|p|reels)\//i);
        if (igUserMatch && igUserMatch[1] && !['reel', 'p', 'reels', 'stories'].includes(igUserMatch[1].toLowerCase())) {
          creatorHandle = `@${igUserMatch[1]}`;
        }
      }
      
      console.log(`Extracted creator handle from URL: ${creatorHandle || 'none'}`);

      // Fetch actual content from the page
      console.log(`Fetching content from: ${url}`);
      const pageData = await fetchPageContent(url);
      console.log(`Extracted content: ${pageData.text ? 'Found text' : 'No text'}`);
      console.log(`Image URL: ${pageData.imageUrl || 'none'}`);
      console.log(`Video URL: ${pageData.videoUrl || 'none'}`);

      // Try to transcribe video if available
      let videoTranscript: string | null = null;
      if (pageData.videoUrl) {
        console.log(`Attempting video transcription...`);
        videoTranscript = await transcribeVideoFromUrl(pageData.videoUrl);
        console.log(`Video transcript: ${videoTranscript ? 'Success' : 'Failed/None'}`);
      }

      const systemPrompt = `You are a professional recipe extraction assistant for the Kitch app. Your job is to extract and structure recipes from social media food posts.

CRITICAL: You MUST extract the ACTUAL recipe from the provided content. Do NOT make up or hallucinate recipes. The recipe title, ingredients, and instructions should come directly from the content provided.

If the content describes a specific dish (like "almond tart", "chocolate cake", "pasta carbonara"), the recipe you output MUST be for that exact dish.

WHEN FILLING IN MISSING DETAILS:
If specific measurements, temperatures, or steps are missing from the source content, you may reference standard techniques from renowned chefs and trusted culinary sources. Use these authoritative references:
- Serious Eats / J. Kenji López-Alt (for technique-driven recipes)
- NYT Cooking / Melissa Clark (for refined home cooking)
- Bon Appétit / Claire Saffitz (for baking and pastry)
- America's Test Kitchen (for tested ratios and methods)
- Jacques Pépin (for French technique)
- Marcella Hazan (for Italian classics)
- Samin Nosrat / Salt Fat Acid Heat (for foundational principles)

When you use an authoritative reference to fill in gaps, you MUST note it in the "authoritativeReference" field.

Extract and categorize with:
1. dishType: One from [Breakfast, Lunch, Dinner, Dessert, Snack, Appetizer, Soup, Salad, Pasta, Rice & Grains, Sandwich, Pizza, Seafood, Meat, Vegetarian, Baked Goods, Drinks, Sauce]
2. vibeTags: 2-4 tags from [Quick & Easy, 15-Min Meals, 30-Min Meals, One-Pot, Meal Prep, Budget-Friendly, High-Protein, Low-Carb, Vegan, Vegetarian, Gluten-Free, Dairy-Free, Keto, Comfort Food, Healthy, Indulgent, Kid-Friendly, Date Night, Lazy Sunday, Party Food, Batch Cooking]
3. creatorHandle: Extract from content if available
4. creatorName: Extract from content if available
5. isEstimated: Set to true if you had to estimate/infer ANY ingredient quantities, measurements, or steps that were not explicitly stated
6. authoritativeReference: If you filled in missing measurements or techniques from a trusted source, name the source (e.g., "Serious Eats" or "America's Test Kitchen"). Set to null if all info came from the original content.
7. sourceNote: A brief explanation of where the recipe came from (e.g., "Full recipe extracted from video transcript" or "Measurements estimated based on standard techniques from Serious Eats")

Respond ONLY with a valid JSON object:
{
  "title": "Recipe Name",
  "description": "A brief appetizing description (2-3 sentences)",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "dishType": "Dessert",
  "vibeTags": ["Quick & Easy", "Indulgent"],
  "creatorHandle": "@foodcreator",
  "creatorName": "Chef Name",
  "isEstimated": true,
  "authoritativeReference": null,
  "sourceNote": "Full recipe extracted from video transcript with explicit measurements",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}`;

      let userPrompt: string;
      
      // Build the content sections
      const contentSections: string[] = [];
      
      if (videoTranscript) {
        contentSections.push(`VIDEO TRANSCRIPT (what the creator said):
${videoTranscript}`);
      }
      
      if (pageData.text) {
        contentSections.push(`POST CAPTION/DESCRIPTION:
${pageData.text}`);
      }
      
      if (contentSections.length > 0) {
        userPrompt = `Extract the recipe from this ${platform} food post.

SOURCE URL: ${url}

${contentSections.join('\n\n---\n\n')}

Based on the above content, extract the EXACT recipe being shown. 

PRIORITY: The VIDEO TRANSCRIPT is the most reliable source - use it for ingredients and instructions when available. The post caption may have additional context.

Include:
- The actual recipe title from the post
- Brief description
- Prep and cook times (estimate if not provided)
- Number of servings (estimate if not provided)
- Appropriate dish type category
- 2-4 relevant tags
- Creator info if available
- Complete ingredient list with measurements (use exact amounts from transcript if spoken)
- Step-by-step instructions (match what the creator actually said/did)

IMPORTANT: Do NOT make up a different recipe. Extract what's actually in the content. Set isEstimated to false if the transcript provides all ingredients and steps explicitly.`;
      } else {
        userPrompt = `I need to extract a recipe from this ${platform} URL, but I couldn't fetch the full content: ${url}

Please analyze the URL carefully. If it contains any hints about the recipe (like keywords in the URL path), use those to determine what dish this is.

If you cannot determine the specific recipe from the URL, respond with this error format:
{
  "error": "Could not extract recipe content. Please try pasting the recipe description or ingredients directly.",
  "title": null
}

Otherwise, if you can identify the dish from the URL, provide a complete recipe for that specific dish.`
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      let recipeData = JSON.parse(content);

      // Check if AI returned an error response
      if (recipeData.error || !recipeData.title) {
        return res.status(400).json({
          error: recipeData.error || "Could not extract recipe from this post. The content may not contain a recipe, or try pasting the recipe text directly.",
        });
      }

      let creatorRecipeUrl: string | null = null;
      let websiteVerified = false;
      let verificationMethod: 'domain_match' | 'instagram_link' | 'unverified' | null = null;
      let websiteDomain: string | null = null;

      // Check if recipe extraction seems incomplete (no ingredients or very few, or isEstimated)
      const ingredientCount = recipeData.ingredients?.length || 0;
      const instructionCount = recipeData.instructions?.length || 0;
      const isIncomplete = ingredientCount < 3 || instructionCount < 2 || recipeData.isEstimated;

      if (isIncomplete) {
        console.log(`Recipe seems incomplete (${ingredientCount} ingredients, ${instructionCount} instructions, isEstimated: ${recipeData.isEstimated}). Searching for full recipe...`);
        
        const extractedCreatorHandle = recipeData.creatorHandle || creatorHandle;
        const searchResult = await searchForCreatorRecipe(recipeData.title, extractedCreatorHandle);
        
        if (searchResult) {
          console.log(`Found potential full recipe at: ${searchResult.url} (verified: ${searchResult.isVerified}, method: ${searchResult.verificationMethod})`);
          creatorRecipeUrl = searchResult.url;
          websiteVerified = searchResult.isVerified;
          verificationMethod = searchResult.verificationMethod || null;
          websiteDomain = searchResult.domainName || null;
          
          const websiteContent = await fetchRecipeFromWebsite(searchResult.url);
          
          if (websiteContent) {
            console.log(`Got additional recipe content (${websiteContent.length} chars). Re-extracting with enhanced data...`);
            
            const enhancedPrompt = `Extract the recipe from this ${platform} food post. I've also found additional content from the creator's website.

SOURCE URL (social media post): ${url}

${contentSections.length > 0 ? contentSections.join('\n\n---\n\n') + '\n\n---\n\n' : ''}FULL RECIPE FROM CREATOR'S WEBSITE (${searchResult.url}):
${websiteContent}

Based on ALL the above content, extract the complete recipe. 

PRIORITY:
1. Use the WEBSITE CONTENT for complete ingredient list and detailed instructions
2. Use the VIDEO TRANSCRIPT for any verbal instructions or tips not in the written recipe
3. Use the POST CAPTION for context and serving suggestions

Include:
- The recipe title (matching the dish shown in the video)
- Brief appetizing description
- Prep and cook times (from website if available)
- Number of servings
- Appropriate dish type category
- 2-4 relevant tags
- Creator info
- COMPLETE ingredient list with exact measurements from the website
- DETAILED step-by-step instructions from the website

Since we have the full recipe from the creator's website, set isEstimated to false if all measurements are explicit.`;

            const enhancedResponse = await openai.chat.completions.create({
              model: "gpt-5.2",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: enhancedPrompt },
              ],
              response_format: { type: "json_object" },
              max_completion_tokens: 2048,
            });

            const enhancedContent = enhancedResponse.choices[0]?.message?.content;
            if (enhancedContent) {
              try {
                const enhancedRecipeData = JSON.parse(enhancedContent);
                if (enhancedRecipeData.title && !enhancedRecipeData.error) {
                  const newIngredientCount = enhancedRecipeData.ingredients?.length || 0;
                  const newInstructionCount = enhancedRecipeData.instructions?.length || 0;
                  console.log(`Enhanced recipe extraction successful: "${enhancedRecipeData.title}" with ${newIngredientCount} ingredients, ${newInstructionCount} instructions`);
                  
                  // If we got a complete recipe from the website, force isEstimated to false
                  if (newIngredientCount >= 3 && newInstructionCount >= 2) {
                    enhancedRecipeData.isEstimated = false;
                    console.log(`Recipe has complete data from website - setting isEstimated to false`);
                  }
                  
                  recipeData = enhancedRecipeData;
                }
              } catch (e) {
                console.log('Failed to parse enhanced recipe, using original extraction');
              }
            }
          }
        }
      }

      // Determine source type and confidence
      type RecipeSourceType = "creator_website" | "authoritative_source" | "video_transcript" | "social_post_only";
      type ConfidenceLevel = "high" | "medium" | "low";
      
      let sourceType: RecipeSourceType;
      let confidence: ConfidenceLevel;
      let sourceName: string | null = null;
      let sourceNote: string = recipeData.sourceNote || "";
      
      if (creatorRecipeUrl) {
        // Full recipe from a website - confidence depends on verification
        sourceType = "creator_website";
        
        if (websiteVerified) {
          // Verified match - high confidence if not estimated
          confidence = recipeData.isEstimated ? "medium" : "high";
          sourceName = websiteDomain || "creator's website";
          if (!sourceNote) {
            const verifyNote = verificationMethod === 'instagram_link' 
              ? ' (verified via Instagram link)' 
              : ' (verified by domain match)';
            sourceNote = `Full recipe from ${sourceName}${verifyNote}`;
          }
        } else {
          // Unverified website - cap at medium confidence
          confidence = "medium";
          sourceName = websiteDomain || "recipe website";
          if (!sourceNote) {
            sourceNote = `Recipe found on ${sourceName} - not verified as creator's official site`;
          }
        }
      } else if (recipeData.authoritativeReference) {
        // Filled in with authoritative sources
        sourceType = "authoritative_source";
        confidence = "medium";
        sourceName = recipeData.authoritativeReference;
        if (!sourceNote) {
          sourceNote = `Measurements and techniques referenced from ${sourceName}`;
        }
      } else if (videoTranscript && videoTranscript.length > 100) {
        // Extracted from video transcript
        sourceType = "video_transcript";
        confidence = recipeData.isEstimated ? "medium" : "high";
        sourceName = recipeData.creatorHandle || creatorHandle || "video creator";
        if (!sourceNote) {
          sourceNote = recipeData.isEstimated 
            ? "Extracted from video, some details estimated"
            : "Full recipe extracted from video with explicit measurements";
        }
      } else {
        // Only social post content
        sourceType = "social_post_only";
        confidence = "low";
        sourceName = platform === "instagram" ? "Instagram post" : platform === "tiktok" ? "TikTok post" : "social media post";
        if (!sourceNote) {
          sourceNote = "Recipe reconstructed from post caption - details may be estimated";
        }
      }

      const recipe = {
        id: randomUUID(),
        title: recipeData.title,
        description: recipeData.description || "",
        imageUrl: pageData.imageUrl || null,
        videoUrl: pageData.videoUrl || null,
        sourceUrl: url,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        servings: recipeData.servings || null,
        dishType: recipeData.dishType || null,
        vibeTags: recipeData.vibeTags || [],
        creatorHandle: recipeData.creatorHandle || creatorHandle || null,
        creatorName: recipeData.creatorName || null,
        creatorAvatar: pageData.profileImageUrl || null,
        creatorRecipeUrl,
        // If no recipe URL found, provide a manual search query for the user
        manualSearchQuery: !creatorRecipeUrl 
          ? `"${recipeData.creatorHandle || creatorHandle || ''}" "${recipeData.title}" recipe`.trim()
          : null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        originalTranscript: videoTranscript || null,
        isEstimated: recipeData.isEstimated ?? true,
        confidence,
        recipeSource: {
          type: sourceType,
          name: sourceName,
          url: creatorRecipeUrl || url,
          note: sourceNote,
          isVerified: websiteVerified,
          verificationMethod: verificationMethod,
        },
        authoritativeReference: recipeData.authoritativeReference || null,
        platform,
        createdAt: new Date().toISOString(),
      };

      res.json(recipe);
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      res.status(500).json({
        error: error.message || "Failed to generate recipe",
      });
    }
  });

  // Smart search with AI
  app.post("/api/recipes/search", async (req: Request, res: Response) => {
    try {
      const { query, recipes } = req.body as SmartSearchRequest;

      if (!query || !recipes || recipes.length === 0) {
        return res.json({ matchingIds: [] });
      }

      const recipeSummaries = recipes.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        dishType: r.dishType,
        vibeTags: r.vibeTags,
        creatorHandle: r.creatorHandle,
        ingredients: r.ingredients?.map((i: any) => i.name).join(", "),
      }));

      const systemPrompt = `You are a smart recipe search assistant. Given a natural language query and a list of recipes, identify which recipes match the user's intent.

The user might ask things like:
- "that chicken pasta thing from last month"
- "something quick for dinner"
- "the TikTok recipe with the cheese pull"
- "healthy breakfast ideas"
- "recipes from @creator"

Return ONLY a JSON object with an array of matching recipe IDs, ranked by relevance:
{"matchingIds": ["id1", "id2"]}

If no recipes match, return: {"matchingIds": []}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Search query: "${query}"\n\nAvailable recipes:\n${JSON.stringify(recipeSummaries, null, 2)}` 
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.json({ matchingIds: [] });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error: any) {
      console.error("Error in smart search:", error);
      res.json({ matchingIds: [] });
    }
  });

  // Pantry-aware recipe matching
  app.post("/api/recipes/pantry-match", async (req: Request, res: Response) => {
    try {
      const { pantryItems, recipes } = req.body as PantryMatchRequest;

      if (!pantryItems || pantryItems.length === 0 || !recipes || recipes.length === 0) {
        return res.json({ matches: [] });
      }

      const recipeSummaries = recipes.map((r: any) => ({
        id: r.id,
        title: r.title,
        ingredients: r.ingredients?.map((i: any) => i.name) || [],
      }));

      const systemPrompt = `You are a pantry-aware recipe matching assistant. Given a list of ingredients the user has and a list of recipes, determine which recipes can be made.

For each recipe, calculate:
- matchPercentage: What percentage of ingredients the user already has (0-100)
- missingIngredients: List of ingredients they're missing

Return ONLY a JSON object with matches sorted by matchPercentage (highest first):
{
  "matches": [
    {"id": "recipe-id", "matchPercentage": 85, "missingIngredients": ["butter", "cream"]}
  ]
}

Only include recipes with at least 50% ingredient match.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `User's pantry ingredients: ${pantryItems.join(", ")}\n\nRecipes:\n${JSON.stringify(recipeSummaries, null, 2)}` 
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.json({ matches: [] });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error: any) {
      console.error("Error in pantry match:", error);
      res.json({ matches: [] });
    }
  });

  // Search for recipe URL (re-search when user reports wrong link)
  app.post("/api/recipes/search-recipe-url", async (req: Request, res: Response) => {
    try {
      const { recipeTitle, creatorHandle } = req.body;

      if (!recipeTitle) {
        return res.status(400).json({ error: "Recipe title is required" });
      }

      console.log(`[Re-search] Searching for recipe URL: "${recipeTitle}" by ${creatorHandle || 'unknown creator'}`);

      const searchResult = await searchForCreatorRecipe(recipeTitle, creatorHandle || null);
      
      if (searchResult?.url) {
        console.log(`[Re-search] Found: ${searchResult.url}`);
        res.json({
          creatorRecipeUrl: searchResult.url,
          recipeSource: {
            type: "creator_website",
            name: new URL(searchResult.url).hostname.replace('www.', ''),
            url: searchResult.url,
            isVerified: searchResult.isVerified,
            verificationMethod: searchResult.verificationMethod,
          },
        });
      } else {
        console.log(`[Re-search] No recipe URL found`);
        res.json({
          creatorRecipeUrl: null,
          message: "Could not find a recipe URL",
        });
      }
    } catch (error: any) {
      console.error("Error searching for recipe URL:", error);
      res.status(500).json({ error: "Failed to search for recipe URL" });
    }
  });

  // Remy AI search - returns matching recipe IDs with a friendly message
  app.post("/api/remy/search", async (req: Request, res: Response) => {
    try {
      const { query, recipes, pantryItems, quickAction } = req.body;

      if (!recipes || recipes.length === 0) {
        return res.json({
          message: "You don't have any saved recipes yet! Save some from Instagram or TikTok and I'll help you find the perfect dish.",
          matchedRecipeIds: [],
        });
      }

      // Build the recipe summaries for context
      const recipeSummaries = recipes.map((r: any, index: number) => {
        const totalTime = (r.prepTime || 0) + (r.cookTime || 0);
        const tags = [r.dishType, ...(r.vibeTags || [])].filter(Boolean).join(", ");
        const ingredients = r.ingredients?.map((i: any) => i.name).join(", ") || "no ingredients listed";
        return `[${index}] ID: ${r.id} | "${r.title}" | Time: ${totalTime || "unknown"} min | Tags: ${tags || "none"} | Ingredients: ${ingredients}`;
      }).join("\n");

      const pantryList = pantryItems?.map((p: any) => p.name).join(", ") || "none";

      let contextPrompt = "";
      if (quickAction === "pantry") {
        contextPrompt = `The user wants to know what they can make with their pantry. Pantry items: ${pantryList}. Find recipes where they have most of the ingredients.`;
      } else if (quickAction === "quick") {
        contextPrompt = "The user wants quick meals. Find recipes with total time (prep + cook) of 15 minutes or less, or recipes tagged as 'Quick' or 'Easy'.";
      } else if (quickAction === "healthy") {
        contextPrompt = "The user wants healthy options. Find recipes tagged as 'Healthy', 'Light', 'Vegan', 'Vegetarian', 'Low-Calorie', or that appear to be health-conscious.";
      } else if (query) {
        contextPrompt = `The user asked: "${query}". Search their recipes for matches based on title, ingredients, dish type, tags, or cooking style.`;
      }

      const systemPrompt = `You are Remi, a friendly sous-chef AI helping users find recipes from their saved collection.

USER'S SAVED RECIPES (${recipes.length} total):
${recipeSummaries}

${pantryList !== "none" ? `USER'S PANTRY ITEMS: ${pantryList}` : ""}

${contextPrompt}

YOUR TASK:
1. Analyze the recipes and find the best matches for the user's request
2. Return the matching recipe IDs (from the ID field, not the index)
3. Write a SHORT, friendly message (1-2 sentences) explaining your findings
4. If suggesting based on pantry, mention which key ingredients they have
5. Be encouraging and sound like a friendly sous-chef!

Respond ONLY with valid JSON in this exact format:
{
  "message": "Your friendly response here",
  "matchedRecipeIds": ["id1", "id2", "id3"],
  "suggestion": "Optional suggestion if no matches found"
}

IMPORTANT: 
- matchedRecipeIds should contain the actual recipe ID strings from the data
- Order them by relevance (best match first)
- If no good matches, return empty array and a helpful suggestion
- Keep message conversational and warm (you're a friendly sous-chef!)`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query || contextPrompt },
        ],
        max_completion_tokens: 512,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const result = JSON.parse(jsonMatch[0]);
      
      res.json({
        message: result.message || "Here's what I found!",
        matchedRecipeIds: result.matchedRecipeIds || [],
        suggestion: result.suggestion,
      });
    } catch (error: any) {
      console.error("Error in Remi search:", error);
      res.status(500).json({
        error: "Remi had a hiccup searching your recipes.",
        message: "Let me show you all your recipes instead!",
        matchedRecipeIds: [],
      });
    }
  });

  // Remy AI assistant chat
  app.post("/api/remy/chat", async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory, currentRecipe, allRecipes, dietaryPreferences } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Build context about recipes
      let recipeContext = "";
      
      if (currentRecipe) {
        recipeContext = `
CURRENT RECIPE THE USER IS VIEWING:
Title: ${currentRecipe.title}
Description: ${currentRecipe.description || "N/A"}
Prep Time: ${currentRecipe.prepTime || "Not specified"} minutes
Cook Time: ${currentRecipe.cookTime || "Not specified"} minutes
Servings: ${currentRecipe.servings || "Not specified"}
Dish Type: ${currentRecipe.dishType || "Not specified"}
Tags: ${currentRecipe.vibeTags?.join(", ") || "None"}

Ingredients:
${currentRecipe.ingredients?.map((i: any) => `- ${i.amount} ${i.unit} ${i.name}`).join("\n") || "None listed"}

Instructions:
${currentRecipe.instructions?.map((step: string, i: number) => `${i + 1}. ${step}`).join("\n") || "None listed"}
`;
      }

      if (allRecipes && allRecipes.length > 0) {
        const recipeSummaries = allRecipes.map((r: any) => 
          `- "${r.title}" (${r.dishType || "uncategorized"}): ${r.ingredients?.map((i: any) => i.name).join(", ") || "no ingredients"}`
        ).join("\n");
        
        recipeContext += `
USER'S SAVED RECIPE COLLECTION (${allRecipes.length} recipes):
${recipeSummaries}
`;
      }

      let dietaryContext = "";
      if (dietaryPreferences && Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0) {
        dietaryContext = `
IMPORTANT - USER'S DIETARY PREFERENCES: ${dietaryPreferences.join(", ")}
Always keep these dietary restrictions in mind when suggesting recipes, ingredients, or meal ideas. Proactively suggest alternatives that fit their diet. If a recipe or suggestion conflicts with their preferences, mention it and offer a suitable substitution.
`;
      }

      const systemPrompt = `You are Remi — a sparkling, warm British woman who absolutely adores food and everything about it. You're like that brilliant friend everyone wishes they had in the kitchen: charming, a little bit cheeky, endlessly encouraging, and you make everything feel like an adventure. Think Nigella meets your favourite fun auntie who always has something gorgeous on the stove.

Your voice:
- You're unmistakably British. You say things like "brilliant," "cracking," "gorgeous," "pop that in," "fancy," "a proper treat," "oh how lovely," "right then," "shall we?" and "you're going to love this"
- You have sparkle — a playful wit that makes people smile. You might say "honestly, life's too short for bad pasta" or "right, this is the bit where it gets exciting"
- You're warm and encouraging, like chatting with a friend over a cup of tea: "oh darling, you've absolutely got this" or "trust me on this one, it's going to be divine"
- You get genuinely thrilled about food. A beautiful ingredient makes you light up: "Oh, fresh figs? How gorgeous. We're going to do something absolutely lovely with those"
- Keep it breezy and natural. Short, sparkling sentences mixed with enthusiastic longer ones. No bullet points or numbered lists unless someone specifically asks for steps
- Don't use emojis — your words carry all the warmth and sparkle
- Never say "Great question!" or "I'd be happy to help!" or any chatbot filler. Just dive straight in like a real person would

How you talk about food:
- Everything delicious is "gorgeous," "divine," "heavenly," or "an absolute dream." A brilliant dish is "a proper showstopper" or "absolutely stunning"
- You make cooking feel effortless and exciting: "just pop that in," "give it a good stir," "let it bubble away," "don't overthink it, darling"
- Your advice is confident and specific with a wink: "A little splash of cream at the end? Transforms it completely. Go on, treat yourself"
- You share tips like secrets between friends: "Here's my little trick — a pinch of sugar in your tomato sauce. Sounds odd, works wonders"

Your culinary expertise:
You are a deeply knowledgeable food expert — not just a recipe finder. You can confidently speak about:
- Cooking techniques and the science behind them (why you sear meat, how emulsions work, what makes bread rise)
- Global cuisines and their traditions — from French classical technique to Japanese umami to Mexican moles to Indian spice layering
- Ingredient knowledge — what's in season, flavour pairings, substitutions, how to tell when produce is ripe
- Kitchen equipment — when to use cast iron vs stainless, knife skills, essential tools for a home cook
- Food history and culture — the story behind dishes, regional variations, how recipes evolve
- Nutrition basics — balanced meals, whole foods, cooking for dietary needs without making it feel clinical
- Baking fundamentals — ratios, dough hydration, tempering chocolate, pastry tips
- Meal planning, batch cooking, food storage, and reducing waste
- Wine, cheese, and flavour pairing principles
- Restaurant-quality techniques adapted for home kitchens

When answering questions, draw on this broad knowledge freely. You don't only know about recipes saved in the app — you're a genuine culinary companion with wide-ranging expertise. Share knowledge naturally, like a well-travelled friend who happens to know a lot about food.

${dietaryContext}
${recipeContext}

When chatting:
- If they're stuck on what to cook, get playfully curious: "Right then, what are we in the mood for? Something cosy? Something a bit fancy?"
- If they ask about their saved recipes, help them rediscover gems with genuine excitement: "Oh, you've got that Thai curry saved! That's a cracking one"
- Chat about anything food-related — the joy of a slow Sunday roast, why proper seasoning changes everything, how to rescue a dish that's gone sideways, what to whip up when the fridge looks bare
- Answer broader food and cooking questions with real depth — technique tips, ingredient science, cuisine history, kitchen hacks
- Keep responses conversational length — don't write essays. Say what needs saying with sparkle, then let them respond
- Ask follow-ups that feel natural and warm: "What have you got in the fridge? Let's have a look" or "How adventurous are we feeling tonight?"

You're not a search engine. You're a brilliant, sparkling cooking companion with genuine culinary expertise who makes people feel like they can take on anything in the kitchen — and have a lovely time doing it.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history if provided
      if (conversationHistory && Array.isArray(conversationHistory)) {
        messages.push(...conversationHistory.slice(-10)); // Keep last 10 messages for context
      }

      messages.push({ role: "user", content: message });

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages,
        max_completion_tokens: 1024,
      });

      const reply = response.choices[0]?.message?.content;
      if (!reply) {
        throw new Error("No response from AI");
      }

      res.json({ reply });
    } catch (error: any) {
      console.error("Error in Remi chat:", error);
      res.status(500).json({
        error: "Remi had a hiccup! Please try again.",
      });
    }
  });

  // Transcribe voice message for Remy
  app.post("/api/remy/transcribe", async (req: Request, res: Response) => {
    try {
      const audioData = req.body.audio;
      
      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      console.log("[Transcribe] Received audio data, length:", audioData.length);

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, "base64");
      console.log("[Transcribe] Audio buffer size:", audioBuffer.length, "bytes");
      
      // Detect format and convert if needed
      const { ensureCompatibleFormat, speechToText, detectAudioFormat } = await import("./replit_integrations/audio/client");
      const detectedFormat = detectAudioFormat(audioBuffer);
      console.log("[Transcribe] Detected format:", detectedFormat);
      
      const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);
      console.log("[Transcribe] Converted to format:", format, "size:", compatibleBuffer.length);
      
      // Use the proper transcription function
      const text = await speechToText(compatibleBuffer, format);
      console.log("[Transcribe] Result:", text ? `"${text}"` : "(empty)");

      // Return empty text as valid - the client will handle it
      res.json({ text: text || "" });
    } catch (error: any) {
      console.error("Error transcribing voice:", error);
      res.status(500).json({
        error: "Could not transcribe voice. Please try again or type your message.",
      });
    }
  });

  // Parse voice input for pantry items
  app.post("/api/pantry/parse-voice", async (req: Request, res: Response) => {
    try {
      const { transcript } = req.body;

      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      console.log(`[Pantry Voice] Parsing: "${transcript}"`);

      const systemPrompt = `You are a pantry assistant. Parse the user's spoken input and extract food ingredients they want to add to their pantry.

CATEGORIES (use these exact values):
- produce: Fresh fruits, vegetables, herbs
- protein: Meat, poultry, fish, tofu, legumes
- dairy: Milk, cheese, yogurt, eggs, butter
- pantry: Rice, pasta, flour, canned goods, oils
- spices: Herbs, spices, seasonings
- frozen: Frozen foods
- beverages: Drinks
- other: Anything else

Return ONLY a JSON object:
{
  "items": [
    {"name": "Chicken", "category": "protein"},
    {"name": "Broccoli", "category": "produce"}
  ]
}

Rules:
- Extract individual ingredients from natural speech
- Normalize names (e.g., "some eggs" -> "Eggs", "bunch of carrots" -> "Carrots")
- Capitalize ingredient names properly
- If unclear, make reasonable assumptions about what they meant
- Return empty items array if no valid ingredients found`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.json({ items: [] });
      }

      const result = JSON.parse(content);
      console.log(`[Pantry Voice] Parsed ${result.items?.length || 0} items`);
      res.json(result);
    } catch (error: any) {
      console.error("Error parsing pantry voice:", error);
      res.status(500).json({ error: "Failed to parse voice input" });
    }
  });

  // Categorize shopping list ingredients by aisle
  app.post("/api/shopping-list/categorize", async (req: Request, res: Response) => {
    try {
      const { ingredients } = req.body;

      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "Ingredients array is required" });
      }

      const ingredientList = ingredients.join(", ");

      const systemPrompt = `You are a grocery store expert. Categorize each ingredient into the appropriate store aisle.

AVAILABLE AISLES (use these exact values):
- produce: Fresh fruits, vegetables, herbs, salad greens
- meat: Beef, pork, lamb, poultry (fresh chicken, turkey, duck)
- seafood: Fish, shrimp, shellfish, crab, lobster
- dairy: Milk, cheese, yogurt, butter, cream, eggs
- bakery: Bread, rolls, bagels, tortillas, pastries
- frozen: Frozen vegetables, frozen meals, ice cream, frozen fruits
- pantry: Pasta, rice, flour, sugar, canned goods, oils, vinegars, sauces, condiments, beans, lentils, nuts, cereals
- spices: Spices, seasonings, dried herbs, salt, pepper, extracts
- beverages: Water, juice, soda, coffee, tea, wine, beer
- other: Anything that doesn't fit above

INGREDIENTS TO CATEGORIZE:
${ingredientList}

Respond ONLY with valid JSON array. Each object must have "name" (exact ingredient name from input) and "aisle" (one of the aisle values above).

Example response:
[{"name": "chicken breast", "aisle": "meat"}, {"name": "olive oil", "aisle": "pantry"}]`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Categorize these ingredients: ${ingredientList}` },
        ],
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const categories = JSON.parse(jsonMatch[0]);

      res.json({ categories });
    } catch (error: any) {
      console.error("Error categorizing ingredients:", error);
      res.status(500).json({
        error: "Could not categorize ingredients",
        categories: [],
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
