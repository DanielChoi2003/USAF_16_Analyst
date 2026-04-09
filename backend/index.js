const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
// Load environment variables from project .env so spawned Python processes inherit them
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { ELASTIC_INDEX, searchPackageEvents } = require('./elasticsearch/client');
const app = express();
const port = 3001;
const useRagPrimary = process.env.USE_RAG_PRIMARY === 'true';

function shellEscape(value) {
  return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function needsFallback(content) {
  if (!content) return true;

  return (
    content.includes('[no-context]') ||
    content.includes('An error occurred:') ||
    content.includes("Couldn't connect")
  );
}

async function buildDirectReport({ pythonExec, tempFilePath, reason }) {
  const fallbackScriptPath = path.join(__dirname, '..', 'rag', 'fallback_report.py');
  const fallbackCommand = `${shellEscape(pythonExec)} ${shellEscape(fallbackScriptPath)} ${shellEscape(tempFilePath)} ${shellEscape(reason)}`;
  const fallbackResult = await execCommand(fallbackCommand);

  return [
    `Fallback notice: ${reason}`,
    '',
    fallbackResult.stdout.trim(),
  ].join('\n');
}

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

app.post('/misp-analyze', (req, res) => {
  const jsonData = req.body;
  console.log('Received MISP analysis request:', jsonData);
  const tempDir = path.join(__dirname, '..', 'inputs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempInputPath = path.join(tempDir, `temp_misp_input_${Date.now()}.json`);
  const tempOutputPath = path.join(tempDir, `temp_misp_output_${Date.now()}.json`);

  fs.writeFile(tempInputPath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) {
      console.error('Failed to write temp file for MISP analysis:', err);
      return res.status(500).send('Failed to process file for MISP analysis.');
    }

    const pythonScriptPath = path.join(__dirname, '..', 'misp-docker', 'misp.py');
    const pythonExec = process.env.PYTHON_PATH || 'python';
    const command = `${shellEscape(pythonExec)} ${shellEscape(pythonScriptPath)} ${shellEscape(tempInputPath)} ${shellEscape(tempOutputPath)}`;

    exec(command, { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`MISP script exec error: ${error}`);
        console.error(`MISP script stderr: ${stderr}`);
        fs.unlink(tempInputPath, () => {}); // Clean up input file
        return res.json({
          misp_file: null,
          misp_output: [],
          warning: 'MISP enrichment unavailable; continuing without MISP results.',
          details: stderr,
        });
      }
      
      fs.readFile(tempOutputPath, 'utf8', (readErr, data) => {
        // Clean up both files
        fs.unlink(tempInputPath, () => {});
        fs.unlink(tempOutputPath, () => {});

        if (readErr) {
          console.error('Failed to read MISP output file:', readErr);
          return res.status(500).json({ error: 'Failed to read MISP output' });
        }

        try {
          const jsonOutput = JSON.parse(data);
          // Persist the MISP output into the results directory for later inspection
          const savedMispFilename = `misp_${Date.now()}.json`;
          const savedMispPath = path.join(resultsDir, savedMispFilename);
          fs.writeFile(savedMispPath, JSON.stringify(jsonOutput, null, 2), (saveErr) => {
            if (saveErr) {
              console.error('Failed to save MISP output to results dir:', saveErr);
              // still return the parsed output
              return res.json({ misp_file: null, misp_output: jsonOutput });
            }

            return res.json({ misp_file: savedMispPath, misp_output: jsonOutput });
          });
        } catch (parseError) {
          console.error('Failed to parse MISP script output:', parseError);
          res.status(500).json({ error: 'Failed to parse MISP script output', details: data });
        }
      });
    });
  });
});

