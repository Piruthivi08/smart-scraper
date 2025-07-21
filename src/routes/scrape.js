const express = require("express");
require("dotenv").config();
const router = express.Router();
const Company = require("../models/Company");
const scrapeCompanyData = require("../scraper/scraper");
const { Parser } = require("json2csv");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());


function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

// Preview a profile without saving
router.post("/preview", async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Missing or invalid URL." });
  }

  try {
    const result = await scrapeCompanyData(url);
    if (!result) {
      return res.status(502).json({ error: "Scraper returned no data." });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error(`[SCRAPER ERROR] Preview: ${url}`, err.message);
    res.status(500).json({ error: "Unexpected error during preview." });
  }
});

// Scrape and save multiple profiles (no score filter)
router.post("/batch", async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Missing or invalid "urls" array.' });
  }

  const results = [];

  for (const url of urls) {
    if (!isValidUrl(url)) {
      results.push({ url, status: "invalid", score: 0 });
      continue;
    }

    try {
      const data = await scrapeCompanyData(url);
      if (data) {
        const saved = await Company.create(data);
        results.push({
          url,
          status: "saved",
          score: data.metaScore,
          grade: data.profileGrade,
        });
      } else {
        results.push({ url, status: "empty", score: 0 });
      }
    } catch (err) {
      console.error(`[SCRAPER ERROR] Batch: ${url}`, err.message);
      results.push({ url, status: "error", score: 0 });
    }
  }

  res.status(200).json({ message: "Batch scraping complete", results });
});

// Export all saved profiles as CSV
router.get("/export", async (req, res) => {
  try {
    const companies = await Company.find();
    if (!companies.length) {
      return res.status(404).json({ message: "No company profiles found." });
    }

    const parser = new Parser();
    const csv = parser.parse(companies);

    res.header("Content-Type", "text/csv");
    res.attachment("companies.csv");
    res.send(csv);
  } catch (err) {
    console.error("[EXPORT ERROR]", err.message);
    res.status(500).json({ error: "Failed to export CSV." });
  }
});

// Search using natural language query
router.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid search query." });
  }

  try {
    console.log("Initiating search for:", query);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
    );

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));

    const allowedDomains = [
      "f6s.com",
      "startupindia.gov.in",
      "inventiva.co.in"
    ];

    const rawLinks = await page.$$eval("a", anchors =>
      anchors.map(a => a.href).filter(href => href.startsWith("http"))
    );

    const urls = rawLinks.filter(url => {
      return allowedDomains.some(domain => url.includes(domain));
    }).slice(0, 10);

    await browser.close();
    console.log("[DEBUG] Filtered URLs:", urls);

    const results = [];

    if (!urls.length) {
      return res.status(200).json({
        message: "No usable links extracted — fallback required.",
        query,
        results: []
      });
    }

    for (const url of urls) {
      try {
        const data = await scrapeCompanyData(url);
        if (data) {
          data.searchQuery = query;
          const saved = await Company.create(data);
          results.push({
            url,
            status: "saved",
            score: data.metaScore,
            grade: data.profileGrade
          });
        } else {
          results.push({ url, status: "empty", score: 0 });
        }
      } catch (err) {
        console.error(`[SCRAPER ERROR] ${url}`, err.message);
        results.push({ url, status: "error", score: 0 });
      }
    }

    res.status(200).json({ message: "Search complete", query, results });
  } catch (err) {
    console.error("[SEARCH ERROR]", err.message);
    res.status(500).json({ error: "Search failed due to internal error." });
  }
});

//  Filter saved profiles by grade, industry, tech
router.get("/filter", async (req, res) => {
  const { score } = req.query;

  const filter = {};


  if (score) {
    const scoreNum = parseInt(score);
    if (!isNaN(scoreNum)) {
      filter.metaScore = { $gte: scoreNum };
    }
  }

  try {
    const results = await Company.find(filter).lean();
    if (!results.length) {
      return res.status(404).json({ message: "No matching profiles found." });
    }
    res.status(200).json(results);
  } catch (err) {
    console.error("[FILTER ERROR]", err.message);
    res.status(500).json({ error: "Failed to apply filters." });
  }
});

module.exports = router;
