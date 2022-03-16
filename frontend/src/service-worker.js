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
import {NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

clientsClaim();

if (process.env.NODE_ENV === 'production') {
  // Precache all of the assets generated by your build process.
  // Their URLs are injected into the manifest variable below.
  // This variable must be present somewhere in your service worker file,
  // even if you decide not to use precaching. See https://cra.link/PWA
  precacheAndRoute(self.__WB_MANIFEST);
}

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({request, url}) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') {
      return false;
    }

    // If this is a URL that starts with /_, skip.
    if (url.pathname.startsWith('/_')) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }

    // Return true to signal that we want to use the handler.
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html'),
);

if (process.env.NODE_ENV === 'production') {
  registerRoute(
    ({url}) => {
      const urlString = url.toString();
      if (
        urlString.startsWith('https://cdn.jsdelivr.net/') // Pyodide
        || urlString.startsWith('https://pyodide-cdn2.iodide.io') // Only used when we are testing bleeding-edge pyodide
        || url.hostname.endsWith('futurecoder.io')
        || url.hostname.includes("localhost")
        || url.hostname.includes("127.0.0.1")
      ) {
        return true
      }
      return false;
    },
    new StaleWhileRevalidate({
      cacheName: 'everything',
      cacheExpiration: {
        maxEntries: 50,
      },
      cacheableResponse: {statuses: [0, 200]},
      plugins: [
        // Ensure that once this runtime cache reaches a maximum size the
        // least-recently used stuff is removed.
        new ExpirationPlugin({maxEntries: 30}),
      ],
    }),
  );
}

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
