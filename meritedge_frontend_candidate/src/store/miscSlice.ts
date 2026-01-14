/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cleanCandidateId } from '../utils/candidateIdUtils';

// Question Types interfaces
export interface QuestionTypeMetadata {
  category_id: string | null;
  original_code: string;
}

export interface QuestionType {
  entity_type: string;
  code: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  metadata: QuestionTypeMetadata;
}

// Assessment Summary interfaces
export interface CustomField {
  enabled: boolean;
  id: string;
  label: string;
  options: any[];
  order: number;
  required: boolean;
  type: string;
}

export interface StandardField {
  enabled: boolean;
  options: any[];
  order: number;
  required: boolean;
  type: string;
}

export interface CandidateDetails {
  custom_fields: CustomField[];
  standard_fields: {
    pan_number: StandardField;
    full_name: StandardField;
    passport: StandardField;
    date_of_birth: StandardField;
    percentage_cgpa: StandardField;
    mobile_number: StandardField;
    notice_period: StandardField;
    email: StandardField;
    aadhar_number: StandardField;
  };
}

export interface CutOffMarks {
  percentage: number;
}

export interface GeneralSettings {
  candidate_details: CandidateDetails;
  cut_off_marks: CutOffMarks;
}

export interface AssessmentOverview {
  total_questions: number;
  total_duration_minutes: number;
  general_settings: GeneralSettings;
}

export interface QuestionTypeInfo {
  type: string;
  count: number;
  question_ids: string[];
}

export interface ProctoringSettings {
  ai_assistance: { enable: boolean; order: number };
  audio_analysis: { enable: boolean; order: number };
  auto_calculate_duration: { enable: boolean; order: number };
  candidate_location: { enable: boolean; order: number };
  capture_screenshot: { enable: boolean; order: number };
  disable_copy_paste: { enable: boolean; order: number };
  disable_screen_extension: { enable: boolean; order: number };
  eyeball_detection: { enable: boolean; order: number };
  face_analysis: { enable: boolean; order: number };
  resume_test: { enable: boolean; order: number };
  screen_recording: { enable: boolean; order: number };
  shuffle_questions: { enable: boolean; order: number };
}

export interface Section {
  section_id: string;
  section_name: string;
  duration_minutes: number;
  question_types: QuestionTypeInfo[];
  proctoring: ProctoringSettings;
}

export interface PresignedPostFields {
  "Content-Type": string;
  key: string;
  "x-amz-algorithm": string;
  "x-amz-credential": string;
  "x-amz-date": string;
  "x-amz-security-token": string;
  policy: string;
  "x-amz-signature": string;
}

export interface PresignedPost {
  url: string;
  fields: PresignedPostFields;
}

export interface PresignedUrl {
  folder_path: string;
  upload_url: string;
  presigned_post: PresignedPost;
  expires_in_seconds: number;
}

export interface PresignedUrls {
  candidate_image: PresignedUrl;
  screencapture_video: PresignedUrl;
  screencapture_image: PresignedUrl;
  audio_video: PresignedUrl;
  audio_video_responses: PresignedUrl;
}

export interface AssessmentSummary {
  assessment_name: string;
  assessment_overview: AssessmentOverview;
  sections: Section[];
  storage_path: string;
  presigned_urls: PresignedUrls;
}

const initialState: any = {
  value: 0,
  resumeParsedDetails: null,
  candidate_id: null,
  authToken: null as string | null,
  tokenValidation: null as any,
  tokenValidationLoading: false,
  tokenValidationError: null,
  secureMode: false,
  secureModeLoading: false,
  questionTypes: [] as QuestionType[],
  questionTypesLoading: false,
  questionTypesError: null,
  assessmentSummary: null as AssessmentSummary | null,
  assessmentSummaryLoading: false,
  assessmentSummaryError: null,
  assessmentStarted: null as any,
  assessmentStartLoading: false,
  assessmentStartError: null,
  capturedImageBlob: null as Blob | null,
  capturedImagePreview: null as string | null,
  questions: [] as any[],
  questionsLoading: false,
  questionsError: null,
  currentQuestions: [] as any[],
  currentQuestionsLoading: false,
  currentQuestionsError: null
};

