const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const https = require('https');

const client = require('../elasticsearch/client');

test('buildShouldClauses creates package, alert, and event match clauses', () => {
  const clauses = client.buildShouldClauses({
    package_id: 'pkg-1',
    alert_id: 'alert-9',
    events: [{ id: 'evt-1' }, { id: 'evt-2' }, {}],
  });

  assert.equal(clauses.length, 4);
  assert.deepEqual(clauses[0].bool.should[0], { term: { 'package_id.keyword': 'pkg-1' } });
  assert.deepEqual(clauses[1].bool.should[0], { term: { 'alert_id.keyword': 'alert-9' } });
  assert.deepEqual(clauses[2].bool.should[0], { term: { 'event.id.keyword': 'evt-1' } });
  assert.deepEqual(clauses[3].bool.should[0], { term: { 'event.id.keyword': 'evt-2' } });
});

test('searchPackageEvents returns normalized _source hits from Elasticsearch response', async () => {
  const originalRequest = https.request;

  https.request = (options, callback) => {
    assert.equal(options.method, 'POST');
    assert.match(options.path, /_search$/);

    const response = new EventEmitter();
    response.statusCode = 200;
    response.setEncoding = () => {};

    const request = new EventEmitter();
    request.write = () => {};
    request.end = () => {
      callback(response);
      response.emit(
        'data',
        JSON.stringify({
          hits: {
            hits: [
              { _source: { id: 'one', host: 'alpha' } },
              { _source: { id: 'two', host: 'bravo' } },
            ],
          },
        }),
      );
      response.emit('end');
    };

    return request;
  };

  try {
    const results = await client.searchPackageEvents({
      package_id: 'pkg-123',
      events: [{ id: 'evt-9' }],
    });

    assert.deepEqual(results, [
      { id: 'one', host: 'alpha' },
      { id: 'two', host: 'bravo' },
    ]);
  } finally {
    https.request = originalRequest;
  }
});

test('searchPackageEvents short-circuits when there are no searchable identifiers', async () => {
  const results = await client.searchPackageEvents({});
  assert.deepEqual(results, []);
});
