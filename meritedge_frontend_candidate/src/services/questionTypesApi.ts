import { QuestionType, AssessmentSummary } from '../store/miscSlice';
import { API_ENDPOINTS } from '../config/apiConfig';

// Function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid JWT format
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has exp claim and if it's expired
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    }
    
    return false; // No exp claim, assume valid
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't parse it, assume expired
  }
};

// Function to get auth token from Redux store
const getAuthToken = (): string => {
  try {
    // Get the token from localStorage (since Redux Persist stores it there)
    const persistedState = localStorage.getItem('persist:root');
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      
      // Check if misc key exists and is not undefined
      if (parsed.misc && parsed.misc !== 'undefined') {
        const miscState = JSON.parse(parsed.misc);
        return miscState.authToken || '';
      }
    }
  } catch (error) {
    console.error('Error parsing persisted state:', error);
  }
  return '';
};

export const fetchQuestionTypes = async (authToken?: string): Promise<QuestionType[]> => {
  try {
    // Use provided token or try to get from localStorage
    const token = authToken || getAuthToken();
    
    console.log('fetchQuestionTypes - authToken parameter:', authToken);
    console.log('fetchQuestionTypes - final token:', token);
    
    if (!token) {
      console.warn('No authentication token available, using fallback or returning empty array');
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.warn('Authentication token is expired, returning empty array');
      return [];
    }

    const response = await fetch(API_ENDPOINTS.masters.questionTypes, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid/expired
        const errorData = await response.json().catch(() => ({ detail: 'Invalid token' }));
        console.error('Authentication failed:', errorData);
        throw new Error('Authentication failed: Invalid or expired token');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QuestionType[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching question types:', error);
    throw error;
  }
};

export const fetchAssessmentSummary = async (authToken?: string): Promise<AssessmentSummary> => {
  try {
    // Use provided token or try to get from localStorage
    const token = authToken || getAuthToken();
    
    if (!token) {
      console.warn('No authentication token available for assessment summary');
      // Return null instead of throwing error to prevent app crash
      return null as any;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.warn('Authentication token is expired for assessment summary');
      return null as any;
    }

    const response = await fetch(API_ENDPOINTS.candidate.assessmentSummary, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid/expired
        const errorData = await response.json().catch(() => ({ detail: 'Invalid token' }));
        console.error('Authentication failed for assessment summary:', errorData);
        throw new Error('Authentication failed: Invalid or expired token');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AssessmentSummary = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching assessment summary:', error);
    throw error;
  }
};

// Token validation API
export const validateToken = async (token: string): Promise<any> => {
  try {
    console.log('Validating token:', token);
    
    const response = await fetch(API_ENDPOINTS.auth.validateToken, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Validation failed' }));
      console.error('Token validation failed:', errorData);
      throw new Error(`Token validation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Token validation response:', data);
    return data;
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
};

// Start Assessment API
export const startAssessment = async (token: string): Promise<any> => {
  try {
    console.log('Starting assessment with token:', token);
    const response = await fetch(API_ENDPOINTS.candidate.assessment.start, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: '' // Empty body as per the curl example
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Start assessment failed' }));
      console.error('Start assessment failed:', errorData);
      throw new Error(`Start assessment failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Start assessment response:', data);
    return data;
  } catch (error) {
    console.error('Error starting assessment:', error);
    throw error;
  }
};
