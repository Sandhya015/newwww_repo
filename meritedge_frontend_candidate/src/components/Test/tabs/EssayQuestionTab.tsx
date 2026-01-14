/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Tabs, Button, Space, Badge } from 'antd';
import { FlagOutlined, CheckCircleOutlined } from '@ant-design/icons';
import EssayQuestion from '../questions/EssayQuestion';

interface EssayQuestionTabProps {
    props: {
        activeEssayQuestionKey: string;
        setActiveEssayQuestionKey: (key: string) => void;
        datas: any[];
        loadingQuestion?: boolean;
        error?: string | null;
    };
}

export default function EssayQuestionTab({ props }: EssayQuestionTabProps) {
    const { activeEssayQuestionKey, setActiveEssayQuestionKey, datas, loadingQuestion, error } = props;
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Handle answer change for a question
    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
        
        // TODO: Save to Redux or API
        console.log('Essay answer updated:', { questionId, answerLength: answer.length });
    };

    // Generate tabs for essay questions
    const essayTabs = datas.map((question, index) => {
        const questionNumber = index + 1;
        const isAnswered = answers[question.question_id]?.trim().length > 0;
        
        return {
            key: question.question_id,
            label: (
                <Space size="small">
                    <span>Q{questionNumber}</span>
                    {isAnswered && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                </Space>
            ),
            children: (
                <EssayQuestion 
                    question={question}
                    onAnswerChange={(answer) => handleAnswerChange(question.question_id, answer)}
                />
            )
        };
    });

    return (
        <div className="bg-[#1a1a1a] rounded-lg">
            <Tabs
                activeKey={activeEssayQuestionKey}
                onChange={setActiveEssayQuestionKey}
                items={essayTabs}
                tabPosition="left"
                className={`
                    essay-question-tabs
                    [&_.ant-tabs-tab]:!bg-transparent
                    [&_.ant-tabs-tab]:!border-r-2
                    [&_.ant-tabs-tab]:!border-gray-700
                    [&_.ant-tabs-tab]:!text-gray-400
                    [&_.ant-tabs-tab-active]:!border-purple-500
                    [&_.ant-tabs-tab-active]:!text-white
                    [&_.ant-tabs-tab-active]:!bg-purple-900/20
                    [&_.ant-tabs-ink-bar]:!bg-purple-500
                    [&_.ant-tabs-content]:!bg-[#1a1a1a]
                    [&_.ant-tabs-nav]:!bg-[#0f0f0f]
                `}
            />
        </div>
    );
}

