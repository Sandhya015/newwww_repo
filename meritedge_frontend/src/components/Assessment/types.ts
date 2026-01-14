/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AssessmentData {
  settings: any;
  sections: any;
  unique_id: string;
  title: string;
  description: string;
  assessment_type: string;
  difficulty_level: string;
  target_experience?: string;
  status: "draft" | "active" | "inactive";
  created_at: string;
  updated_at: string;
  section_count: string;
  question_count: string;
  total_score: string;
  total_duration: string | null;
  total_gaps: number;
  total_with_gaps: number | null;
  total_invited?: number;
  total_completed?: number;
  invite_start_date?: string;
  invite_end_date?: string;
}

export interface ApiResponse {
  assessments: AssessmentData[];
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  sorting?: {
    sort_by: string;
    sort_order: string;
  };
  count?: number;
  total?: number;
  total_count?: number;
  last_evaluated_key: string | null;
  has_more: boolean;
}

export interface TestDataType {
  key: React.Key;
  unique_id: string;
  name: string;
  testCode: string;
  invited: number;
  taken: number;
  sections: number;
  questions: number;
  created: string;
  ends: string;
  createdBy: string;
  status: "Draft" | "Active" | "Inactive";
}

export type FetchAssessmentsFn = (
  page?: number,
  size?: number,
  resetData?: boolean,
  customSortField?: string,
  customSortOrder?: "ascend" | "descend" | null
) => Promise<void>;

export const INITIAL_FILTERS = {
  status: "",
  createdBy: "",
  timeRange: "",
  date_from: "",
  date_to: "",
};

export const DEFAULT_ASSESSMENT_TYPE = {
  label: "Cognitive",
  code: "Cognitive",
} as const;

