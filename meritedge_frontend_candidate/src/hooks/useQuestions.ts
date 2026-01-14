import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCurrentQuestions, 
  setCurrentQuestionsLoading, 
  setCurrentQuestionsError 
} from '../store/miscSlice';
import { fetchQuestionsByIds, getQuestionsByType } from '../services/questionApi';

const extractSections = (source: any): any[] => {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source;
  }

  if (Array.isArray(source?.sections)) {
    return source.sections;
  }

  if (Array.isArray(source?.assessment_summary?.sections)) {
    return source.assessment_summary.sections;
  }

  if (Array.isArray(source?.data?.sections)) {
    return source.data.sections;
  }

  return [];
};

const collectQuestionIdsByType = (sections: any[]) => {
  const questionIdsByType: Record<string, string[]> = {};

  sections.forEach((section) => {
    if (!section?.question_types) {
      return;
    }

    section.question_types.forEach((qt: any) => {
      if (!qt?.type) {
        return;
      }

      if (!questionIdsByType[qt.type]) {
        questionIdsByType[qt.type] = [];
      }

      const ids = Array.isArray(qt?.question_ids) ? qt.question_ids : [];
      ids.forEach((id: string) => {
        if (!id) {
          return;
        }

        if (!questionIdsByType[qt.type].includes(id)) {
          questionIdsByType[qt.type].push(id);
        }
      });
    });
  });

  return questionIdsByType;
};

export const useQuestions = () => {
  const dispatch = useDispatch();
  
  // Get data from store
  const assessmentSummary = useSelector((state: any) => state.misc?.assessmentSummary);
  const assessmentStarted = useSelector((state: any) => state.misc?.assessmentStarted);
  const authToken = useSelector((state: any) => state.misc?.authToken);
  const currentQuestions = useSelector((state: any) => state.misc?.currentQuestions);
  const currentQuestionsLoading = useSelector((state: any) => state.misc?.currentQuestionsLoading);
  const currentQuestionsError = useSelector((state: any) => state.misc?.currentQuestionsError);

  // Fetch questions by type
  const fetchQuestionsByType = useCallback(async (questionType: string) => {
    console.log('fetchQuestionsByType called with:', { questionType, assessmentSummary: !!assessmentSummary, authToken: !!authToken });
    
    if (!assessmentSummary || !authToken) {
      console.warn('Assessment summary or auth token not available', { assessmentSummary: !!assessmentSummary, authToken: !!authToken });
      return;
    }

    try {
      dispatch(setCurrentQuestionsLoading(true));
      dispatch(setCurrentQuestionsError(null));
      
      // Get question IDs for this type from assessment summary and started data
      // Filter by active section if available (from localStorage or state)
      const activeSectionId = localStorage.getItem(`selected_section_id_${(window as any).candidate_id || ''}`) || 
                              (assessmentSummary as any)?._activeSectionId || null;
      
      // Filter assessment summary by active section before getting questions by type
      let filteredAssessmentSummary = assessmentSummary;
      if (activeSectionId && assessmentSummary?.sections) {
        const filteredSections = assessmentSummary.sections.filter(
          (section: any) => section.section_id === activeSectionId
        );
        filteredAssessmentSummary = {
          ...assessmentSummary,
          sections: filteredSections,
        };
      }
      
      const questionsByType = getQuestionsByType(filteredAssessmentSummary);
      
      // Also filter started sections by active section
      const startedSections = extractSections(assessmentStarted);
      const filteredStartedSections = activeSectionId 
        ? startedSections.filter((section: any) => section.section_id === activeSectionId)
        : startedSections;
      const startedQuestionIdsByType = collectQuestionIdsByType(filteredStartedSections);

      const mergedQuestionIds = new Set<string>(
        questionsByType[questionType] || []
      );

      (startedQuestionIdsByType[questionType] || []).forEach((id) =>
        mergedQuestionIds.add(id)
      );

      const questionIds = Array.from(mergedQuestionIds);
      
      console.log(`Filtered questions for section ${activeSectionId}, type ${questionType}:`, questionIds);
      
      console.log(`Fetching questions for type ${questionType}:`, questionIds);
      
      if (!questionIds || questionIds.length === 0) {
        console.log(`No question IDs found for type ${questionType}`);
        dispatch(setCurrentQuestions([]));
        return;
      }

      // Fetch the actual questions using the API
      const questions = await fetchQuestionsByIds(questionIds, authToken);
      console.log(`Fetched ${questions.length} questions for type ${questionType}:`, questions);
      dispatch(setCurrentQuestions(questions));
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      dispatch(setCurrentQuestionsError(error instanceof Error ? error.message : 'Failed to fetch questions'));
      dispatch(setCurrentQuestions([]));
    } finally {
      dispatch(setCurrentQuestionsLoading(false));
    }
  }, [assessmentSummary, assessmentStarted, authToken, dispatch]);

  // Clear current questions
  const clearCurrentQuestions = useCallback(() => {
    dispatch(setCurrentQuestions([]));
    dispatch(setCurrentQuestionsError(null));
  }, [dispatch]);

  // Get available question types from assessment summary
  const getAvailableQuestionTypes = useCallback(() => {
    const summaryTypes = getQuestionsByType(assessmentSummary);
    const startedTypes = collectQuestionIdsByType(
      extractSections(assessmentStarted)
    );

    const merged: Record<string, string[]> = {};

    const addToMerged = (source: Record<string, string[]>) => {
      Object.entries(source).forEach(([type, ids]) => {
        if (!merged[type]) {
          merged[type] = [];
        }
        ids.forEach((id) => {
          if (!merged[type].includes(id)) {
            merged[type].push(id);
          }
        });
      });
    };

    addToMerged(summaryTypes || {});
    addToMerged(startedTypes || {});

    return merged;
  }, [assessmentSummary, assessmentStarted]);

  return {
    currentQuestions,
    currentQuestionsLoading,
    currentQuestionsError,
    fetchQuestionsByType,
    clearCurrentQuestions,
    getAvailableQuestionTypes,
    assessmentSummary,
    authToken
  };
};
