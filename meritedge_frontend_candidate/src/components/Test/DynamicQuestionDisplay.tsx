import React, { useState, useEffect, useRef } from 'react';
import { Radio, Checkbox, Typography, Button, Card, Space, Row, Col } from 'antd';
import { toast } from 'react-hot-toast';
import { Question } from '../../services/questionApi';
import EssayQuestion from './questions/EssayQuestion';

const { Text } = Typography;

interface DynamicQuestionDisplayProps {
  question: Question & { id?: string; candidate_answer?: string; candidate_answer_html?: string; question_title?: string; category?: string[] };
  onAnswerChange?: (questionId: string, answer: unknown) => void;
  selectedAnswer?: unknown;
  onNext?: (() => void | Promise<void>) | null;
  onPrevious?: (() => void | Promise<void>) | null;
  onSkip?: (() => void | Promise<void>) | null;
  loading?: boolean;
  hasPrevious?: boolean;
  showSubmitButton?: boolean;
  showEndSectionButton?: boolean;
  onCompleteSection?: (() => void | Promise<void>) | null;
  onEndSection?: (() => void | Promise<void>) | null;
  onSaveAll?: (() => void | Promise<void>) | null;
  globalQuestionNumber?: number;
  questionTimer?: number; // Timer in seconds for the current question
  onFlagQuestion?: (questionId: string) => void;
  isFlagged?: boolean;
}

type CheckboxGroupValue = Array<string | number | boolean>;

