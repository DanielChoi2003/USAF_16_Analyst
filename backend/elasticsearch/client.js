const https = require('https');

const ELASTIC_URL = process.env.ELASTIC_URL || process.env.ELASTICSEARCH_URL || 'https://localhost:9200';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME || process.env.ELASTICSEARCH_USERNAME || 'elastic';
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD || '';
const ELASTIC_INDEX = process.env.ELASTIC_INDEX_NAME || process.env.ELASTICSEARCH_INDEX || 'investigation-events';

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function requestElasticsearch(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, ELASTIC_URL);
    const requestBody = body ? JSON.stringify(body) : null;

    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method,
        agent: insecureAgent,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}`).toString('base64')}`,
          ...(requestBody ? { 'Content-Length': Buffer.byteLength(requestBody) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (error) {
              return reject(new Error(`Failed to parse Elasticsearch response: ${error.message}`));
            }
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }

          const reason = parsed && parsed.error ? JSON.stringify(parsed.error) : raw || `HTTP ${res.statusCode}`;
          reject(new Error(`Elasticsearch request failed: ${reason}`));
        });
      },
    );

    req.on('error', reject);

    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  });
}

function buildShouldClauses(originalInput) {
  const clauses = [];

  if (originalInput.package_id) {
    clauses.push({
      bool: {
        should: [
          { term: { 'package_id.keyword': originalInput.package_id } },
          { match_phrase: { package_id: originalInput.package_id } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  if (originalInput.alert_id) {
    clauses.push({
      bool: {
        should: [
          { term: { 'alert_id.keyword': originalInput.alert_id } },
          { match_phrase: { alert_id: originalInput.alert_id } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  const eventIds = Array.isArray(originalInput.events)
    ? originalInput.events.map((event) => event && event.id).filter(Boolean)
    : [];
  if (eventIds.length > 0) {
    for (const eventId of eventIds) {
      clauses.push({
        bool: {
          should: [
            { term: { 'event.id.keyword': eventId } },
            { match_phrase: { 'event.id': eventId } },
          ],
          minimum_should_match: 1,
        },
      });
    }
  }

  return clauses;
}

async function searchPackageEvents(originalInput) {
  const should = buildShouldClauses(originalInput);
  if (should.length === 0) {
    return [];
  }

  const response = await requestElasticsearch('POST', `/${ELASTIC_INDEX}/_search`, {
    size: 100,
    sort: [{ '@timestamp': { order: 'asc' } }],
    query: {
      bool: {
        should,
        minimum_should_match: 1,
      },
    },
  });

  const hits = response && response.hits && Array.isArray(response.hits.hits) ? response.hits.hits : [];
  return hits.map((hit) => hit._source).filter(Boolean);
}

module.exports = {
  ELASTIC_INDEX,
  searchPackageEvents,
};
