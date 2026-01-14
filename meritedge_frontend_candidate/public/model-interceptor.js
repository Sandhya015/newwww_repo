(function () {
  'use strict';

  // FORCE console output to verify script is running
  console.log(
    '%c🚀 [Model Interceptor] Setting up interceptors before app bundle...',
    'color: red; font-size: 20px; font-weight: bold;'
  );
  console.log('🚀 [Model Interceptor] Current URL:', window.location.href);
  console.log('🚀 [Model Interceptor] Script execution time:', new Date().toISOString());

  // Test that we can modify window.fetch
  const testFetch = window.fetch;
  console.log('🚀 [Model Interceptor] Original fetch exists:', typeof testFetch === 'function');

  // Store original functions IMMEDIATELY
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalURL = window.URL;

  // Patch URL constructor FIRST - this catches URL construction
  window.URL = class extends originalURL {
    constructor(url, base) {
      let fixedUrl =
        typeof url === 'string'
          ? url
          : url instanceof URL
          ? url.toString()
          : String(url);
      const original = fixedUrl;

      // Fix model file URLs with trailing slashes
      if (
        fixedUrl &&
        fixedUrl.includes('/models/') &&
        (fixedUrl.includes('-shard') ||
          fixedUrl.endsWith('.json') ||
          fixedUrl.includes('tiny_face_detector') ||
          fixedUrl.includes('face_landmark_68'))
      ) {
        if (fixedUrl.endsWith('/') && fixedUrl !== '/') {
          fixedUrl = fixedUrl.slice(0, -1);
          console.log('🔧 [URL Constructor Patch] Fixed URL:', original, '→', fixedUrl);
        }
      }

      super(fixedUrl, base);
    }
  };

  // Patch URL.prototype.toString
  const originalToString = URL.prototype.toString;
  URL.prototype.toString = function () {
    let url = originalToString.call(this);
    if (
      url &&
      url.includes('/models/') &&
      (url.includes('-shard') ||
        url.endsWith('.json') ||
        url.includes('tiny_face_detector') ||
        url.includes('face_landmark_68'))
    ) {
      if (url.endsWith('/') && url !== '/') {
        const fixed = url.slice(0, -1);
        console.log('🔧 [URL toString Patch] Fixed URL:', url, '→', fixed);
        return fixed;
      }
    }
    return url;
  };

  // Intercept fetch - LOG ALL REQUESTS TO /models/
  // CRITICAL: Use Object.defineProperty to prevent face-api.js from overriding it
  // Make it configurable so we can override it later if needed
  Object.defineProperty(window, 'fetch', {
    value: function (input, init) {
      let url = '';
      let fixedInput = input;

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && input.url) {
        url = input.url;
      } else {
        url = String(input);
      }

      const originalUrl = url;

      // Log ALL /models/ requests
      if (url && url.includes('/models/')) {
        console.log('🔍 [Fetch Interceptor] Intercepted request to /models/:', url);
      }

      const isModelRequest =
        url &&
        (url.includes('/models/') ||
          url.includes('models/') ||
          url.includes('models\\')) &&
        (url.includes('-shard') ||
          url.includes('_manifest') ||
          url.endsWith('.json') ||
          url.includes('tiny_face_detector') ||
          url.includes('face_landmark_68'));

      // Check if this is a model file request
      if (isModelRequest) {
        // Remove trailing slash
        if (url.endsWith('/') && url !== '/') {
          const fixedUrl = url.slice(0, -1);
          console.log('🔧 [Fetch Interceptor] REMOVED trailing slash:', originalUrl, '→', fixedUrl);

          // CRITICAL: Reconstruct input with fixed URL - MUST use the fixed URL
          if (typeof input === 'string') {
            fixedInput = fixedUrl;
          } else if (input instanceof URL) {
            fixedInput = new URL(fixedUrl);
          } else if (input && input.url) {
            fixedInput = new Request(fixedUrl, input);
          } else {
            fixedInput = fixedUrl;
          }
        }
      }

      // CRITICAL: Use fixedInput, not original input
      const executeFetch = (requestInput) => originalFetch.call(this, requestInput, init);

      const firstAttempt = executeFetch(fixedInput);

      // If we didn't change anything or the request still succeeds, return it directly.
      return firstAttempt.then((response) => {
        if (!isModelRequest) {
          return response;
        }

        if (response.ok) {
          return response;
        }

        const responseUrl = response.url || url;
        if (
          response.status === 404 &&
          responseUrl &&
          responseUrl.endsWith('/') &&
          responseUrl !== '/'
        ) {
          const retryUrl = responseUrl.slice(0, -1);
          console.warn(
            '⚠️ [Fetch Interceptor] 404 with trailing slash. Retrying without slash:',
            responseUrl,
            '→',
            retryUrl
          );

          let retryInput;
          const currentInput = fixedInput;
          if (typeof currentInput === 'string') {
            retryInput = retryUrl;
          } else if (currentInput instanceof URL) {
            retryInput = new URL(retryUrl);
          } else if (currentInput && currentInput.url) {
            retryInput = new Request(retryUrl, currentInput);
          } else {
            retryInput = retryUrl;
          }

          return executeFetch(retryInput);
        }

        return response;
      });
    },
    writable: true,
    configurable: true,
  });

  // Intercept XMLHttpRequest - LOG ALL REQUESTS TO /models/
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    let urlString =
      typeof url === 'string' ? url : url instanceof URL ? url.toString() : String(url);
    let fixedUrl = url;

    // Log ALL /models/ requests
    if (urlString && urlString.includes('/models/')) {
      console.log('🔍 [XHR Interceptor] Intercepted request to /models/:', urlString);
    }

    // Check if this is a model file request
    if (
      urlString &&
      urlString.includes('/models/') &&
      (urlString.includes('-shard') ||
        urlString.endsWith('.json') ||
        urlString.includes('tiny_face_detector') ||
        urlString.includes('face_landmark_68'))
    ) {
      // Remove trailing slash
      if (urlString.endsWith('/') && urlString !== '/') {
        fixedUrl = urlString.slice(0, -1);
        console.log('🔧 [XHR Interceptor] REMOVED trailing slash:', urlString, '→', fixedUrl);
      }
    }

    // CRITICAL: Use fixedUrl, not original url
    return originalXHROpen.call(this, method, fixedUrl, ...args);
  };

  // AGGRESSIVE: Patch String.prototype.concat to catch URL construction via string concatenation
  const originalConcat = String.prototype.concat;
  String.prototype.concat = function (...args) {
    const result = originalConcat.apply(this, args);
    if (
      result &&
      (result.includes('/models/') || result.includes('models/')) &&
      (result.includes('-shard') ||
        result.includes('_manifest') ||
        result.endsWith('.json') ||
        result.includes('tiny_face_detector') ||
        result.includes('face_landmark_68'))
    ) {
      if (result.endsWith('/') && result !== '/') {
        const fixed = result.slice(0, -1);
        console.log('🔧 [String.concat Patch] Fixed URL:', result, '→', fixed);
        return fixed;
      }
    }
    return result;
  };

  // AGGRESSIVE: Patch Array.prototype.join to catch URL construction via array joining
  const originalJoin = Array.prototype.join;
  Array.prototype.join = function (separator) {
    const result = originalJoin.call(this, separator);
    if (
      result &&
      (result.includes('/models/') || result.includes('models/')) &&
      (result.includes('-shard') ||
        result.includes('_manifest') ||
        result.endsWith('.json') ||
        result.includes('tiny_face_detector') ||
        result.includes('face_landmark_68'))
    ) {
      if (result.endsWith('/') && result !== '/') {
        const fixed = result.slice(0, -1);
        console.log('🔧 [Array.join Patch] Fixed URL:', result, '→', fixed);
        return fixed;
      }
    }
    return result;
  };

  console.log('✅ [Model Interceptor] All interceptors set up successfully.');
  console.log('✅ [Model Interceptor] window.fetch patched:', window.fetch !== originalFetch);
  console.log(
    '✅ [Model Interceptor] XMLHttpRequest.prototype.open patched:',
    XMLHttpRequest.prototype.open !== originalXHROpen
  );
  console.log('✅ [Model Interceptor] URL constructor patched:', window.URL !== originalURL);
})();


