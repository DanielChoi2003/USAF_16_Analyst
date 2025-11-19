const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
// Load environment variables from project .env so spawned Python processes inherit them
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = express();
const port = 3001;

// Directory to store analysis results so frontend can list/retrieve them
const resultsDir = path.join(__dirname, '..', 'analysis_results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.post('/analyze', (req, res) => {
  const jsonData = req.body;
  const tempDir = path.join(__dirname, '..', 'inputs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `temp_analysis_${Date.now()}.json`);

  fs.writeFile(tempFilePath, JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
      console.error('Failed to write temp file:', err);
      return res.status(500).send('Failed to process file.');
    }

    const pythonScriptPath = path.join(__dirname, '..', 'rag', 'query_rag.py');
    // Allow configuring which python executable to use (useful when running inside a venv)
    const pythonExec = process.env.PYTHON_PATH || 'python3';
    const command = `${pythonExec} ${pythonScriptPath} -f ${tempFilePath}`;

    // Ensure the child process receives the same env vars (including those loaded from .env)
    exec(command, { env: process.env }, (error, stdout, stderr) => {
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Failed to delete temp file:', unlinkErr);
        }
      });

      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({ error: `Execution error`, details: stderr });
      }
      // Save stdout to a results file for later retrieval
      const id = `result_${Date.now()}`;
      const resultFile = path.join(resultsDir, `${id}.json`);
      fs.writeFile(resultFile, stdout, (writeErr) => {
        if (writeErr) {
          console.error('Failed to write result file:', writeErr);
          // still return the stdout to client, but indicate save failed
          return res.status(200).json({ id: null, filename: null, content: stdout, saved: false });
        }

        return res.status(200).json({ id, filename: `${id}.json`, content: stdout, saved: true });
      });
    });
  });
});

// List saved results
app.get('/results', (req, res) => {
  fs.readdir(resultsDir, (err, files) => {
    if (err) {
      console.error('Failed to list results:', err);
      return res.status(500).json({ error: 'Failed to list results' });
    }

    const entries = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const p = path.join(resultsDir, f);
        const stat = fs.statSync(p);
        return {
          id: f.replace(/\.json$/, ''),
          filename: f,
          created_at: stat.mtimeMs,
          size: stat.size,
        };
      })
      .sort((a, b) => b.created_at - a.created_at);

    res.json(entries);
  });
});

// Get a specific result by id
app.get('/results/:id', (req, res) => {
  const id = req.params.id;
  const p = path.join(resultsDir, `${id}.json`);
  if (!fs.existsSync(p)) {
    return res.status(404).json({ error: 'Result not found' });
  }

  fs.readFile(p, 'utf-8', (err, data) => {
    if (err) {
      console.error('Failed to read result file:', err);
      return res.status(500).json({ error: 'Failed to read result' });
    }
    // Return as JSON object with content string
    res.json({ id, filename: `${id}.json`, content: data });
  });
});

app.listen(port, () => {
  console.log(` app listening at http://localhost:${port}`);
});
