import React from 'react';
import { Typography } from 'antd';
import DynamicQuestionDisplay from './DynamicQuestionDisplay';
import { Question } from '../../services/questionApi';

const { Text } = Typography;

interface DynamicQuestionContentProps {
  currentQuestions: Question[];
  currentQuestionsLoading: boolean;
  currentQuestionsError: string | null;
  currentQuestionIndex: number;
  questionAnswers: Record<string, unknown>;
  onAnswerChange: (questionId: string, answer: unknown) => void;
  onForceSaveAnswer?: (questionId: string) => Promise<void>;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  onEndSection?: () => void;
  onCompleteSection?: () => void;
  onSaveAll?: () => void | Promise<void>;
  isSavingSection?: boolean;
  displayName: string;
  hasPreviousQuestion: boolean;
  globalQuestionNumber: number;
  totalQuestionsInSection: number;
  isLastSection?: boolean;
  isLastQuestionOfSection?: boolean;
  hasNextSection?: boolean;
  onFlagQuestion?: (questionId: string) => void;
  isQuestionFlagged?: boolean;
}

const DynamicQuestionContent: React.FC<DynamicQuestionContentProps> = ({
  currentQuestions,
  currentQuestionsLoading,
  currentQuestionsError,
  currentQuestionIndex,
  questionAnswers,
  onAnswerChange,
  onForceSaveAnswer,
  goToNextQuestion,
  goToPreviousQuestion,
  onEndSection,
  onCompleteSection,
  onSaveAll,
  isSavingSection = false,
  displayName,
  hasPreviousQuestion,
  globalQuestionNumber: _globalQuestionNumber,
  totalQuestionsInSection: _totalQuestionsInSection,
  isLastSection = false,
  isLastQuestionOfSection = false,
  hasNextSection = false,
  onFlagQuestion,
  isQuestionFlagged = false,
}) => {
  if (currentQuestionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-8">
          <Text className="text-white animate-pulse text-lg">
            Loading {displayName} questions...
          </Text>
        </div>
      </div>
    );
  }

  if (currentQuestionsError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-8">
          <Text className="text-red-400 text-lg">
            Error loading questions: {currentQuestionsError}
          </Text>
        </div>
      </div>
    );
  }

  if (currentQuestions.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-8">
          <Text className="text-white text-lg">
            No {displayName} questions available
          </Text>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const hasNext = currentQuestionIndex < currentQuestions.length - 1;
  const showSubmitButton = isLastSection && isLastQuestionOfSection;
  const showEndSectionButton = isLastQuestionOfSection && !isLastSection && hasNextSection;
  
  // Debug logging
  if (showEndSectionButton) {
    console.log("🔖 End Section button should be visible:", {
      isLastQuestionOfSection,
      isLastSection,
      hasNextSection,
      showEndSectionButton,
    });
  }

  return (
    <div className="p-6">
      {/* Question Navigation */}
      {/* <div className="flex items-center justify-end gap-4 mb-6">
        <Button
          type="text"
          onClick={goToNextQuestion}
          className="!text-white !opacity-70 hover:!opacity-100"
        >
          Skip
        </Button>
      </div> */}


      {/* Current Question */}
      {currentQuestion && (
        <DynamicQuestionDisplay
          question={currentQuestion}
          onAnswerChange={onAnswerChange}
          selectedAnswer={
            questionAnswers[currentQuestion.question_id]
          }
          onPrevious={goToPreviousQuestion}
          onNext={showEndSectionButton ? undefined : async () => {
            // Before navigating, ensure current answer is saved immediately
            // The answer should already be in questionAnswers state
            const currentAnswer = questionAnswers[currentQuestion.question_id];
            if (currentAnswer !== undefined && currentAnswer !== null) {
              // Force save the answer immediately before navigation
              if (onForceSaveAnswer) {
                await onForceSaveAnswer(currentQuestion.question_id);
              } else {
                // Fallback: trigger save by calling onAnswerChange
                onAnswerChange(currentQuestion.question_id, currentAnswer);
                // Give a small delay to ensure the save is initiated
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }
            
            if (hasNext) {
              goToNextQuestion();
              return;
            }

            if (onEndSection) {
              await onEndSection();
            }

            goToNextQuestion();
          }}
          onSkip={async () => {
            goToNextQuestion();
          }}
          hasPrevious={hasPreviousQuestion}
          loading={isSavingSection && !hasNext}
          showSubmitButton={showSubmitButton}
          showEndSectionButton={showEndSectionButton}
          onCompleteSection={onCompleteSection}
          onEndSection={showEndSectionButton ? onEndSection : undefined}
          onSaveAll={onSaveAll}
          globalQuestionNumber={_globalQuestionNumber}
          questionTimer={120} // Default 2 minutes per question, can be made dynamic
          onFlagQuestion={onFlagQuestion}
          isFlagged={isQuestionFlagged}
        />
      )}
    </div>
  );
};

export default DynamicQuestionContent;
