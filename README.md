# Domain Enrichment Scraper

A modular backend system that scrapes company websites, enriches metadata, scores profiles by relevance, and exports results for competitive intelligence or research. Built with Puppeteer for dynamic rendering and MongoDB for persistence.

---

## Features

- Dynamic scraping with headless Puppeteer
- Metadata enrichment (name, social links, services, sentiment)
- CSV export via `json2csv`
- Domain discovery using search queries
- Score-based filtering (`metaScore`)
- Stealth scraping via `puppeteer-extra-plugin-stealth`
- MongoDB integration for profile storage
- Rate-limited endpoints to prevent abuse

---

## Tech Stack

| Package                       | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `axios`                       | Static HTML fetching fallback        |
| `cheerio`                     | HTML parsing and metadata extraction |
| `cors`                        | Cross-origin resource sharing        |
| `dotenv`                      | Environment variable management      |
| `express` (v5)                | API routing and middleware           |
| `express-rate-limit`          | Throttle scraping endpoints          |
| `json2csv`                    | Export enriched profiles to CSV      |
| `mongodb` + `mongoose`        | Document storage & schema modeling   |
| `nodemon`                     | Hot-reload during development        |
| `puppeteer`                   | Headless browser automation          |
| `puppeteer-extra` + `stealth` | Anti-blocking plugins for Puppeteer  |

---

## Key Routes

### `/api/scrape/preview`

Scrapes a batch of company websites and returns enriched profile data

**POST Body**

````json
{
  "url": "https://www.zostel.com"
}

**POST Response**

{
    "name": "Zostel | World's largest backpacker hostels franchise",
    "website": "https://www.zostel.com/",
    "tagline": "Zostel is the world's largest backpacker hostels franchise, originating in India and on a mission to connect travellers across the world through stays, trips, and next-gen communal experiences.",
    "sentiment": "neutral",
    "techStack": [
        "https://www.googletagmanager.com/gtag/js?id=G-K9NTX3YRSP"
    ],
    "metaScore": 30,
    "profileGrade": "D"
}

### /api/scrape/search
Accepts a search query (e.g. "fintech startups India"), runs a DuckDuckGo scrape, filters known startup domains, enriches them, and saves to DB.

***POST Body***

{
  "query": "telemedicine startups in India"
}

**POST Response**

{
    "message": "Search complete",
    "query": "telemedicine startups in India",
    "results": [
        {
            "url": "https://duckduckgo.com/?q=telemedicine%20startups%20in%20India+site:www.f6s.com",
            "status": "saved",
            "score": 30
        },
        {
            "url": "https://www.f6s.com/companies/telemedicine/india/co",
            "status": "saved",
            "score": 50
        },
        {
            "url": "https://www.f6s.com/companies/telemedicine/india/co",
            "status": "empty",
            "score": 0
        },
        {
            "url": "https://duckduckgo.com/?q=telemedicine%20startups%20in%20India+site:www.inventiva.co.in",
            "status": "saved",
            "score": 40
        },
        {
            "url": "https://www.inventiva.co.in/trends/top-telemedicine-companies-india/",
            "status": "saved",
            "score": 70
        },
        {
            "url": "https://www.inventiva.co.in/trends/top-telemedicine-companies-india/",
            "status": "saved",
            "score": 70
        }
    ]
}

### /api/scrape/filter
Returns all stored company profiles with metaScore >= X

GET /api/scrape/filter?score=60
GET /api/scrape/filter?score=70

**GET Response**
[
    {
        "_id": "687db57cde34ede2796f84e9",
        "name": "AI-First Monetization",
        "website": "https://graphy.com/",
        "email": "care@graphy.com",
        "address": ".",
        "socialLinks": [
            "https://twitter.com/graphyapp",
            "https://www.instagram.com/graphyapp/",
            "https://www.linkedin.com/company/graphyapp",
            "https://www.youtube.com/c/GraphyUniversity"
        ],
        "services": [
            "development",
            "design",
            "marketing",
            "data",
            "analytics",
            "AI"
        ],
        "metaScore": 70,
        "tags": [],
        "sentiment": "value-focused",
        "createdAt": "2025-07-21T03:35:24.408Z",
        "__v": 0
    },
    {
        "_id": "687db646de34ede2796f84ed",
        "name": "AI-First Monetization",
        "website": "https://graphy.com/",
        "email": "care@graphy.com",
        "address": ".",
        "socialLinks": [
            "https://twitter.com/graphyapp",
            "https://www.instagram.com/graphyapp/",
            "https://www.linkedin.com/company/graphyapp",
            "https://www.youtube.com/c/GraphyUniversity"
        ],
        "services": [
            "development",
            "design",
            "marketing",
            "data",
            "analytics",
            "AI"
        ],
        "metaScore": 70,
        "tags": [],
        "sentiment": "value-focused",
        "createdAt": "2025-07-21T03:38:46.698Z",
        "__v": 0
    }
]

### `/api/scrape/batch`
Scrape multiple URLs and enrich profile data.

