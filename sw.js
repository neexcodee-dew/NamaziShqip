"use strict";

const CACHE_NAME = "namazishqip-v9";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./assets/js/prayer-core.mjs",
  "./assets/vendor/adhan.esm.min.mjs",
  "./assets/vendor/tz-lookup.mjs",
  "./assets/logo/icon-192.png",
  "./assets/logo/icon-512.png"
];
const AUDIO_URL = new URL("./ezani.mp3", self.location.href).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME &&
          (key.startsWith("namazishqip-") || key === "nsq-v6"))
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (response && response.ok && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (await caches.match("./index.html")) ||
        (await caches.match("./offline.html")) ||
        new Response("Offline", { status: 503, statusText: "Offline" });
    }
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    fetch(request)
      .then(response => cacheResponse(request, response))
      .catch(() => {});
    return cached;
  }
  return cacheResponse(request, await fetch(request));
}

async function audioResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  let fullResponse = await cache.match(AUDIO_URL);
  if (!fullResponse) {
    try {
      const fullRequest = new Request(AUDIO_URL, { credentials: "same-origin" });
      fullResponse = await fetch(fullRequest);
      if (fullResponse.ok && fullResponse.status === 200) {
        await cache.put(AUDIO_URL, fullResponse.clone());
      } else {
        return fullResponse;
      }
    } catch {
      return new Response("", { status: 503, statusText: "Audio unavailable offline" });
    }
  }

  const range = request.headers.get("range");
  if (!range) return fullResponse;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response("", { status: 416, statusText: "Invalid range" });
  const blob = await fullResponse.blob();
  const start = match[1] ? Number(match[1]) : Math.max(0, blob.size - Number(match[2]));
  const end = match[2] ? Math.min(Number(match[2]), blob.size - 1) : blob.size - 1;
  if (start > end || start >= blob.size) {
    return new Response("", {
      status: 416,
      headers: { "Content-Range": "bytes */" + blob.size }
    });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + blob.size,
      "Content-Type": fullResponse.headers.get("content-type") || "audio/mpeg"
    }
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.href.split("?")[0] === AUDIO_URL) {
    event.respondWith(audioResponse(request));
    return;
  }
  const isCode = request.mode === "navigate" ||
    ["script", "style", "manifest"].includes(request.destination) ||
    /\.(mjs|js|css|webmanifest)$/.test(url.pathname);
  event.respondWith(isCode ? networkFirst(request) : cacheFirst(request));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(windows => {
        const existing = windows.find(client => "focus" in client);
        return existing ? existing.focus() : self.clients.openWindow("./");
      })
  );
});
