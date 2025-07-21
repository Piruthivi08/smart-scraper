function calculateMetaScore(data) {
  let score = 0;

  if (data.name) score += 2;
  if (data.email) score += 2;
  if (data.phone) score += 2;
  if (data.address) score += 1;
  if (data.foundedYear) score += 1;
  if (data.tagline) score += 1;
  if (Array.isArray(data.socialLinks) && data.socialLinks.length > 0) score += 1;
  if (data.sentiment) score += 1;
  if (Array.isArray(data.techStack) && data.techStack.length > 0) score += 2;
  if (Array.isArray(data.services) && data.services.length > 0) score += 1;
  if (Array.isArray(data.industries) && data.industries.length > 0) score += 2;
  if (Array.isArray(data.teamInfo) && data.teamInfo.length > 0) score += 1;
  if (Array.isArray(data.socialProof) && data.socialProof.length > 0) score += 1;

  return Math.round((score / 20) * 100);
}



module.exports = { calculateMetaScore };