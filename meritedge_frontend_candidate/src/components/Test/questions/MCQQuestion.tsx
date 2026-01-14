/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  Button,
  Typography,
  Radio,
  Checkbox,
  Row,
  Col,
  Card,
} from "antd";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../../config/apiConfig";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import EssayQuestion from "./EssayQuestion";

const { Text } = Typography;

export default function MCQQuestion({ props }: { props: any }) {
  const question_details = props?.data;
  const isLoading = props?.isLoading;
  const active_mcq_question_key = props?.active_mcq_question_key;
  const totalQuestions = props?.totalQuestions || 0;
  const onAnswerSubmitted = props?.onAnswerSubmitted;
  const onPrevious = props?.onPrevious as (() => void) | undefined;
  const hasPrevious = Boolean(props?.hasPrevious);
  const onNextQuestion = props?.onNextQuestion as (() => void) | undefined;
  const showSubmitButton = Boolean(props?.showSubmitButton);
  const showEndSectionButton = Boolean(props?.showEndSectionButton);
  const onEndSection = props?.onEndSection as (() => void) | undefined;
  const onSaveAll = props?.onSaveAll as (() => void | Promise<void>) | undefined;
  const questionTimer = props?.questionTimer as number | undefined; // Timer in seconds for the current question

  // Navigation
  const { candidate_id } = useParams();
  // Get auth token and assessment data from Redux
  const authToken = useSelector((state: any) => state.misc?.authToken);
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );
  const tokenValidation = useSelector(
    (state: any) => state.misc?.tokenValidation
  );

  // Check if this is the last question
  const isLastQuestion = Number(active_mcq_question_key) === totalQuestions;

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [answers, setAnswers] = useState(question_details?.answers || []);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  // Essay/Text question state
  const [essayAnswer, setEssayAnswer] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Question timer state - countdown from questionTimer prop (moved before early return)
  const [timeLeft, setTimeLeft] = useState<number>(questionTimer || 120);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track time spent on question
  const questionStartTime = useRef<number>(Date.now());
  const timeSpentRef = useRef<number>(0);

  // Update time spent every second
  useEffect(() => {
    const interval = setInterval(() => {
      timeSpentRef.current = Math.floor(
        (Date.now() - questionStartTime.current) / 1000
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset timer when question changes
  useEffect(() => {
    questionStartTime.current = Date.now();
    timeSpentRef.current = 0;
  }, [question_details?.question_id]);

  // Question timer countdown effect (moved before early return to fix hooks error)
  useEffect(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Reset timer when question changes
    const initialTime = questionTimer || 120;
    setTimeLeft(initialTime);

    // Start countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0, auto-advance to next question
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          // Auto-advance to next question
          if (onNextQuestion) {
            onNextQuestion();
          } else if (showSubmitButton && onSaveAll) {
            // Last question - auto-submit
            onSaveAll();
          } else if (showEndSectionButton && onEndSection) {
            // End of section
            onEndSection();
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or question change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [question_details?.question_id, questionTimer, onNextQuestion, showSubmitButton, onSaveAll, showEndSectionButton, onEndSection]);

  // Track the initially stored answer to detect if user is changing an answer
  const initialStoredAnswerRef = useRef<string | null>(null);
  const initialStoredAnswersRef = useRef<string[]>([]);
  const previousQuestionIdRef = useRef<string | undefined>(undefined);
  const userInitiatedChangeRef = useRef<boolean>(false);

  useEffect(() => {
    const currentQuestionId = question_details?.question_id;
    const questionChanged = previousQuestionIdRef.current !== currentQuestionId;

    // Only restore stored answer when question actually changes, not when stored answer updates
    if (questionChanged && currentQuestionId) {
      previousQuestionIdRef.current = currentQuestionId;
      userInitiatedChangeRef.current = false; // Reset flag when question changes

      // Reset state when question changes
      setEssayAnswer("");
      setAnswers(question_details?.answers || []);

      // Store the initial stored answer for comparison
      if (
        question_details?.storedSelectedAnswer !== undefined &&
        question_details.storedSelectedAnswer !== null
      ) {
        initialStoredAnswerRef.current = question_details.storedSelectedAnswer;
        setSelectedAnswer(question_details.storedSelectedAnswer);
        setIsAnswerSubmitted(true);
      } else if (
        question_details?.storedSelectedAnswers !== undefined &&
        question_details.storedSelectedAnswers.length > 0
      ) {
        initialStoredAnswersRef.current = [
          ...question_details.storedSelectedAnswers,
        ];
        setSelectedAnswers(question_details.storedSelectedAnswers);
        setIsAnswerSubmitted(true);
        setSelectedAnswer(null);
        initialStoredAnswerRef.current = null;
      } else {
        // Only reset if no stored answer exists

        initialStoredAnswerRef.current = null;
        initialStoredAnswersRef.current = [];
        setSelectedAnswer(null);
        setSelectedAnswers([]);
        setIsAnswerSubmitted(false);
      }
    }
    // Only depend on question_id to prevent resetting when answer is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question_details?.question_id]);

  // Also restore stored answers when they become available (e.g., when navigating back to a question)
  useEffect(() => {
    // Only restore if user hasn't initiated a change and we're on the same question
    if (
      !userInitiatedChangeRef.current &&
      previousQuestionIdRef.current === question_details?.question_id
    ) {
      // Restore single-select answer if available and not already set
      if (
        question_details?.storedSelectedAnswer !== undefined &&
        question_details.storedSelectedAnswer !== null &&
        selectedAnswer !== question_details.storedSelectedAnswer
      ) {
        initialStoredAnswerRef.current = question_details.storedSelectedAnswer;
        setSelectedAnswer(question_details.storedSelectedAnswer);
        setIsAnswerSubmitted(true);
      }
      // Restore multi-select answers if available and not already set
      else if (
        question_details?.storedSelectedAnswers !== undefined &&
        question_details.storedSelectedAnswers.length > 0 &&
        JSON.stringify([...selectedAnswers].sort()) !==
          JSON.stringify([...question_details.storedSelectedAnswers].sort())
      ) {
        initialStoredAnswersRef.current = [
          ...question_details.storedSelectedAnswers,
        ];
        setSelectedAnswers(question_details.storedSelectedAnswers);
        setIsAnswerSubmitted(true);
        setSelectedAnswer(null);
        initialStoredAnswerRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    question_details?.storedSelectedAnswer,
    question_details?.storedSelectedAnswers,
  ]);

  // Check if this is an essay/text question (no options or qt_006)
  const isEssayQuestion =
    !question_details?.answers ||
    question_details.answers.length === 0 ||
    question_details.question_type === "qt_006";
  // Check if this is a True/False question (qt_003)
  const isTrueFalseQuestion = question_details?.question_type === "qt_003";

  const getPlainText = (html: string) => {
    if (!html) {
      return "";
    }

    if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
      try {
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const textContent = doc.body?.textContent || "";
        return textContent.replace(/\s+/g, " ").trim();
      } catch (error) {
        console.error("Error parsing HTML content", error);
      }
    }

    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  };

  const handleEssayChange = (content: string) => {
    setEssayAnswer(content);
  };

  // Get section_id from question details or fallback to assessment summary/token data
  const getSectionId = () => {
    if (question_details?.section_id) {
      return question_details.section_id;
    }

    if (assessmentSummary?.sections) {
      for (const section of assessmentSummary.sections) {
        if (!section?.question_types) continue;
        for (const qt of section.question_types) {
          if (qt?.question_ids?.includes?.(question_details?.question_id)) {
            return section.section_id || "";
          }
        }
      }
    }

    const tokenSections = tokenValidation?.sections || [];
    for (const section of tokenSections) {
      if (
        section?.section_id &&
        section?.question_ids?.includes?.(question_details?.question_id)
      ) {
        return section.section_id;
      }
    }

    const firstSection = assessmentSummary?.sections?.[0];
    return firstSection?.section_id || "";
  };

  // Submit answer to API
  const submitAnswer = async (answerText: string) => {
    if (!question_details?.question_id) {
      console.error("No question_id available");
      return false;
    }

    const token = authToken || tokenValidation?.token;
    if (!token) {
      console.error("No auth token available");
      toast.error("Authentication required");
      return false;
    }

    const sectionId = getSectionId();
    if (!sectionId) {
      console.error("No section_id available");
      return false;
    }

    setIsSaving(true);
    // Track start time to ensure minimum 2-second display
    const savingStartTime = Date.now();

    try {
      const payload = {
        section_id: sectionId,
        question_type: question_details?.question_type || "qt_001",
        question_id: question_details.question_id,
        answer: answerText,
        time_spent: timeSpentRef.current,
      };

      console.log("📤 Submitting answer:", payload);

      const response = await fetch(API_ENDPOINTS.candidate.answers, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Answer submission failed:",
          response.status,
          errorText
        );
        throw new Error(`Failed to submit answer: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Answer submitted successfully:", result);

      // Mark question as answered in cache and store the answer (only after successful submission)
      try {
        if (onAnswerSubmitted && question_details?.id) {
          // Store the selected answer(s) in the cache
          const answerData: {
            selectedAnswer?: string | null;
            selectedAnswers?: string[];
          } = {};
          // Use current state values at the time of submission
          const currentSelectedAnswer = selectedAnswer;
          const currentSelectedAnswers = selectedAnswers;
          if (currentSelectedAnswer) {
            answerData.selectedAnswer = currentSelectedAnswer;
          }
          if (currentSelectedAnswers.length > 0) {
            answerData.selectedAnswers = currentSelectedAnswers;
          }
          onAnswerSubmitted(question_details.id, answerData);
        }
      } catch (callbackError) {
        console.error("Error updating question cache:", callbackError);
        // Don't fail the submission if cache update fails
      }

      // Ensure minimum 2 seconds of "Saving..." display
      const elapsedTime = Date.now() - savingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // Don't show toast for individual question answers
      // message.success("Answer saved successfully!");
      return true;
    } catch (error) {
      console.error("❌ Error submitting answer:", error);

      // Still show minimum 2 seconds even on error
      const elapsedTime = Date.now() - savingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // Don't show toast for individual question answers
      // message.error("Failed to save answer. Please try again.");
      console.error("Failed to save answer");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle MCQ answer selection and submit
  const handleAnswerChange = async (answerId: string) => {
    // Mark that user initiated this change - prevents useEffect from overwriting it
    userInitiatedChangeRef.current = true;

    // Update state immediately for responsive UI - this should update the Radio.Group value
    setSelectedAnswer(answerId);

    // Find the selected answer text
    const selectedAnswerObj = question_details?.answers?.find(
      (a: any) => a.id === answerId
    );
    if (!selectedAnswerObj) {
      return;
    }

    const answerText = selectedAnswerObj.value || "";

    // Store answer immediately in cache for restoration when navigating back
    if (onAnswerSubmitted && question_details?.id) {
      onAnswerSubmitted(question_details.id, { selectedAnswer: answerId });
    }

    // Update ref to the current answer for future comparisons
    initialStoredAnswerRef.current = answerId;

    // Submit answer immediately when option is clicked
    const success = await submitAnswer(answerText);
    if (success) {
      setIsAnswerSubmitted(true);
      // Don't auto-navigate - user must click "Next" button to proceed
      console.log("✅ Answer saved - waiting for Next button click");
    } else {
      console.error("❌ Answer submission failed");
    }
  };

  const handleMultipleAnswerChange = async (checkedValues: string[]) => {
    // Mark that user initiated this change - prevents useEffect from overwriting it
    userInitiatedChangeRef.current = true;

    // Update state immediately for responsive UI
    setSelectedAnswers(checkedValues);

    // Get all selected answer texts
    const selectedTexts = checkedValues
      .map((id) => {
        const answer = question_details?.answers?.find((a: any) => a.id === id);
        return answer?.value ?? "";
      })
      .filter(Boolean);

    const answerText = selectedTexts.join(", ");

    // Store answer immediately in cache for restoration when navigating back
    if (onAnswerSubmitted && question_details?.id) {
      onAnswerSubmitted(question_details.id, {
        selectedAnswers: checkedValues,
      });
    }

    // Update ref to the current answers for future comparisons
    initialStoredAnswersRef.current = [...checkedValues];

    // Submit answer
    const success = await submitAnswer(answerText);
    if (success) {
      setIsAnswerSubmitted(true);
      // Don't auto-navigate - user must click "Next" button to proceed
      console.log("✅ Answer saved - waiting for Next button click");
    } else {
      console.error("❌ Answer submission failed");
    }
  };

  // Handle Save & Next for essay questions
  const handleSaveAndNext = async () => {
    // If this is the last section's last question, call onCompleteSection instead
    if (showEndSectionButton && onEndSection) {
      // Show toast message
      toast.success("You have completed this section! If you are sure, you can submit the test.", {
        duration: 3000,
        position: "top-right",
      });
      onEndSection();
      return;
    }
    // For final section, "Save All" just saves answers, doesn't submit
    if (showSubmitButton && onSaveAll) {
      // Call Save All to just save answers
      await onSaveAll();
      return;
    }

    if (isEssayQuestion) {
      // For essay questions, submit the text from textarea
      if (!getPlainText(essayAnswer)) {
        // Don't show toast for individual question answers
        // toast.error('No answer entered. Click "Skip" if you want to bypass this question.');
        console.warn('No answer entered');
        return;
      }

      const success = await submitAnswer(essayAnswer);
      if (success) {
        if (isLastQuestion) {
          // Just save locally for last question, don't complete section

          // Show saving state for 2 seconds (submitAnswer already has delay, but add extra for end section)
          setIsSaving(true);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setIsSaving(false);

          // Don't show toast for individual question answers
          // message.success(
          //   "Section completed! Click Submit when ready to finish the assessment."
          // );
        }
        onNextQuestion?.();
      }
      return;
    }

    // Allow proceeding to next question even without an answer
    // Save answer if provided, but don't block navigation
    const hasAnswer =
      selectedAnswer !== null ||
      selectedAnswers.length > 0 ||
      isAnswerSubmitted;

    // If there's an answer and it hasn't been submitted yet, try to save it (non-blocking)
    if (hasAnswer && !isAnswerSubmitted) {
      // Save the answer in the background, don't wait for it or block navigation
      (async () => {
        try {
          if (selectedAnswer !== null) {
            const selectedAnswerObj = question_details?.answers?.find(
              (a: any) => a.id === selectedAnswer
            );
            if (selectedAnswerObj) {
              await submitAnswer(selectedAnswerObj.value || selectedAnswerObj.text || "");
            }
          } else if (selectedAnswers.length > 0) {
            const selectedTexts = selectedAnswers
              .map((id) => {
                const answer = question_details?.answers?.find((a: any) => a.id === id);
                return answer?.value ?? "";
              })
              .filter(Boolean);
            await submitAnswer(selectedTexts.join(", "));
          }
        } catch (error) {
          console.warn("Failed to save answer, but allowing navigation:", error);
        }
      })();
    }

    if (isLastQuestion) {
      setIsSaving(true);
      const savingStartTime = Date.now();

      const sectionAnswersKey = `section_answers_mcq_${candidate_id}`;
      localStorage.setItem(
        sectionAnswersKey,
        JSON.stringify({
          selectedAnswer,
          selectedAnswers,
          timestamp: new Date().toISOString(),
          questionKey: active_mcq_question_key,
        })
      );

      const elapsedTime = Date.now() - savingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setIsSaving(false);
      // Don't show toast for individual question answers
      // message.success(
      //   "Section completed! Click Submit when ready to finish the assessment."
      // );
    }

    onNextQuestion?.();
  };

  // Show loading state if question is being fetched
  if (isLoading || !question_details?.question_id) {
    return (
      <Card className="!mx-4 !my-5 !bg-[#0E0E11] !rounded-xl">
        <div className="flex items-center justify-center p-12">
          <Text className="text-white animate-pulse text-lg">
            Loading question...
          </Text>
        </div>
      </Card>
    );
  }

  // Debug: Log question details to help diagnose missing answers
  if (!question_details?.answers || question_details.answers.length === 0) {
    console.warn('MCQ Question has no answers:', {
      question_id: question_details?.question_id,
      question_type: question_details?.question_type,
      answer_type: question_details?.answer_type,
      hasAnswers: !!question_details?.answers,
      answersLength: question_details?.answers?.length,
      question_details
    });
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setAnswers((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const SortableItem = ({ answer }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: answer.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="!w-full !block mb-10"
      >
        <div
          className={`bg-[#151518e8] hover:bg-[#1E2025] duration-500 rounded-xl p-4 border border-solid border-[#ffffff33] cursor-pointer w-full ${
            selectedAnswers.includes(answer.id)
              ? "!bg-[#7C3AED30] !border-[#7C3AED]"
              : ""
          }`}
        >
          <span className="text-white">{answer?.label || ""}</span>
        </div>
      </div>
    );
  };

  const renderEssayQuestion = () => (
    <EssayQuestion
      question={question_details}
      initialAnswer={essayAnswer}
      onAnswerChange={handleEssayChange}
    />
  );

  // Format question timer (MM:SS)
  const formatTimer = (seconds: number | undefined) => {
    const secs = seconds !== undefined ? seconds : timeLeft;
    if (secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <>
      <Card
        title={
          <Row
            align="middle"
            justify="space-between"
            gutter={[10, 10]}
            className="!py-5"
          >
            <Col flex="auto">
              <Row
                align="middle"
                justify="start"
                gutter={[10, 10]}
                className="mb-2"
              >
                <Col xs={24} lg="auto">
                  <Text className="text-white !text-xl font-medium whitespace-normal break-words">
                    {question_details?.question || question_details?.question_text}
                  </Text>
                </Col>
              </Row>
            </Col>
            {/* Question Timer */}
            {(questionTimer !== undefined || timeLeft > 0) && (
              <Col>
                <div className="flex items-center gap-2 bg-[#00ff0033] px-3 py-1.5 rounded-lg border border-[#3afd8b33]">
                  <svg
                    className="w-4 h-4 text-[#3afd8b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[#3afd8b] font-semibold text-sm">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
              </Col>
            )}
          </Row>
        }
        className="!mx-4 !my-5 !bg-[#0E0E11] !rounded-xl [&_.ant-card-body]:!p-0"
      >
        <div className="flex flex-col lg:flex-row">
          <div className="w-[100%] lg:w-[50%] border-b lg:border-b-0 lg:border-r border-[#FFFFFF1A] px-6 py-5">
            {question_details?.description && (
              <Text className="text-gray-400 text-sm block">
                {question_details.description}
              </Text>
            )}
          </div>

          <div className="w-[100%] lg:w-[50%] flex flex-col">
            <div className="border-b border-[#FFFFFF1A] px-6 py-4">
              <Text className="!text-white !text-lg font-semibold">
                {isEssayQuestion ? "Write your answer" : "Choose your answer"}
              </Text>
            </div>

            <div className="flex-grow px-6 py-5 overflow-y-auto">
              {isTrueFalseQuestion ? (
                // True/False Question - Same UI as MCQ
                <Radio.Group
                  value={selectedAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full"
                >
                  {(question_details?.answers || answers || []).map((answer) => (
                    <Radio
                      key={answer.id}
                      value={answer.id}
                      className="!w-full !block [&_.ant-radio]:!hidden mb-4"
                    >
                      <div
                        className={`bg-[#151518e8] hover:bg-[#1E2025] duration-500 rounded-xl p-4 border border-solid border-[#ffffff33] cursor-pointer w-full ${
                          selectedAnswer === answer.id
                            ? "!bg-[#7C3AED30] !border-[#7C3AED]"
                            : ""
                        }`}
                      >
                        <span className="text-white text-base font-medium">
                          {answer?.label || (answer.id === "true" ? "True" : "False")}
                        </span>
                      </div>
                    </Radio>
                  ))}
                </Radio.Group>
              ) : isEssayQuestion ? (
                // Essay/Text Question - Rich Text Editor
                renderEssayQuestion()
              ) : (
                // MCQ Question - Original Options Display
                <>
                  {question_details?.answer_type === "ordering" && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={answers.map((a) => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {answers.map((answer) => (
                          <SortableItem key={answer.id} answer={answer} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}

                  {question_details?.answer_type === "multiselect" ? (
                    <Checkbox.Group
                      value={selectedAnswers}
                      onChange={handleMultipleAnswerChange}
                      className="w-full"
                    >
                      {(question_details?.answers || answers || []).map((answer) => (
                        <Checkbox
                          key={answer.id}
                          value={answer.id}
                          className="!w-full !block [&_.ant-checkbox]:!hidden mb-4"
                        >
                          <div
                            className={`bg-[#151518e8] hover:bg-[#1E2025] duration-500 rounded-xl p-4 border border-solid border-[#ffffff33] cursor-pointer w-full ${
                              selectedAnswers.includes(answer.id)
                                ? "!bg-[#7C3AED30] !border-[#7C3AED]"
                                : ""
                            }`}
                          >
                            <span className="text-white">
                              {answer?.label || ""}
                            </span>
                          </div>
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  ) : (
                    <Radio.Group
                      value={selectedAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="w-full"
                    >
                      {(question_details?.answers || answers || []).map((answer) => (
                        <Radio
                          key={answer.id}
                          value={answer.id}
                          className="!w-full !block [&_.ant-radio]:!hidden mb-4"
                        >
                          <div
                            className={`bg-[#151518e8] hover:bg-[#1E2025] duration-500 rounded-xl p-4 border border-solid border-[#ffffff33] cursor-pointer w-full ${
                              selectedAnswer === answer.id
                                ? "!bg-[#7C3AED30] !border-[#7C3AED]"
                                : ""
                            }`}
                          >
                            <span className="text-white">
                              {answer?.label || ""}
                            </span>
                          </div>
                        </Radio>
                      ))}
                    </Radio.Group>
                  )}
                </>
              )}
            </div>

            <Row justify="space-between" align="middle" className="px-6 py-4 border-t border-[#FFFFFF1A]">
              <Col>
                {hasPrevious ? (
                  <Button
                    type="text"
                    onClick={onPrevious}
                    className="!text-white !opacity-70 hover:!opacity-100"
                  >
                    Previous
                  </Button>
                ) : (
                  <span />
                )}
              </Col>

              <Col>
                {/* Show appropriate button based on question state */}
                {/* Don't show Complete Section button at bottom when showEndSectionButton is true - it's already shown at the top */}
                {/* Don't show Submit Assessment button at bottom - it's already shown at the top header */}
                {showEndSectionButton || showSubmitButton ? (
                  null
                ) : (
                  <div
                    className="!relative !w-full !rounded-full !overflow-hidden"
                    onClick={handleSaveAndNext}
                  >
                    <div
                      className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 360deg at 50% 50%, rgba(30,30,30,1) 25%, rgba(255,255,255,1) 39%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 62%, rgba(30,30,30,1) 75%)",
                      }}
                    />

                    <Button
                      loading={isSaving}
                      disabled={isSaving}
                      className="!backdrop-blur-[10px] !bg-[#000000] duration-400 !text-white !rounded-full !border-none flex items-center justify-center !px-11 !py-6 !m-[1.5px] disabled:!opacity-50 disabled:!cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Next"}
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        </div>
      </Card>
    </>
  );
}
