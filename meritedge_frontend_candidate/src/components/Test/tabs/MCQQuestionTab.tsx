// import { Button } from "antd";

// Component
import MCQQuestion from "../questions/MCQQuestion";

export default function MCQQuestionTab({ props }: { props: any }) {
  const {
    activeMCQQuestionKey,
    setActiveMCQQuestionKey,
    loadingQuestion,
    datas = [],
    totalQuestions = 0,
    onAnswerSubmitted,
    sectionName: _sectionName,
    sectionQuestionCount: _sectionQuestionCount,
    globalOffset = 0,
    totalQuestionsInSection = totalQuestions,
    onGlobalNext,
    onGlobalPrevious,
    isLastSection = false,
    isLastQuestionOfSection = false,
    hasNextSection = false,
    onCompleteSection,
    onEndSection,
    onSaveAll,
  } = props || {};

  const totalCount = datas.length;

  if (totalCount === 0) {
    return null;
  }

  const currentIndex = Math.max(
    0,
    datas.findIndex((item: any) => item?.id === activeMCQQuestionKey)
  );
  const currentQuestion = datas[currentIndex] ?? datas[0];
  const isLoading = loadingQuestion === currentQuestion?.id;
  const previousItem = datas[currentIndex - 1];
  const nextItem = datas[currentIndex + 1];
  const questionNumber = globalOffset + currentIndex + 1;
  const hasPrevious = currentIndex > 0 || globalOffset > 0;
  // Check if this is the last MCQ question (no next item in the MCQ list)
  const isLastMCQQuestion = !nextItem;
  // For section completion, we need to be on the last question of the section
  // This is true if: no next MCQ question AND we're on the last tab (isLastQuestionOfSection)
  const isLastQuestion = isLastMCQQuestion && isLastQuestionOfSection;
  const showSubmitButton = isLastSection && isLastQuestion;
  const showEndSectionButton = isLastQuestion && !isLastSection && hasNextSection;
  const questionLabel =
    currentQuestion?.question_type_label ||
    currentQuestion?.question_type_name ||
    "MCQ";

  const navigateToQuestion = (target?: any) => {
    if (target?.id) {
      setActiveMCQQuestionKey?.(target.id);
    }
  };

  const handlePrevious = () => {
    if (previousItem) {
      navigateToQuestion(previousItem);
    } else {
      onGlobalPrevious?.();
    }
  };

  const handleNext = () => {
    if (nextItem) {
      navigateToQuestion(nextItem);
    } else {
      onGlobalNext?.();
    }
  };

  return (
    <>
      {/* <div className="px-6 pt-4 pb-6 flex items-start justify-end gap-5">
        <Button
          type="text"
          onClick={handleNext}
          className="!text-white !opacity-70 hover:!opacity-100"
        >
          Skip
        </Button>
      </div> */}

      <MCQQuestion
        props={{
          data: currentQuestion,
          active_mcq_question_key: activeMCQQuestionKey,
          setActiveMCQQuestionKey,
          isLoading,
          totalQuestions: totalCount,
          onAnswerSubmitted,
          onPrevious: hasPrevious ? handlePrevious : undefined,
          hasPrevious,
          onNextQuestion: handleNext,
          totalQuestionsInSection,
          questionNumber,
          sectionName: questionLabel,
          showSubmitButton,
          showEndSectionButton,
          onCompleteSection,
          onEndSection,
          onSaveAll,
          questionTimer: 120, // 2 minutes per question timer for MCQ
        }}
      />
    </>
  );
}