app.post('/analyze', (req, res) => {
  const { misp_output, original_input } = req.body;
  const tempDir = path.join(__dirname, '..', 'inputs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `temp_analysis_${Date.now()}.json`);

  const analyze = async () => {
    let elasticEvents = [];
    let elasticWarning = null;

    try {
      elasticEvents = await searchPackageEvents(original_input);
    } catch (error) {
      console.error('Failed to retrieve package events from Elasticsearch:', error);
      elasticWarning = error.message;
    }

    const llmContext = {
      workflow: {
        source: elasticEvents.length > 0 ? 'elasticsearch' : 'raw_upload_fallback',
        elastic_index: ELASTIC_INDEX,
        elastic_event_count: elasticEvents.length,
        elastic_warning: elasticWarning,
      },
      original_input,
      elasticsearch_events: elasticEvents,
      misp_output: misp_output || null,
    };

    fs.writeFile(tempFilePath, JSON.stringify(llmContext, null, 2), async (err) => {
      if (err) {
        console.error('Failed to write temp file:', err);
        return res.status(500).send('Failed to process file.');
      }

      const pythonExec = process.env.PYTHON_PATH || 'python3';
      let finalContent = '';
      let usedFallback = false;
      let fallbackReason = null;

      try {
        if (useRagPrimary) {
          const pythonScriptPath = path.join(__dirname, '..', 'rag', 'query_rag.py');
          const command = `${shellEscape(pythonExec)} ${shellEscape(pythonScriptPath)} -f ${shellEscape(tempFilePath)}`;
          const ragResult = await execCommand(command);
          finalContent = ragResult.stdout;
        }
      } catch (ragError) {
        console.error('Primary RAG execution failed:', ragError);
        finalContent = `An error occurred: ${ragError.message}`;
      }

      try {
        if (!useRagPrimary) {
          usedFallback = true;
          fallbackReason =
            elasticEvents.length > 0
              ? `Used normalized Elasticsearch/Logstash events from index ${ELASTIC_INDEX} and direct LLM reporting.`
              : 'Could not find matching normalized events in Elasticsearch/Logstash. Used the uploaded JSON directly for LLM reporting.';
          finalContent = await buildDirectReport({
            pythonExec,
            tempFilePath,
            reason: fallbackReason,
          });
        } else {
          if (elasticEvents.length === 0) {
            usedFallback = true;
            fallbackReason =
              'Could not find matching normalized events in Elasticsearch/Logstash. Used the uploaded JSON directly for LLM reporting.';
          } else if (needsFallback(finalContent)) {
            usedFallback = true;
            fallbackReason =
              'Primary RAG query returned no usable context. Used direct LLM reporting with the available uploaded JSON and Elasticsearch context.';
          }

          if (usedFallback) {
            finalContent = await buildDirectReport({
              pythonExec,
              tempFilePath,
              reason: fallbackReason,
            });
          }
        }
      } catch (fallbackError) {
        console.error('Direct LLM report generation failed:', fallbackError);
        finalContent = [
          `Fallback notice: ${fallbackReason || 'Direct LLM reporting failed.'}`,
          '',
          'The direct LLM report path failed.',
          String(fallbackError.message || fallbackError),
          '',
          finalContent,
        ].join('\n');
      }

      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Failed to delete temp file:', unlinkErr);
        }
      });

      const id = `result_${Date.now()}`;
      const resultFile = path.join(resultsDir, `${id}.json`);
      fs.writeFile(resultFile, finalContent, (writeErr) => {
        if (writeErr) {
          console.error('Failed to write result file:', writeErr);
          return res.status(200).json({
            id: null,
            filename: null,
            content: finalContent,
            saved: false,
            elasticsearch_events_used: elasticEvents.length,
            elastic_warning: elasticWarning,
            used_fallback: usedFallback,
            fallback_reason: fallbackReason,
            rag_enabled: useRagPrimary,
          });
        }

        return res.status(200).json({
          id,
          filename: `${id}.json`,
          content: finalContent,
          saved: true,
          elasticsearch_events_used: elasticEvents.length,
          elastic_warning: elasticWarning,
          used_fallback: usedFallback,
          fallback_reason: fallbackReason,
          rag_enabled: useRagPrimary,
        });
      });
    });
  };

  analyze().catch((error) => {
    console.error('Analysis orchestration failed:', error);
    res.status(500).json({ error: 'Analysis orchestration failed', details: error.message });
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
