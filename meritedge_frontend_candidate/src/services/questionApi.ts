import { AssessmentSummary } from '../store/miscSlice';
import { API_ENDPOINTS } from '../config/apiConfig';

export interface QuestionOption {
  text: string;
}

export interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  question_type_label: string;
  max_score: number;
  time_limit: number;
  shuffle_options: boolean;
  description: string;
  hints: string[];
  options: QuestionOption[];
  question_assets: Record<string, any>;
  answer_format: string | null;
  languages: string[];
  test_cases: any[];
  expected_output: string | null;
  skill: string;
  domain: string;
  difficulty_level: string;
  tags: string[];
  concept: string[];
  category_id: string;
  order: number | null;
  is_required: boolean | null;
  status: string;
  version: number;
  // Additional fields that may come from API
  id?: string;
  candidate_answer?: string;
  candidate_answer_html?: string;
  question_title?: string;
  category?: string[];
  [key: string]: any; // Allow additional properties
}

export const fetchQuestionById = async (questionId: string, authToken: string): Promise<Question> => {
  try {
    const response = await fetch(API_ENDPOINTS.question.byId(questionId), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch question: ${response.status} ${response.statusText}`);
    }

    const question: Question = await response.json();
    return question;
  } catch (error) {
    console.error(`Error fetching question ${questionId}:`, error);
    throw error;
  }
};

export const fetchQuestionsByIds = async (questionIds: string[], authToken: string): Promise<Question[]> => {
  try {
    // Fetch all questions in parallel
    const questionPromises = questionIds.map(id => fetchQuestionById(id, authToken));
    const questions = await Promise.all(questionPromises);
    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const getQuestionIdsFromAssessmentSummary = (assessmentSummary: AssessmentSummary): string[] => {
  const questionIds: string[] = [];
  
  if (!assessmentSummary?.sections) {
    return questionIds;
  }

  assessmentSummary.sections.forEach(section => {
    if (section.question_types && Array.isArray(section.question_types)) {
      section.question_types.forEach(questionType => {
        if (questionType.question_ids && Array.isArray(questionType.question_ids)) {
          questionIds.push(...questionType.question_ids);
        }
      });
    }
  });

  return questionIds;
};

export const getQuestionsByType = (assessmentSummary: AssessmentSummary): Record<string, string[]> => {
  const questionsByType: Record<string, string[]> = {};
  
  if (!assessmentSummary?.sections) {
    return questionsByType;
  }

  assessmentSummary.sections.forEach(section => {
    if (section.question_types && Array.isArray(section.question_types)) {
      section.question_types.forEach(questionType => {
        if (questionType.question_ids && Array.isArray(questionType.question_ids) && questionType.question_ids.length > 0) {
          const type = questionType.type;
          if (!questionsByType[type]) {
            questionsByType[type] = [];
          }
          questionsByType[type].push(...questionType.question_ids);
        }
      });
    }
  });

  return questionsByType;
};
