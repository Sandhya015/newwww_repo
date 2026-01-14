/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// User interface based on login response
interface User {
  unique_id: string;
  full_name: string;
  email: string;
  phone: string;
  country_code: string;
  company_id: string;
  designation: string;
  role: string;
  status: string;
  preferred_language: string;
  preferred_timezone: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  has_profile_picture: boolean;
  is_verified: boolean;
  force_password_change: boolean;
  password_changed_at: string;
  hierarchy_level: number;
  can_manage_users: boolean;
  max_sub_users: number;
}

// Auth interface
interface AuthData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Assessment interface for created assessments
interface Assessment {
  section_id: any;
  sectionData: any;
  key: any;
  unique_id: string;
  title: string;
  target_role?: string;
  skills_required?: string[];
  target_experience?: string;
  description?: string;
  assessment_type: string;
  difficulty_level: string;
  status: string;
  company_id?: string;
  created_by?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
  section_count: number;
  question_count: number;
  total_score: number;
  total_duration?: string | null;
  total_gaps?: number;
  total_with_gaps?: number | null;
  settings?: any;
  sections?: Array<{
    section_id: number;
    unique_id: string;
    assessment_id: string;
    section_name: string;
    section_order: number;
    description: string;
    instructions?: string;
    question_count: number;
    total_score: number;
    effective_duration?: string | null;
    calculated_duration?: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}

// Store state interface
interface MiscState {
  value: number;
  resumeParsedDetails: any;
  user: User | null;
  auth: AuthData | null;
  isAuthenticated: boolean;
  currentAssessment: Assessment | null; // New field for current assessment
}

const initialState: MiscState = {
  value: 0,
  resumeParsedDetails: null,
  user: null,
  auth: null,
  isAuthenticated: false,
  currentAssessment: null
};

const miscSlice = createSlice({
  name: 'misc',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    updateResumeParsedDetails: (state, action: PayloadAction<any>) => {
      state.resumeParsedDetails = action.payload.resumeParsedDetails;
    },
    // User management actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAuth: (state, action: PayloadAction<AuthData>) => {
      state.auth = action.payload;
    },
    loginUser: (state, action: PayloadAction<{ user: User; auth: AuthData }>) => {
      state.user = action.payload.user;
      state.auth = action.payload.auth;
      state.isAuthenticated = true;
    },
    logoutUser: (state) => {
      state.user = null;
      state.auth = null;
      state.isAuthenticated = false;
      state.currentAssessment = null;
      state.resumeParsedDetails = null;
      state.value = 0;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setCurrentAssessment: (state, action: any) => {
      state.currentAssessment = action.payload;
    },
    clearCurrentAssessment: (state) => {
      state.currentAssessment = null;
    }
  },
});

export const { 
  increment, 
  decrement, 
  incrementByAmount, 
  updateResumeParsedDetails,
  setUser,
  setAuth,
  loginUser,
  logoutUser,
  updateUser,
  setCurrentAssessment,
  clearCurrentAssessment
} = miscSlice.actions;

// Selectors for easy access to store data
export const selectUser = (state: { misc: MiscState }) => state.misc.user;
export const selectAuth = (state: { misc: MiscState }) => state.misc.auth;
export const selectIsAuthenticated = (state: { misc: MiscState }) => state.misc.isAuthenticated;
export const selectCurrentAssessment = (state: { misc: MiscState }) => state.misc.currentAssessment;

// Custom hook for using user data (can be imported and used in components)
export const useUserData = () => {
  // This would be used with useSelector in components
  // Example: const user = useSelector(selectUser);
  // Example: const isAuthenticated = useSelector(selectIsAuthenticated);
  return {
    selectUser,
    selectAuth,
    selectIsAuthenticated,
    selectCurrentAssessment
  };
};

export default miscSlice.reducer;
