/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints.
 * Uses environment-specific URLs based on build mode.
 * 
 * Environment URLs:
 * - Development: https://td0hukv040.execute-api.ap-south-1.amazonaws.com/api/v1
 * - Staging: https://5nlup2uesd.execute-api.ap-south-1.amazonaws.com/api/v1
 * - Production: https://5nlup2uesd.execute-api.ap-south-1.amazonaws.com/api/v1
 */

// Get the API URL from environment variables
// Falls back to production URL if not set
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://5nlup2uesd.execute-api.ap-south-1.amazonaws.com/api/v1';

// Log the current environment and API URL (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('🌐 API Base URL:', API_BASE_URL);
}

// API endpoints configuration
export const API_ENDPOINTS = {
  // Question endpoints
  question: {
    byId: (questionId: string) => `${API_BASE_URL}/candidate/question/${questionId}`,
  },
  
  // Masters endpoints
  masters: {
    questionTypes: `${API_BASE_URL}/masters/question-types`,
  },
  
  // Candidate endpoints
  candidate: {
    assessmentSummary: `${API_BASE_URL}/candidate/assessment_summary`,
    info: `${API_BASE_URL}/candidate/info`,
    answers: `${API_BASE_URL}/candidate/answers`,
    assessment: {
      start: `${API_BASE_URL}/candidate/assessment/start`,
      complete: `${API_BASE_URL}/candidate/assessment/complete`,
      completeSection: `${API_BASE_URL}/candidate/assessment/complete-section`,
      submit: `${API_BASE_URL}/candidate/assessment/submit`,
    },
    events: {
      tabSwitch: `${API_BASE_URL}/candidate/events/tab-switch`,
    },
  },
  
  // Auth endpoints
  auth: {
    validateToken: `${API_BASE_URL}/auth/validate-token`,
  },
} as const;

// Export a helper function to get the base URL
export const getApiBaseUrl = () => API_BASE_URL;

// Export environment information
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

