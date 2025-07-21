const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const cheerio = require("cheerio");

const {
  extractEmail,
  extractPhone,
  extractAddress,
  extractTagline,
  extractFoundedYear,
  extractSocialLinks,
  detectSentiment,
  extractTechStack,
  extractServices,
  extractIndustries,
  extractTeamInfo,
  extractSocialProof,
} = require("../utils/extractors");

const { calculateMetaScore, getProfileGrade } = require("../utils/scoring");

async function scrapeCompanyData(url) {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-http2"],
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const raw = await page.evaluate(() => {
      const extractText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : null;
      };

      const allLinks = Array.from(document.querySelectorAll("a")).map(
        (a) => a.href
      );
      const internalLinks = allLinks
        .filter((href) =>
          /(about|contact|support|help|faq|team|info)/i.test(href)
        )
        .slice(0, 5);

      const mailtoLinks = Array.from(
        document.querySelectorAll('a[href^="mailto:"]')
      ).map((a) => a.href);
      const telLinks = Array.from(
        document.querySelectorAll('a[href^="tel:"]')
      ).map((a) => a.href);

      const socialRaw = allLinks.filter((href) =>
        /facebook\.com|instagram\.com|linkedin\.com|twitter\.com|youtube\.com/i.test(
          href
        )
      );

      const bodyText = document.body.innerText;
      const scriptSources = Array.from(document.querySelectorAll("script"))
        .map((s) => s.src)
        .filter(Boolean);

      return {
        name:
          extractText("h1") ||
          extractText(".company-name") ||
          extractText(".hero-title"),
        website: window.location.href,
        rawText: bodyText,
        rawLinks: allLinks,
        internalLinks,
        socialLinksRaw: socialRaw,
        mailtoLinks,
        telLinks,
        rawScripts: scriptSources,
        address: extractText("address") || extractText(".location") || null,
        html: document.documentElement.innerHTML,
      };
    });

    let extraText = "";
    for (const link of raw.internalLinks) {
      try {
        await page.goto(link, {
          waitUntil: "networkidle2",
          timeout: 15000,
        });
        await page.waitForTimeout(1000);
        extraText += await page.evaluate(() => document.body.innerText || "");
      } catch {
        console.warn(`[SKIP] Could not fetch ${link}`);
      }
    }

    const combinedText = raw.rawText + "\n" + extraText;
    const combinedLower = combinedText.toLowerCase();
    const $ = cheerio.load(raw.html);

    // Fallback email/phone from link attributes
    const emailFallback = raw.mailtoLinks
      .map((mail) => mail.replace("mailto:", ""))
      .find((e) => e.includes("@"));
    const phoneFallback = raw.telLinks
      .map((tel) => tel.replace("tel:", ""))
      .find((p) => /\d{5,}/.test(p));

    const cleaned = {
      name: raw.name,
      website: raw.website,
      email: extractEmail(combinedText) || emailFallback,
      phone: extractPhone(combinedText) || phoneFallback,
      address: raw.address || extractAddress(combinedText),
      foundedYear: extractFoundedYear(combinedText),
      tagline: extractTagline($),
      socialLinks: extractSocialLinks(raw.socialLinksRaw),
      sentiment: detectSentiment(combinedText),
      techStack: extractTechStack(raw.rawScripts, combinedText),
      services: extractServices(combinedText),
      industries: extractIndustries(combinedText),
      teamInfo: extractTeamInfo(combinedText),
      socialProof: extractSocialProof(combinedText),
    };

    // Fallback name from <title>
    if (!cleaned.name) {
      const metaTitle = $("title").text().trim();
      cleaned.name = metaTitle.split("-")[0].trim();
    }

    // Fallback founded year
    if (!cleaned.foundedYear) {
      const yearMatch = combinedLower.match(
        /founded (in|on)? (\d{4})|established (\d{4})/
      );
      cleaned.foundedYear = yearMatch ? yearMatch[2] || yearMatch[3] : null;
    }

    // Fallback tech stack from scripts
    if (!cleaned.techStack || cleaned.techStack.length === 0) {
      cleaned.techStack = raw.rawScripts.filter((src) =>
        /(cloudflare|react|angular|vue|gtag|google-analytics|jquery)/i.test(src)
      );
    }

    // Fallback social links if extractor returned empty
    if (!cleaned.socialLinks || cleaned.socialLinks.length === 0) {
      cleaned.socialLinks = raw.socialLinksRaw;
    }

    // Debug log
    const missing = Object.entries(cleaned)
      .filter(
        ([_, val]) => val === null || (Array.isArray(val) && val.length === 0)
      )
      .map(([key]) => key);

    if (missing.length) {
      console.warn(`[DEBUG] Missing fields from ${cleaned.website}:`, missing);
    }

    cleaned.metaScore = calculateMetaScore(cleaned);

    await browser.close();
    // Clean output by removing nulls and empty arrays
    for (const [key, val] of Object.entries(cleaned)) {
      if (val === null || (Array.isArray(val) && val.length === 0)) {
        delete cleaned[key];
      }
    }
    return cleaned;
  } catch (err) {
    console.error(`Scraping failed for ${url}:`, err.message);
    return null;
  }
}

module.exports = scrapeCompanyData;
