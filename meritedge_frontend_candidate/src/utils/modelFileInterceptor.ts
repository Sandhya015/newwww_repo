/**
 * Global interceptors for face-api.js model file requests
 * This module MUST be imported early to catch all model file requests
 * 
 * Fixes trailing slash issues where face-api.js adds trailing slashes
 * to model file URLs, causing 404 errors in deployment
 * 
 * CRITICAL: This file has side effects and MUST NOT be tree-shaken
 */

// Mark as side-effect module to prevent tree-shaking
export {}; // Ensure this is treated as a module

let interceptorsActive = false;

export const setupModelFileInterceptors = () => {
    if (interceptorsActive) {
        console.log('⚠️ Model file interceptors already active');
        return;
    }
    
    // Intercept fetch requests to fix trailing slash issues with model files
    const originalFetch = window.fetch;
    const fetchInterceptor = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url: string;
        let isRelative = false;
        let originalUrl = '';
        
        if (typeof input === 'string') {
            url = input;
            originalUrl = input;
            isRelative = !input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('//');
        } else if (input instanceof URL) {
            url = input.toString();
            originalUrl = url;
        } else {
            url = input.url;
            originalUrl = input.url;
            isRelative = !input.url.startsWith('http://') && !input.url.startsWith('https://') && !input.url.startsWith('//');
        }
        
        // Fix trailing slash issue for model files - check BEFORE any processing
        // Be very aggressive - check for /models/ path
        const isModelFile = url.includes('/models/') && (
            url.includes('-shard') || 
            url.endsWith('.json') || 
            url.includes('tiny_face_detector') || 
            url.includes('face_landmark_68') ||
            url.match(/\/models\/.*-shard/) // Regex for any shard file
        );
        
        if (isModelFile) {
            // Log ALL model file requests for debugging
            console.log('🔍 [Interceptor] Model file request detected:', url);
            
            // Always remove trailing slash for model files - be very aggressive
            let fixedUrl = url;
            
            // Simple check first - if it ends with /, remove it
            if (url.endsWith('/') && url !== '/') {
                fixedUrl = url.slice(0, -1);
                console.log('🔧 [Interceptor] Removed trailing slash:', url, '→', fixedUrl);
            } else {
                // Try parsing for absolute URLs to be thorough
                try {
                    if (!isRelative && (url.startsWith('http://') || url.startsWith('https://'))) {
                        const urlObj = new URL(url);
                        if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
                            urlObj.pathname = urlObj.pathname.slice(0, -1);
                            fixedUrl = urlObj.toString();
                            console.log('🔧 [Interceptor] Fixed pathname in absolute URL:', url, '→', fixedUrl);
                        }
                    }
                } catch (e) {
                    // If parsing fails, the simple string fix above should have caught it
                    console.warn('⚠️ [Interceptor] URL parsing failed, using string fix:', e);
                }
            }
            
            // Always use the fixed URL
            if (fixedUrl !== originalUrl) {
                console.log('✅ [Interceptor] Using fixed URL:', fixedUrl);
                url = fixedUrl;
            } else {
                console.log('✅ [Interceptor] URL already correct (no trailing slash)');
            }
        }
        
        // Use the fixed URL
        if (typeof input === 'string') {
            return originalFetch(url, init);
        } else if (input instanceof URL) {
            return originalFetch(new URL(url), init);
        } else {
            const newRequest = new Request(url, input);
            return originalFetch(newRequest, init);
        }
    };
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
        let fixedUrl = url;
        const urlString = typeof url === 'string' ? url : url.toString();
        const isModelFile = urlString.includes('/models/') && (
            urlString.includes('-shard') || 
            urlString.endsWith('.json') || 
            urlString.includes('tiny_face_detector') || 
            urlString.includes('face_landmark_68')
        );
        
        if (isModelFile && urlString.endsWith('/') && urlString !== '/') {
            fixedUrl = urlString.slice(0, -1);
            console.log('🔧 [Interceptor] Fixed trailing slash in XHR model URL:', urlString, '→', fixedUrl);
        }
        
        return originalXHROpen.call(this, method, fixedUrl, ...args);
    };
    
    // Replace fetch
    window.fetch = fetchInterceptor as typeof fetch;
    interceptorsActive = true;
    
    // Verify interceptors are working by testing
    console.log('✅ Model file interceptors activated globally');
    console.log('🔍 [Interceptor] Testing interceptor...');
    
    // Test that fetch is actually replaced
    if (window.fetch === fetchInterceptor) {
        console.log('✅ [Interceptor] Fetch successfully replaced');
    } else {
        console.error('❌ [Interceptor] FAILED: Fetch was not replaced!');
    }
    
    // Test that XHR is replaced
    if (XMLHttpRequest.prototype.open !== originalXHROpen) {
        console.log('✅ [Interceptor] XMLHttpRequest.open successfully replaced');
    } else {
        console.error('❌ [Interceptor] FAILED: XMLHttpRequest.open was not replaced!');
    }
};

// CRITICAL: Set up interceptors immediately when this module loads
// This MUST execute as a side effect - don't rely on imports
(function setupInterceptorsImmediately() {
    if (typeof window === 'undefined') {
        // SSR - wait for window
        if (typeof document !== 'undefined') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🔍 [Interceptor] DOMContentLoaded - setting up interceptors');
                setupModelFileInterceptors();
            });
        }
        return;
    }
    
    // Browser - set up immediately
    console.log('🚀 [Interceptor] Module loaded, setting up interceptors...');
    setupModelFileInterceptors();
    
    // Backup: Also set up on DOMContentLoaded if document is still loading
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔍 [Interceptor] DOMContentLoaded - verifying interceptors are active');
            if (!interceptorsActive) {
                console.warn('⚠️ [Interceptor] Interceptors not active on DOMContentLoaded, re-setting up...');
                setupModelFileInterceptors();
            }
        });
    }
})();

