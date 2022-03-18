/* eslint-disable */
// Otherwise webpack can fail silently
// https://github.com/facebook/create-react-app/issues/8014
// Reference for service-worker.js: https://developers.google.com/web/tools/workbox/modules

import {serviceWorkerFetchListener} from 'sync-message'; // Do not remove
const fetchListener = serviceWorkerFetchListener(); // Do not remove
addEventListener('fetch', fetchListener); // Do not remove

import {clientsClaim} from 'workbox-core';
import {ExpirationPlugin} from 'workbox-expiration';
import {precacheAndRoute, createHandlerBoundToURL} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate} from 'workbox-strategies';

clientsClaim();

if (process.env.NODE_ENV === 'production') {
  // Precache all of the assets generated by your build process.
  // Their URLs are injected into the manifest variable below.
  // This variable (self.__WB_MANIFEST) must be present somewhere in your service worker file,
  // even if you decide not to use precaching. See https://cra.link/PWA
  precacheAndRoute(self.__WB_MANIFEST);

  // "Set up App Shell-style routing. Learn more at
  // ... https://developers.google.com/web/fundamentals/architecture/app-shell "
  const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
  registerRoute(
    // "Return false to exempt requests from being fulfilled by index.html."
    ({request, url}) => {
      // "If this isn't a navigation, skip."
      if (request.mode !== 'navigate') {
        return false;
      }

      // "If this is a URL that starts with /_, skip."
      if (url.pathname.startsWith('/_')) {
        return false;
      }

      // "If this looks like a URL for a resource, because it contains // a file extension, skip."
      if (url.pathname.match(fileExtensionRegexp)) {
        return false;
      }

      // "Return true to signal that we want to use the handler."
      return true;
    },
    createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html'),
  );

  registerRoute(
    ({url}) => {
      const urlString = url.toString();
      return (
        urlString.startsWith('https://cdn.jsdelivr.net/') || // Pyodide
        urlString.startsWith('https://pyodide-cdn2.iodide.io') || // Only used when we are testing bleeding-edge pyodide
        urlString.startsWith('https://futurecoder-io--') || // Firebase preview deployments
        url.hostname.endsWith('futurecoder.io') ||
        url.hostname.includes('localhost') ||
        url.hostname.includes('127.0.0.1')
      );
    },
    new StaleWhileRevalidate({
      cacheName: 'everything',
      cacheableResponse: {statuses: [0, 200]},
      // ^ Q: What's status 0 mean?
      // ^ A: It's an opaque response, and it relates to third-party resources (and CORS).
      // https://github.com/alexmojaki/futurecoder/pull/313/files/f5f0fded9f44fefd0bf44b99ee45f54a8badc272#r829408930
      plugins: [
        new ExpirationPlugin({maxEntries: 30}),
      ],
    }),
  );
}

self.skipWaiting();
