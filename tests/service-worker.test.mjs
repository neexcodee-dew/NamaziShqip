import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const workerSource = await readFile(new URL("../sw.js", import.meta.url), "utf8");

function loadWorker({ oldCaches = [], network = async () => new Response("fresh app code") } = {}) {
  const listeners = new Map();
  const deleted = [];
  const networkRequests = [];
  const cacheWrites = [];
  let cacheMatches = 0;
  const cache = {
    add: async () => {},
    put: async (request, response) => cacheWrites.push(request.url || String(request)),
    match: async () => null
  };
  const caches = {
    keys: async () => [...oldCaches, "namazishqip-v8", "other-app-cache"],
    delete: async key => { deleted.push(key); return true; },
    open: async () => cache,
    match: async () => { cacheMatches += 1; return null; }
  };
  const fetch = async request => {
    networkRequests.push(request.url || String(request));
    return network(request);
  };
  const self = {
    location: new URL("http://namazi.local/sw.js"),
    clients: { claim: async () => {}, matchAll: async () => [], openWindow: async () => null },
    addEventListener: (name, listener) => listeners.set(name, listener),
    skipWaiting: async () => {}
  };

  vm.runInNewContext(workerSource, { self, caches, fetch, URL, Request, Response, console });
  return { listeners, deleted, networkRequests, cacheWrites, get cacheMatches() { return cacheMatches; } };
}

test("activation removes the previous nsq-v6 shell and prior NamaziShqip caches only", async () => {
  const worker = loadWorker({ oldCaches: ["nsq-v6", "namazishqip-v7"] });
  let activation;
  worker.listeners.get("activate")({ waitUntil: promise => { activation = promise; } });
  await activation;

  assert.deepEqual(worker.deleted.sort(), ["namazishqip-v7", "namazishqip-v8", "nsq-v6"].sort());
  assert.ok(!worker.deleted.includes("other-app-cache"));
});

test("app JavaScript is fetched from the network before any cached fallback", async () => {
  const worker = loadWorker();
  const request = new Request("http://namazi.local/script.js");
  let responsePromise;
  worker.listeners.get("fetch")({
    request,
    respondWith: promise => { responsePromise = promise; }
  });
  const response = await responsePromise;

  assert.equal(await response.text(), "fresh app code");
  assert.deepEqual(worker.networkRequests, [request.url]);
  assert.equal(worker.cacheMatches, 0);
  assert.deepEqual(worker.cacheWrites, [request.url]);
});