**POST Body**
```json
{
  "urls": [
    "https://graphy.com",
    "https://themancompany.com"
  ]
}

**POST Response**

{
    "message": "🔄 Batch scraping complete",
    "results": [
        {
            "url": "https://www.themancompany.com",
            "status": "saved",
            "score": 45,
            "grade": "D"
        },
        {
            "url": "https://graphy.com",
            "status": "saved",
            "score": 70,
            "grade": "B"
        }
    ]
}



### `/api/scrape/export`
Exports enriched profiles in CSV format.

- Returns: downloadable file companies.csv
- Includes fields: name, website, email, phone, metaScore,

**POST Response**
"$__","$isNew","_doc"
"{""activePaths"":{""paths"":{""socialLinks"":""init"",""services"":""init"",""tags"":""init"",""_id"":""init"",""name"":""init"",""website"":""init"",""email"":""init"",""phone"":""init"",""address"":""init"",""createdAt"":""init"",""__v"":""init""},""states"":{""default"":{},""init"":{""_id"":true,""name"":true,""website"":true,""email"":true,""phone"":true,""address"":true,""socialLinks"":true,""services"":true,""tags"":true,""createdAt"":true,""__v"":true}}},""skipId"":true}",false,"{""_id"":""687bea0beaca28d443622456"",""name"":""Example Domain"",""website"":""https://example.com/"",""email"":null,""phone"":null,""address"":null,""socialLinks"":[],""services"":[],""tags"":[],""createdAt"":""2025-07-19T18:55:07.031Z"",""__v"":0}"
"{""activePaths"":{""paths"":{""socialLinks"":""init"",""services"":""init"",""tags"":""init"",""_id"":""init"",""name"":""init"",""website"":""init"",""metaScore"":""init"",""sentiment"":""init"",""createdAt"":""init"",""__v"":""init""},""states"":{""default"":{},""init"":{""_id"":true,""name"":true,""website"":true,""socialLinks"":true,""services"":true,""metaScore"":true,""tags"":true,""sentiment"":true,""createdAt"":true,""__v"":true}}},""skipId"":true}",false,"{""_id"":""687db54fde34ede2796f84e7"",""name"":""The Man Company: Premium Men's Grooming Essentials"",""website"":""https://www.themancompany.com/"",""socialLinks"":[""https://www.youtube.com/@themancompany"",""https://twitter.com/themancompany"",""https://www.facebook.com/Themancompany"",""https://www.instagram.com/themancompany/"",""https://www.youtube.com/@themancompany""],""services"":[],""metaScore"":45,""tags"":[],""sentiment"":""neutral"",""createdAt"":""2025-07-21T03:34:39.924Z"",""__v"":0}"
"{""activePaths"":{""paths"":{""socialLinks"":""init"",""services"":""init"",""tags"":""init"",""_id"":""init"",""name"":""init"",""website"":""init"",""email"":""init"",""address"":""init"",""metaScore"":""init"",""sentiment"":""init"",""createdAt"":""init"",""__v"":""init""},""states"":{""default"":{},""init"":{""_id"":true,""name"":true,""website"":true,""email"":true,""address"":true,""socialLinks"":true,""services"":true,""metaScore"":true,""tags"":true,""sentiment"":true,""createdAt"":true,""__v"":true}}},""skipId"":true}",false,"{""_id"":""687db57cde34ede2796f84e9"",""name"":""AI-First Monetization"",""website"":""https://graphy.com/"",""email"":""care@graphy.com"",""address"":""."",""socialLinks"":[""https://twitter.com/graphyapp"",""https://www.instagram.com/graphyapp/"",""https://www.linkedin.com/company/graphyapp"",""https://www.youtube.com/c/GraphyUniversity""],""services"":[""development"",""design"",""marketing"",""data"",""analytics"",""AI""],""metaScore"":70,""tags"":[],""sentiment"":""value-focused"",""createdAt"":""2025-07-21T03:35:24.408Z"",""__v"":0}"
"{""activePaths"":{""paths"":{""socialLinks"":""init"",""services"":""init"",""tags"":""init"",""_id"":""init"",""name"":""init"",""website"":""init"",""metaScore"":""init"",""sentiment"":""init"",""createdAt"":""init"",""__v"":""init""},""states"":{""default"":{},""init"":{""_id"":true,""name"":true,""website"":true,""socialLinks"":true,""services"":true,""metaScore"":true,""tags"":true,""sentiment"":true,""createdAt"":true,""__v"":true}}},""skipId"":true}",false,"{""_id"":""687db621de34ede2796f84eb"",""name"":""The Man Company: Premium Men's Grooming Essentials"",""website"":""https://www.themancompany.com/"",""socialLinks"":[""https://www.youtube.com/@themancompany"",""https://twitter.com/themancompany"",""https://www.facebook.com/Themancompany"",""https://www.instagram.com/themancompany/"",""https://www.youtube.com/@themancompany""],""services"":[],""metaScore"":45,""tags"":[],""sentiment"":""neutral"",""createdAt"":""2025-07-21T03:38:09.003Z"",""__v"":0}"
"{""activePaths"":{""paths"":{""socialLinks"":""init"",""services"":""init"",""tags"":""init"",""_id"":""init"",""name"":""init"",""website"":""init"",""email"":""init"",""address"":""init"",""metaScore"":""init"",""sentiment"":""init"",""createdAt"":""init"",""__v"":""init""},""states"":{""default"":{},""init"":{""_id"":true,""name"":true,""website"":true,""email"":true,""address"":true,""socialLinks"":true,""services"":true,""metaScore"":true,""tags"":true,""sentiment"":true,""createdAt"":true,""__v"":true}}},""skipId"":true}",false,"{""_id"":""687db646de34ede2796f84ed"",""name"":""AI-First Monetization"",""website"":""https://graphy.com/"",""email"":""care@graphy.com"",""address"":""."",""socialLinks"":[""https://twitter.com/graphyapp"",""https://www.instagram.com/graphyapp/"",""https://www.linkedin.com/company/graphyapp"",""https://www.youtube.com/c/GraphyUniversity""],""services"":[""development"",""design"",""marketing"",""data"",""analytics"",""AI""],""metaScore"":70,""tags"":[],""sentiment"":""value-focused"",""createdAt"":""2025-07-21T03:38:46.698Z"",""__v"":0}"

````