const exampleSlice = createSlice({
  name: 'misc',
  initialState,
  reducers: {
    increment: (state: any) => {
      state.value += 1;
    },
    decrement: (state: any) => {
      state.value -= 1;
    },
    incrementByAmount: (state: any, action: PayloadAction<any>) => {
      state.value += action.payload;
    },
    updateResumeParsedDetails: (state: any, action: PayloadAction<any>) => state.resumeParsedDetails = action.payload.resumeParsedDetails,
    setCandidateId: (state: any, action: PayloadAction<string>) => {
      // Ensure candidate_id is stored as a clean string without extra quotes
      state.candidate_id = cleanCandidateId(action.payload);
    },
    clearCandidateId: (state: any) => {
      state.candidate_id = null;
    },
    setQuestionTypes: (state: any, action: PayloadAction<QuestionType[]>) => {
      state.questionTypes = action.payload;
      state.questionTypesLoading = false;
      state.questionTypesError = null;
    },
    setQuestionTypesLoading: (state: any, action: PayloadAction<boolean>) => {
      state.questionTypesLoading = action.payload;
      if (action.payload) {
        state.questionTypesError = null;
      }
    },
    setQuestionTypesError: (state: any, action: PayloadAction<string | null>) => {
      state.questionTypesError = action.payload;
      state.questionTypesLoading = false;
    },
    setAssessmentSummary: (state: any, action: PayloadAction<AssessmentSummary>) => {
      state.assessmentSummary = action.payload;
      state.assessmentSummaryLoading = false;
      state.assessmentSummaryError = null;
    },
    setAssessmentSummaryLoading: (state: any, action: PayloadAction<boolean>) => {
      state.assessmentSummaryLoading = action.payload;
      if (action.payload) {
        state.assessmentSummaryError = null;
      }
    },
    setAssessmentSummaryError: (state: any, action: PayloadAction<string | null>) => {
      state.assessmentSummaryError = action.payload;
      state.assessmentSummaryLoading = false;
    },
    setAssessmentStarted: (state: any, action: PayloadAction<any>) => {
      state.assessmentStarted = action.payload;
      state.assessmentStartLoading = false;
      state.assessmentStartError = null;
    },
    setAssessmentStartLoading: (state: any, action: PayloadAction<boolean>) => {
      state.assessmentStartLoading = action.payload;
      if (action.payload) {
        state.assessmentStartError = null;
      }
    },
    setAssessmentStartError: (state: any, action: PayloadAction<string | null>) => {
      state.assessmentStartError = action.payload;
      state.assessmentStartLoading = false;
    },
    clearAssessmentStart: (state: any) => {
      state.assessmentStarted = null;
      state.assessmentStartLoading = false;
      state.assessmentStartError = null;
    },
    setCapturedImageBlob: (state: any, action: PayloadAction<Blob | null>) => {
      state.capturedImageBlob = action.payload;
    },
    setCapturedImagePreview: (state: any, action: PayloadAction<string | null>) => {
      state.capturedImagePreview = action.payload;
    },
    clearCapturedImage: (state: any) => {
      state.capturedImageBlob = null;
      state.capturedImagePreview = null;
    },
    setAuthToken: (state: any, action: PayloadAction<string | null>) => {
      state.authToken = action.payload;
    },
    clearAuthToken: (state: any) => {
      state.authToken = null;
    },
    setTokenValidation: (state: any, action: PayloadAction<any>) => {
      state.tokenValidation = action.payload;
    },
    setTokenValidationLoading: (state: any, action: PayloadAction<boolean>) => {
      state.tokenValidationLoading = action.payload;
    },
    setTokenValidationError: (state: any, action: PayloadAction<string | null>) => {
      state.tokenValidationError = action.payload;
      state.tokenValidationLoading = false;
    },
    clearTokenValidation: (state: any) => {
      state.tokenValidation = null;
      state.tokenValidationLoading = false;
      state.tokenValidationError = null;
    },
    setSecureMode: (state: any, action: PayloadAction<boolean>) => {
      state.secureMode = action.payload;
    },
    setSecureModeLoading: (state: any, action: PayloadAction<boolean>) => {
      state.secureModeLoading = action.payload;
    },
    enableSecureMode: (state: any) => {
      state.secureMode = true;
      state.secureModeLoading = false;
    },
    disableSecureMode: (state: any) => {
      state.secureMode = false;
      state.secureModeLoading = false;
    },
    setQuestions: (state: any, action: PayloadAction<any[]>) => {
      state.questions = action.payload;
      state.questionsLoading = false;
      state.questionsError = null;
    },
    setQuestionsLoading: (state: any, action: PayloadAction<boolean>) => {
      state.questionsLoading = action.payload;
      if (action.payload) {
        state.questionsError = null;
      }
    },
    setQuestionsError: (state: any, action: PayloadAction<string | null>) => {
      state.questionsError = action.payload;
      state.questionsLoading = false;
    },
    setCurrentQuestions: (state: any, action: PayloadAction<any[]>) => {
      state.currentQuestions = action.payload;
      state.currentQuestionsLoading = false;
      state.currentQuestionsError = null;
    },
    setCurrentQuestionsLoading: (state: any, action: PayloadAction<boolean>) => {
      state.currentQuestionsLoading = action.payload;
      if (action.payload) {
        state.currentQuestionsError = null;
      }
    },
    setCurrentQuestionsError: (state: any, action: PayloadAction<string | null>) => {
      state.currentQuestionsError = action.payload;
      state.currentQuestionsLoading = false;
    },
    clearQuestions: (state: any) => {
      state.questions = [];
      state.questionsLoading = false;
      state.questionsError = null;
      state.currentQuestions = [];
      state.currentQuestionsLoading = false;
      state.currentQuestionsError = null;
    },
    // Clear entire store (reset to initial state except candidate_id and authToken)
    clearStoreData: (state: any) => {
      // Reset all state to initial values except candidate_id and authToken
      state.tokenValidation = null;
      state.tokenValidationLoading = false;
      state.tokenValidationError = null;
      state.secureMode = false;
      state.secureModeLoading = false;
      state.questionTypes = [];
      state.questionTypesLoading = false;
      state.questionTypesError = null;
      state.assessmentSummary = null;
      state.assessmentSummaryLoading = false;
      state.assessmentSummaryError = null;
      state.assessmentStarted = null;
      state.assessmentStartLoading = false;
      state.assessmentStartError = null;
      state.capturedImageBlob = null;
      state.capturedImagePreview = null;
      state.questions = [];
      state.questionsLoading = false;
      state.questionsError = null;
      state.currentQuestions = [];
      state.currentQuestionsLoading = false;
      state.currentQuestionsError = null;
    }
  },
});

export const { 
  increment, 
  decrement, 
  incrementByAmount, 
  updateResumeParsedDetails, 
  setCandidateId,
  clearCandidateId,
  setAuthToken,
  clearAuthToken,
  setTokenValidation,
  setTokenValidationLoading,
  setTokenValidationError,
  clearTokenValidation,
  setSecureMode,
  setSecureModeLoading,
  enableSecureMode,
  disableSecureMode,
  setQuestionTypes,
  setQuestionTypesLoading,
  setQuestionTypesError,
  setAssessmentSummary,
  setAssessmentSummaryLoading,
  setAssessmentSummaryError,
  setAssessmentStarted,
  setAssessmentStartLoading,
  setAssessmentStartError,
  clearAssessmentStart,
  setCapturedImageBlob,
  setCapturedImagePreview,
  clearCapturedImage,
  setQuestions,
  setQuestionsLoading,
  setQuestionsError,
  setCurrentQuestions,
  setCurrentQuestionsLoading,
  setCurrentQuestionsError,
  clearQuestions,
  clearStoreData
} = exampleSlice.actions;
export default exampleSlice.reducer;
