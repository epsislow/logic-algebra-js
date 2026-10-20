'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * POST JSON — Node fără fetch (ex. Node 16).
 */
function postJson(urlStr, path, body, token) {
  return new Promise((resolve, reject) => {
    const base = new URL(urlStr.replace(/\/$/, '') + path);
    const payload = JSON.stringify(body);
    const lib = base.protocol === 'http:' ? http : https;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) headers.Authorization = 'Bearer ' + token;

    const req = lib.request(
      {
        hostname: base.hostname,
        port: base.port || (base.protocol === 'https:' ? 443 : 80),
        path: base.pathname + base.search,
        method: 'POST',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json;
          try {
            json = text ? JSON.parse(text) : null;
          } catch (e) {
            json = null;
          }
          if (res.statusCode < 200 || res.statusCode >= 300 || (json && json.succes === false)) {
            const msg = (json && json.eroare) || text || res.statusMessage;
            reject(new Error(msg || 'HTTP ' + res.statusCode));
            return;
          }
          resolve(json);
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { postJson };
