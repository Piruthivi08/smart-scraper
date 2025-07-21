const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: String,
  website: String,
  email: String,
  phone: String,
  address: String,
  socialLinks: [String],
  description: String,
  foundedYear: Number,
  services: [String],
  industry: String,
  metaScore: Number,         // Data completeness rating
  tags: [String],            // Auto-classified like SaaS, HealthTech, etc.
  sentiment: String,         // Descriptive like "growth-oriented"
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', CompanySchema);