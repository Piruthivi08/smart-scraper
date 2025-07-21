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
  metaScore: Number,        
  tags: [String],            
  sentiment: String,         
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', CompanySchema);