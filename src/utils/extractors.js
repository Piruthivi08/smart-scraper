function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  );
  return match ? match[0] : null;
}

function extractAddress(bodyText = '') {
  const regex = /(?:address|location|headquarters)[:\-–\s]*(.+)/i;
  const match = bodyText.match(regex);
  return match ? match[1].trim() : null;
}

function extractTagline($) {
  const meta = $('meta[name="description"]').attr('content');
  const title = $('title').text();
  return meta || title || null;
}

function extractFoundedYear(bodyText = '') {
  const regex = /(?:founded|established|since)\s+(\d{4})/i;
  const match = bodyText.match(regex);
  return match ? match[1] : null;
}

function extractSocialLinks(hrefs = []) {
  const platforms = ["linkedin", "facebook", "twitter", "instagram", "youtube"];
  return hrefs.filter(href =>
    platforms.some(platform => href.toLowerCase().includes(platform))
  );
}

function detectSentiment(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes("trusted by") || lower.includes("award-winning"))
    return "growth-oriented";
  if (lower.includes("affordable") || lower.includes("easy to use"))
    return "value-focused";
  return "neutral";
}

function extractTechStack(scriptSources = [], bodyText = "") {
  const stack = [];

  const technologies = {
    react: /react|cdn\.react/,
    angular: /angular|cdn\.angular/,
    vue: /vue\.js/,
    jquery: /jquery/,
    bootstrap: /bootstrap/,
    wordpress: /wp-content|wordpress/,
    nextjs: /next\.js/,
    tailwind: /tailwind/
  };

  scriptSources.forEach(src => {
    for (const [tech, pattern] of Object.entries(technologies)) {
      if (pattern.test(src.toLowerCase()) && !stack.includes(tech)) {
        stack.push(tech);
      }
    }
  });

  const lowerBody = bodyText.toLowerCase();
  for (const [tech, pattern] of Object.entries(technologies)) {
    if (pattern.test(lowerBody) && !stack.includes(tech)) {
      stack.push(tech);
    }
  }

  return stack;
}

function extractServices(bodyText = "") {
  const keywords = [
    "consulting", "development", "design", "marketing",
    "cloud", "security", "data", "analytics", "AI",
    "healthcare", "fintech", "e-commerce", "blockchain"
  ];

  const found = [];
  keywords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(bodyText) && !found.includes(word)) {
      found.push(word);
    }
  });

  return found;
}

function extractIndustries(bodyText = '') {
  const industryKeywords = {
    healthcare: ['healthcare', 'hospital', 'telemedicine', 'patient'],
    fintech: ['fintech', 'banking', 'financial', 'payment'],
    education: ['education', 'learning', 'school', 'student'],
    retail: ['retail', 'ecommerce', 'store', 'shop'],
    logistics: ['logistics', 'shipping', 'supply chain'],
    realEstate: ['real estate', 'property', 'housing'],
    travel: ['travel', 'booking', 'hotel', 'trip'],
    saas: ['saas', 'cloud software', 'subscription']
  };

  const detected = [];
  const lowerText = bodyText.toLowerCase();

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(word => lowerText.includes(word))) {
      detected.push(industry);
    }
  }

  return detected;
}

function extractTeamInfo(bodyText = '') {
  const roles = ['CEO', 'Founder', 'CTO', 'COO', 'CMO', 'Managing Director', 'Head of Product', 'Leadership'];
  const results = [];

  roles.forEach(role => {
    const regex = new RegExp(`\\b${role}\\b`, 'i');
    if (regex.test(bodyText)) results.push(role);
  });

  return results;
}

function extractSocialProof(bodyText = '') {
  const phrases = [
    'trusted by', 'case study', 'customer success',
    'our clients', 'testimonial', 'partnered with',
    'featured in', 'awards', 'press'
  ];

  const proof = [];
  const lower = bodyText.toLowerCase();

  phrases.forEach(p => {
    if (lower.includes(p)) proof.push(p);
  });

  return proof;
}

module.exports = {
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
  extractSocialProof
};