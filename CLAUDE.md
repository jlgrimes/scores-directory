# Scores Directory

A simple API server that serves `.gen` music notation files.

## Project Structure

```
scores-directory/
├── scores/           # .gen files organized by category
│   ├── classical/
│   ├── ensemble/
│   ├── jazz/
│   ├── lead/
│   ├── movies/
│   ├── theatre/
│   ├── tv/
│   └── video-games/
├── CLAUDE.md         # This file
└── (server code)     # To be implemented
```

## API Contract

The server must implement these two endpoints:

### GET /api/scores

Returns a JSON array of all available scores with their content.

**Response:**
```typescript
interface ScoreInfo {
  name: string;    // Path relative to scores/, e.g., "ensemble/star-wars.gen"
  content: string; // Raw .gen file content
}

// Response: ScoreInfo[]
```

**Example response:**
```json
[
  {
    "name": "classical/ode-to-joy.gen",
    "content": "---\ntitle: Ode to Joy\ncomposer: Beethoven\n---\nE E F G..."
  },
  {
    "name": "ensemble/star-wars.gen",
    "content": "---\ntitle: Star Wars Theme\n..."
  }
]
```

### GET /api/scores/:path

Returns the raw content of a single `.gen` file.

**Parameters:**
- `path` - URL-encoded path to the score (e.g., `ensemble%2Fstar-wars.gen`)

**Response:**
- Content-Type: `text/plain`
- Body: Raw `.gen` file content

**Example:**
```
GET /api/scores/ensemble%2Fstar-wars.gen

Response:
---
title: Star Wars Theme
composer: John Williams
---
...
```

## Implementation Requirements

1. **Recursively scan the `scores/` directory** for all `.gen` files
2. **Build the file list** with paths relative to `scores/` (e.g., `ensemble/star-wars.gen`)
3. **Serve static content** - no need for database, just read from filesystem
4. **CORS headers** - must allow cross-origin requests from any origin:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```
5. **Cache the file list** on startup (optional, for performance)

## Suggested Tech Stack

**Option A: Node.js + Express** (simple)
```bash
npm init -y
npm install express cors
```

**Option B: Bun + Hono** (fast, modern)
```bash
bun init
bun add hono
```

**Option C: Rust + Axum** (if you want consistency with gen-compiler)

## Example Express Implementation

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const SCORES_DIR = path.join(__dirname, 'scores');

function getAllScores(dir, basePath = '') {
  const scores = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      scores.push(...getAllScores(fullPath, relativePath));
    } else if (entry.name.endsWith('.gen')) {
      scores.push({
        name: relativePath,
        content: fs.readFileSync(fullPath, 'utf-8')
      });
    }
  }
  return scores;
}

app.get('/api/scores', (req, res) => {
  const scores = getAllScores(SCORES_DIR);
  res.json(scores);
});

app.get('/api/scores/:path(*)', (req, res) => {
  const scorePath = path.join(SCORES_DIR, req.params.path);

  if (!scorePath.startsWith(SCORES_DIR)) {
    return res.status(403).send('Forbidden');
  }

  if (!fs.existsSync(scorePath)) {
    return res.status(404).send('Not found');
  }

  res.type('text/plain').send(fs.readFileSync(scorePath, 'utf-8'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scores API running on port ${PORT}`);
});
```

## Deployment

Deploy to any platform that supports Node.js/static hosting:
- Vercel
- Railway
- Fly.io
- Render
- DigitalOcean App Platform
- Self-hosted VPS

Set up DNS to point `scores.directory` (or your chosen domain) to the deployed server.

## Adding New Scores

1. Add `.gen` files to the appropriate folder in `scores/`
2. Restart the server (or it auto-detects if using file watching)
3. New scores appear in the API response

## Testing

```bash
# List all scores
curl http://localhost:3000/api/scores

# Get a specific score
curl http://localhost:3000/api/scores/classical/ode-to-joy.gen
```