const DynamicQuestionDisplay: React.FC<DynamicQuestionDisplayProps> = ({
  question,
  onAnswerChange,
  selectedAnswer,
  onNext,
  onPrevious,
  onSkip,
  loading = false,
  hasPrevious = false,
  showSubmitButton = false,
  showEndSectionButton = false,
  onCompleteSection,
  onEndSection,
  onSaveAll,
  globalQuestionNumber,
  questionTimer,
  onFlagQuestion,
  isFlagged = false,
}) => {
  // Initialize localAnswer with selectedAnswer if available, otherwise use default
  // This ensures answers persist when revisiting questions
  const [localAnswer, setLocalAnswer] = useState<unknown>(() => {
    // Prioritize selectedAnswer from props (loaded from questionAnswers state)
    if (selectedAnswer !== undefined && selectedAnswer !== null) {
      // Validate based on question type
      const isEssay = question?.question_type === 'qt_006' || question?.question_type === 'qt_005';
      const isTrueFalse = question?.question_type === 'qt_003';
      
      if (isTrueFalse && (selectedAnswer === 'True' || selectedAnswer === 'False')) {
        return selectedAnswer;
      } else if (isEssay && typeof selectedAnswer === 'string') {
        // Reject "True" or "False" - these are for True/False questions, not essays
        if (selectedAnswer === 'True' || selectedAnswer === 'False') {
          return ''; // Return empty for essay questions if answer is "True" or "False"
        }
        
        // Check if it's a hash/UUID and reject it
        const looksLikeHash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAnswer) ||
          (/^[0-9a-f]{20,}$/i.test(selectedAnswer) && !/\s/.test(selectedAnswer) && selectedAnswer.length > 20);
        
        if (!looksLikeHash) {
          const textContent = selectedAnswer.replace(/<[^>]*>/g, '').trim();
          if (textContent.length > 0) {
            return selectedAnswer;
          }
        }
      } else if (!isTrueFalse && !isEssay) {
        return selectedAnswer;
      }
    }
    return question?.answer_format === 'multi' ? [] : '';
  });

  // Question timer state - countdown from questionTimer prop
  const [timeLeft, setTimeLeft] = useState<number>(questionTimer || 120);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track previous question ID to detect question changes
  const previousQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentQuestionId = question?.question_id;
    const isQuestionChanged = currentQuestionId && currentQuestionId !== previousQuestionIdRef.current;
    
    // Reset local answer when question changes - prevent cross-contamination between question types
    const isMulti = question?.answer_format === 'multi';
    const isEssay = question?.question_type === 'qt_006' || question?.question_type === 'qt_005';
    const isTrueFalse = question?.question_type === 'qt_003';
    
    // Determine default value based on question type
    let defaultValue: unknown = '';
    if (isMulti) {
      defaultValue = [];
    } else if (isTrueFalse) {
      defaultValue = '';
    } else if (isEssay) {
      defaultValue = '';
    }
    
    // If question changed, reset and load new answer
    if (isQuestionChanged) {
      previousQuestionIdRef.current = currentQuestionId;
      
      // Priority 1: Load answer from selectedAnswer prop (from questionAnswers state)
      if (selectedAnswer !== undefined && selectedAnswer !== null) {
        if (isTrueFalse && (selectedAnswer === 'True' || selectedAnswer === 'False')) {
          setLocalAnswer(selectedAnswer);
          return;
        } else if (isEssay && typeof selectedAnswer === 'string') {
          // Reject "True" or "False" - these are for True/False questions, not essays
          if (selectedAnswer === 'True' || selectedAnswer === 'False') {
            // Don't load - this is wrong answer type, try candidate_answer from question
            const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
            if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
              const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
              if (textContent.length > 0) {
                setLocalAnswer(candidateAnswer);
                return;
              }
            }
            setLocalAnswer(defaultValue);
            return;
          }
          
          // Check if it's a hash/UUID and reject it
          const looksLikeHash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAnswer) ||
            (/^[0-9a-f]{20,}$/i.test(selectedAnswer) && !/\s/.test(selectedAnswer) && selectedAnswer.length > 20);
          
          if (!looksLikeHash) {
            const textContent = selectedAnswer.replace(/<[^>]*>/g, '').trim();
            if (textContent.length > 0) {
              // Valid essay answer - load it
              setLocalAnswer(selectedAnswer);
              return;
            }
          }
          // If invalid, try candidate_answer from question
          const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
          if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
            const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
            if (textContent.length > 0) {
              setLocalAnswer(candidateAnswer);
              return;
            }
          }
          setLocalAnswer(defaultValue);
          return;
        } else if (isMulti && Array.isArray(selectedAnswer)) {
          setLocalAnswer(selectedAnswer);
          return;
        } else if (!isTrueFalse && !isEssay && !isMulti) {
          setLocalAnswer(selectedAnswer);
          return;
        }
      }
      
      // Priority 2: If no selectedAnswer, try candidate_answer from question object (from API)
      if (isTrueFalse) {
        const candidateAnswer = question?.candidate_answer;
        if (candidateAnswer === 'True' || candidateAnswer === 'False') {
          setLocalAnswer(candidateAnswer);
          return;
        }
      } else if (isEssay) {
        const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
        if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
          const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
          if (textContent.length > 0) {
            setLocalAnswer(candidateAnswer);
            return;
          }
        }
      }
      
      // No valid answer found, use default
      setLocalAnswer(defaultValue);
      return;
    }
    
    // Same question - update localAnswer if selectedAnswer changed and is valid
    // This ensures that when revisiting, we load the saved answer from state
    // Also check candidate_answer from question object as fallback
    if (selectedAnswer !== undefined && selectedAnswer !== null) {
      // For True/False, only accept 'True' or 'False' strings
      if (isTrueFalse) {
        if (selectedAnswer === 'True' || selectedAnswer === 'False') {
          // Only update if different to avoid unnecessary re-renders
          if (localAnswer !== selectedAnswer) {
            setLocalAnswer(selectedAnswer);
          }
        } else {
          // If selectedAnswer is not valid, try candidate_answer from question
          const candidateAnswer = question?.candidate_answer;
          if (candidateAnswer === 'True' || candidateAnswer === 'False') {
            if (localAnswer !== candidateAnswer) {
              setLocalAnswer(candidateAnswer);
            }
          }
        }
      }
      // For Essay, only accept strings with content - REJECT "True" or "False" (those are for True/False questions)
      else if (isEssay) {
        if (typeof selectedAnswer === 'string') {
          // Reject "True" or "False" - these are for True/False questions, not essays
          if (selectedAnswer === 'True' || selectedAnswer === 'False') {
            // Don't use this - try candidate_answer from question instead
            const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
            if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
              const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
              if (textContent.length > 0 && localAnswer !== candidateAnswer) {
                setLocalAnswer(candidateAnswer);
              }
            }
            return;
          }
          
          // Check if it's a hash/UUID and reject it
          const looksLikeHash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAnswer) ||
            (/^[0-9a-f]{20,}$/i.test(selectedAnswer) && !/\s/.test(selectedAnswer) && selectedAnswer.length > 20);
          
          if (!looksLikeHash) {
            const textContent = selectedAnswer.replace(/<[^>]*>/g, '').trim();
            if (textContent.length > 0) {
              // Only update if different to avoid unnecessary re-renders
              if (localAnswer !== selectedAnswer) {
                setLocalAnswer(selectedAnswer);
              }
            }
          } else {
            // If selectedAnswer is a hash, try candidate_answer from question
            const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
            if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
              const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
              if (textContent.length > 0 && localAnswer !== candidateAnswer) {
                setLocalAnswer(candidateAnswer);
              }
            }
          }
        }
      }
      // For multi-select, only accept arrays
      else if (isMulti) {
        if (Array.isArray(selectedAnswer)) {
          // Only update if different to avoid unnecessary re-renders
          const currentArray = Array.isArray(localAnswer) ? localAnswer : [];
          if (JSON.stringify([...currentArray].sort()) !== JSON.stringify([...selectedAnswer].sort())) {
            setLocalAnswer(selectedAnswer);
          }
        }
      }
      // For other types, accept string/number/boolean
      else {
        if (typeof selectedAnswer === 'string' || typeof selectedAnswer === 'number' || typeof selectedAnswer === 'boolean') {
          if (localAnswer !== selectedAnswer) {
            setLocalAnswer(selectedAnswer);
          }
        }
      }
    } else {
      // If selectedAnswer is null/undefined, try loading from question's candidate_answer
      if (isTrueFalse) {
        const candidateAnswer = question?.candidate_answer;
        if (candidateAnswer === 'True' || candidateAnswer === 'False') {
          if (localAnswer !== candidateAnswer) {
            setLocalAnswer(candidateAnswer);
          }
        }
      } else if (isEssay) {
        const candidateAnswer = question?.candidate_answer_html || question?.candidate_answer;
        if (candidateAnswer && typeof candidateAnswer === 'string' && candidateAnswer !== 'True' && candidateAnswer !== 'False') {
          const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
          if (textContent.length > 0 && localAnswer !== candidateAnswer) {
            setLocalAnswer(candidateAnswer);
          }
        }
      }
    }
    // If selectedAnswer is null/undefined but we have a local answer, keep it (don't reset)
  }, [selectedAnswer, question?.question_id, question?.answer_format, question?.question_type]);

  // Question timer countdown effect
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
          if (onNext) {
            onNext();
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
  }, [question?.question_id, questionTimer, onNext, showSubmitButton, onSaveAll, showEndSectionButton, onEndSection]);

  if (!question) {
    return (
      <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-6 mb-6">
        <Text className="text-white/70">Loading question...</Text>
      </div>
    );
  }

  const sanitizeHtml = (value: string | null | undefined) => {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const getOptionValue = (
    option: { text?: string | null; value?: unknown },
    index: number
  ) => {
    const raw = option?.value ?? option?.text ?? String(index);
    return typeof raw === 'string' ? sanitizeHtml(raw) : raw;
  };

  const handleAnswerChange = (value: unknown) => {
    const questionId = question?.question_id || question?.id;
    
    // CRITICAL: Block questionId from being passed as answer
    // Only check if value is exactly the questionId string (not HTML containing it)
    if (value === questionId || (typeof value === 'string' && value.trim() === questionId && !value.includes('<'))) {
      console.error("❌ BLOCKED in handleAnswerChange: Value is questionId string, NOT calling onAnswerChange");
      return;
    }
    
    // Check if value is HTML and contains only questionId as text content
    if (typeof value === 'string' && value.includes('<')) {
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      if (textContent === questionId) {
        console.error("❌ BLOCKED in handleAnswerChange: HTML text content is questionId, NOT calling onAnswerChange");
        return;
      }
    }
    
    // Update local state
    setLocalAnswer(value);
    
    // Call parent handler with question ID and answer value
    // This triggers auto-save in Test.tsx
    if (questionId) {
      console.log("✅ handleAnswerChange: Calling onAnswerChange with questionId:", questionId, "Value type:", typeof value, "Is HTML:", typeof value === 'string' && value.includes('<'));
      onAnswerChange?.(questionId, value);
    } else {
      console.error("❌ No questionId found, cannot call onAnswerChange");
    }
  };

  const renderSingleChoice = () => (
    <Radio.Group
      value={localAnswer}
      onChange={(e) => handleAnswerChange(e.target.value)}
      className="w-full"
    >
      <Space direction="vertical" className="w-full">
        {question.options.map((option, index) => (
          <Radio
            key={index}
            value={getOptionValue(option, index)}
            className="!text-white !border-[#3afd8b] [&_.ant-radio-inner]:!border-[#3afd8b] [&_.ant-radio-checked_.ant-radio-inner]:!bg-[#3afd8b] [&_.ant-radio-checked_.ant-radio-inner]:!border-[#3afd8b]"
          >
            <span className="text-white text-sm">{sanitizeHtml(option.text)}</span>
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );

  const renderMultiChoice = () => {
    const value: CheckboxGroupValue = Array.isArray(localAnswer)
      ? (localAnswer as CheckboxGroupValue)
      : [];

    return (
      <Checkbox.Group
        value={value}
        onChange={handleAnswerChange}
        className="w-full"
      >
        <Space direction="vertical" className="w-full">
          {question.options.map((option, index) => (
            <Checkbox
              key={index}
              value={getOptionValue(option, index)}
              className="!text-white !border-[#3afd8b] [&_.ant-checkbox-inner]:!border-[#3afd8b] [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[#3afd8b] [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[#3afd8b]"
            >
              <span className="text-white text-sm">{sanitizeHtml(option.text)}</span>
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    );
  };

  // Track the last saved answer to ensure it's saved when navigating away
  const lastSavedAnswerRef = useRef<string>('');
  
  // Save answer immediately when component unmounts or question changes
  useEffect(() => {
    return () => {
      // When navigating away, save the current answer immediately if it's different
      if (typeof localAnswer === 'string' && localAnswer !== lastSavedAnswerRef.current) {
        const textContent = localAnswer.replace(/<[^>]*>/g, '').trim();
        if (textContent.length > 0) {
          // Force immediate save by calling handleAnswerChange
          handleAnswerChange(localAnswer); // Pass only the answer value, not questionId
          lastSavedAnswerRef.current = localAnswer;
        }
      }
    };
  }, [question?.question_id]); // Only run cleanup when question changes

  const renderSubjective = () => {
    // Helper to check if a string looks like a hash/UUID
    const looksLikeHash = (str: string): boolean => {
      if (!str || typeof str !== 'string') return false;
      // Check for UUID pattern (e.g., "9459795c-a678-4f00-906b-ea5b77da4ed4")
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Check for other hash patterns (long alphanumeric strings without spaces)
      const hashPattern = /^[0-9a-f]{20,}$/i;
      const noSpaces = !/\s/.test(str);
      const isLong = str.length > 20;
      
      return uuidPattern.test(str) || (hashPattern.test(str) && noSpaces && isLong);
    };

    // Use selectedAnswer directly if available and not a hash, otherwise use localAnswer
    // This ensures we always show the latest saved answer when revisiting
    // IMPORTANT: Reject "True" or "False" - those are for True/False questions, not essays
    let answerToShow = '';
    if (selectedAnswer !== undefined && selectedAnswer !== null && typeof selectedAnswer === 'string') {
      // Reject "True" or "False" - these are for True/False questions
      if (selectedAnswer === 'True' || selectedAnswer === 'False') {
        // Don't use this - it's the wrong answer type
        // Try localAnswer instead
        if (typeof localAnswer === 'string' && !looksLikeHash(localAnswer) && localAnswer !== 'True' && localAnswer !== 'False') {
          answerToShow = localAnswer;
        }
      } else if (!looksLikeHash(selectedAnswer)) {
        answerToShow = selectedAnswer;
      } else if (typeof localAnswer === 'string' && !looksLikeHash(localAnswer) && localAnswer !== 'True' && localAnswer !== 'False') {
        // If selectedAnswer is a hash, try localAnswer (but not "True" or "False")
        answerToShow = localAnswer;
      }
    } else if (typeof localAnswer === 'string' && !looksLikeHash(localAnswer) && localAnswer !== 'True' && localAnswer !== 'False') {
      answerToShow = localAnswer;
    }
    
    return (
      <EssayQuestion
        question={question}
        initialAnswer={answerToShow}
        onAnswerChange={(content) => {
          console.log("📝 EssayQuestion onAnswerChange called with content:", content?.substring(0, 100));
          
          // Get questionId first
          const questionId = question?.question_id || question?.id;
          
          // CRITICAL: Validate that content is not the questionId itself
          if (content === questionId || (typeof content === 'string' && content === questionId)) {
            console.error("❌ EssayQuestion: Content is same as questionId, skipping:", questionId);
            return;
          }
          
          // Check if content looks like a UUID/hash
          if (content && typeof content === 'string') {
            // Check if it looks like a hash/UUID - if so, don't save
            if (looksLikeHash(content)) {
              console.log("⚠️ Content looks like hash, skipping:", content);
              return;
            }
            
            // Validate that content is actually HTML (contains tags) or has text content
            const textContent = content.replace(/<[^>]*>/g, '').trim();
            
            // CRITICAL: Check if textContent is the questionId (even if wrapped in HTML)
            if (textContent === questionId) {
              console.error("❌ EssayQuestion: Text content matches questionId, skipping:", questionId);
              return;
            }
            
            // Check if content is just the questionId with minimal HTML (like <p>questionId</p>)
            if (content.includes(questionId) && textContent === questionId && content.length < questionId.length + 20) {
              console.error("❌ EssayQuestion: Content is just questionId with minimal HTML, skipping:", questionId);
              return;
            }
            
            if (textContent.length === 0 && !content.includes('<')) {
              console.log("⚠️ Content has no text and no HTML tags, skipping");
              return;
            }
            
            // Only proceed if we have actual content (not just the questionId)
            // IMPORTANT: Allow content with HTML tags even if textContent is minimal
            // This ensures auto-save works for all valid content
            const hasValidContent = (textContent.length > 0 && textContent !== questionId) || 
                                   (content.includes('<p>') || content.includes('<br>') || content.includes('<div>'));
            
            if (hasValidContent && textContent !== questionId) {
              console.log("✅ Valid content detected, proceeding with handleAnswerChange. Text length:", textContent.length, "HTML length:", content.length);
              // Update local answer immediately
              setLocalAnswer(content);
              // Track the last saved answer
              lastSavedAnswerRef.current = content;
              // Call parent handler with the content (NOT questionId)
              // handleAnswerChange expects only the value/content, not questionId
              // This will trigger auto-save in Test.tsx
              if (questionId) {
                console.log("📝 Calling handleAnswerChange with content for question:", questionId, "Content length:", content.length);
                handleAnswerChange(content); // Pass only content, not questionId
              } else {
                console.error("❌ No questionId found for question:", question);
              }
            } else {
              console.log("⚠️ Content validation failed - textContent:", textContent, "questionId:", questionId, "hasValidContent:", hasValidContent);
            }
          } else if (!content || content === '') {
            // Empty content is okay - don't call handleAnswerChange for empty content
            console.log("📝 Content is empty, not calling handleAnswerChange");
          }
        }}
      />
    );
  };

  const renderTrueFalse = () => {
    const trueFalseOptions = [
      { text: 'True', value: 'True' },
      { text: 'False', value: 'False' },
    ];

    return (
      <Radio.Group
        value={localAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        className="w-full"
      >
        <Space direction="vertical" className="w-full" size="large">
          {trueFalseOptions.map((option, index) => (
            <Radio
              key={index}
              value={option.value}
              className="!w-full !block [&_.ant-radio]:!hidden"
            >
              <div
                className={`bg-[#151518e8] hover:bg-[#1E2025] duration-500 rounded-xl p-4 border border-solid border-[#ffffff33] cursor-pointer w-full ${
                  localAnswer === option.value
                    ? '!bg-[#7C3AED30] !border-[#7C3AED]'
                    : ''
                }`}
              >
                <span className="text-white text-base font-medium">
                  {option.text}
                </span>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    );
  };

  const renderQuestionContent = () => {
    const format = question.answer_format?.toLowerCase();
    const isEssayType =
      question.question_type === 'qt_005' ||
      question.question_type === 'qt_006' ||
      format === 'subjective' ||
      format === 'essay' ||
      format === 'text';

    switch (question.question_type) {
      case 'qt_001':
        return renderSingleChoice();
      case 'qt_002':
        return renderMultiChoice();
      case 'qt_003':
        return renderTrueFalse();
      case 'qt_005':
      case 'qt_006':
        return renderSubjective();
      case 'qt_007':
        return (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <Text className="text-white">
              Coding question component will be implemented separately
            </Text>
          </div>
        );
      default:
        if (format === 'multi' || format === 'multiple_choice') {
          return renderMultiChoice();
        }
        if (isEssayType) {
          return renderSubjective();
        }
        return renderSingleChoice();
    }
  };

  const isEssayType = ['qt_005', 'qt_006'].includes(question.question_type);
  const isTrueFalseQuestion = question.question_type === 'qt_003';
  const answerSectionTitle = isEssayType
    ? 'Write your answer'
    : isTrueFalseQuestion
    ? 'Choose True or False'
    : 'Choose your answer';

  const handleNextClick = async () => {
    console.log("🔘 Button clicked:", {
      showEndSectionButton,
      showSubmitButton,
      hasOnEndSection: !!onEndSection,
      hasOnCompleteSection: !!onCompleteSection,
      hasOnNext: !!onNext,
    });
    
    if (showEndSectionButton && onEndSection) {
      // Show toast message
      toast.success("You have completed this section! If you are sure, you can submit the test.", {
        duration: 3000,
        position: "top-right",
      });
      console.log("🔖 Calling onEndSection...");
      await onEndSection();
      return;
    }
    if (showSubmitButton && onSaveAll) {
      // For final section, "Save All" just saves answers, doesn't submit
      console.log("🔖 Calling onSaveAll...");
      await onSaveAll();
      return;
    }
    if (onNext) {
      console.log("🔖 Calling onNext...");
      await onNext();
    }
  };

  const handleSkipClick = async () => {
    if (onPrevious) {
      await onPrevious();
      return;
    }
    if (onSkip) {
      await onSkip();
      return;
    }
    if (onNext) {
      await onNext();
    }
  };

  // Format question timer (MM:SS)
  const formatTimer = (seconds: number | undefined) => {
    const secs = seconds !== undefined ? seconds : timeLeft;
    if (secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Get question tags (from question metadata or default)
  const questionTags = question.tags || question.category || [];

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Text className="text-white !text-xl font-medium whitespace-normal break-words flex-1">
            {question.question_title || sanitizeHtml(question.question_text)}
          </Text>
          {/* Question Timer */}
          {(questionTimer !== undefined || timeLeft > 0) && (
            <div className="flex items-center gap-2 bg-[#00ff0033] px-3 py-1.5 rounded-lg border border-[#3afd8b33] ml-4 flex-shrink-0">
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
          )}
        </div>
      }
      className="!mx-4 !my-5 !bg-[#0E0E11] !rounded-xl [&_.ant-card-body]:!p-0"
    >
      {/* Split Layout - Left: Question, Right: Options - Same as MCQ */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Question Text */}
        <div className="w-[100%] lg:w-[50%] border-b lg:border-b-0 lg:border-r border-[#FFFFFF1A] px-6 py-5">
          {/* Hide description for subjective questions (qt_006) */}
          {question.description && question.question_type !== 'qt_006' && (
            <Text className="text-gray-400 text-sm block">
              {question.description}
            </Text>
          )}
        </div>

        {/* Right Side - Answer Options */}
        <div className="w-[100%] lg:w-[50%] flex flex-col">
          <div className="border-b border-[#FFFFFF1A] px-6 py-4">
            <Text className="!text-white !text-lg font-semibold">
              {answerSectionTitle}
            </Text>
          </div>

          <div className="flex-grow px-6 py-5 overflow-y-auto">
            {renderQuestionContent()}
          </div>
        </div>
      </div>

      {/* Navigation Bar - Same as MCQ: Previous (left), Next (right) */}
      <Row justify="space-between" align="middle" className="px-6 py-4 border-t border-[#FFFFFF1A]">
        <Col>
          {hasPrevious ? (
            <Button
              type="text"
              onClick={onPrevious || undefined}
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
          {/* Don't show any button at bottom when showEndSectionButton is true - it's already shown at the top */}
          {/* Don't show Submit Assessment button at bottom - it's already shown at the top header */}
          {showEndSectionButton || showSubmitButton ? (
            null
          ) : (
            // Regular Next button for other questions
            <div
              className="!relative !w-full !rounded-full !overflow-hidden"
              onClick={handleNextClick}
            >
              <div
                className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-full"
                style={{
                  background:
                    "conic-gradient(from 360deg at 50% 50%, rgba(30,30,30,1) 25%, rgba(255,255,255,1) 39%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 62%, rgba(30,30,30,1) 75%)",
                }}
              />

              <Button
                loading={loading}
                disabled={loading || (!onNext && !onCompleteSection && !onEndSection && !onSaveAll)}
                className="!backdrop-blur-[10px] !bg-[#000000] duration-400 !text-white !rounded-full !border-none flex items-center justify-center !px-11 !py-6 !m-[1.5px] disabled:!opacity-50 disabled:!cursor-not-allowed"
              >
                {loading ? "Saving..." : "Next"}
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default DynamicQuestionDisplay;
