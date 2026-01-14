import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getCandidateEvaluation } from '../../lib/api';

interface Question {
    id: number;
    question: string;
    tags: string[];
    isCorrect: boolean;
    candidateAnswer?: string | boolean;
    correctAnswer?: string | boolean;
    options?: string[];
    candidateCode?: string;
}

const Performance: React.FC = () => {
    const navigate = useNavigate();
    const { candidateId } = useParams<{ candidateId: string }>();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [questionsByType, setQuestionsByType] = useState<Record<string, Question[]>>({});
    const [availableTabs, setAvailableTabs] = useState<Array<{ key: string; label: string; count: number }>>([]);

    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateId]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            if (!candidateId) {
                message.error('Missing candidate ID');
                setLoading(false);
                return;
            }

            console.log('Fetching candidate evaluation for:', candidateId);
            
            const response = await getCandidateEvaluation(candidateId);
            
            if (response.success && response.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const candidateData = response.data as any;
                
                console.log('Candidate Evaluation Response:', candidateData);
                console.log('Assessment Performance:', candidateData.assessment_evaluation?.assessment_performance);
                
                setReportData(candidateData);
                transformQuestionsData(candidateData);
            } else {
                message.error('Failed to fetch candidate evaluation');
            }
        } catch (error) {
            console.error('Error fetching candidate evaluation:', error);
            message.error('Failed to fetch candidate evaluation');
        } finally {
            setLoading(false);
        }
    };

    // Transform API question data to component format - grouped by actual question type names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformQuestionsData = (data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assessmentPerf = data.assessment_evaluation?.assessment_performance;
        const questionDetails = assessmentPerf?.question_details || [];

        console.log('Transforming questions:', questionDetails);

        // Get all unique question types from section_performance
        const sectionPerformance = assessmentPerf?.section_performance || {};
        const questionTypeMap: Record<string, string> = {};
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(sectionPerformance).forEach((section: any) => {
            if (section.question_types) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.values(section.question_types).forEach((qType: any) => {
                    questionTypeMap[qType.question_type] = qType.question_type_name;
                });
            }
        });

        console.log('Question type mapping:', questionTypeMap);

        // Group questions by their type name
        const groupedQuestions: Record<string, Question[]> = {};
        const allQuestions: Question[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questionDetails.forEach((q: any, index: number) => {
            const questionType = q.question_type || 'Unknown';
            const questionTypeName = questionTypeMap[questionType] || questionType;
            
            const questionItem: Question = {
                id: index + 1,
                question: `Question ${q.question_order || index + 1}`,
                tags: [questionTypeName],
                isCorrect: q.is_correct || false,
                candidateAnswer: q.answer_provided,
                correctAnswer: '',
                candidateCode: q.answer_provided,
                options: []
            };

            // Add to specific type group
            if (!groupedQuestions[questionTypeName]) {
                groupedQuestions[questionTypeName] = [];
            }
            groupedQuestions[questionTypeName].push(questionItem);
            
            // Add to all questions
            allQuestions.push(questionItem);
        });

        // Add "All" category
        groupedQuestions['All'] = allQuestions;

        console.log('Grouped questions by type:', groupedQuestions);

        setQuestionsByType(groupedQuestions);

        // Create tabs from available question types
        const tabs = [
            { key: 'All', label: 'All Questions', count: allQuestions.length }
        ];
        
        Object.keys(questionTypeMap).forEach(typeCode => {
            const typeName = questionTypeMap[typeCode];
            if (groupedQuestions[typeName] && groupedQuestions[typeName].length > 0) {
                tabs.push({
                    key: typeName,
                    label: typeName,
                    count: groupedQuestions[typeName].length
                });
            }
        });

        console.log('Available tabs:', tabs);
        
        setAvailableTabs(tabs);
        
        // Set default active tab to first available
        if (tabs.length > 0) {
            setActiveTab(tabs[0].key);
        }
    };

    // Use API data if available, otherwise use mock data
    const questions = {
        mcq: [
            {
                id: 1,
                question: "You are designing a RESTful API for an e-commerce platform where users can view products, add them to a cart, and place orders. Which HTTP method is the most appropriate for creating a new order, and why?",
                tags: ["REST API Design", "API Development"],
                options: [
                    "A. GET — because it retrieves the resource and ensures idempotency.",
                    "B. POST — because it creates a new resource on the server.",
                    "C. PUT — because it updates an existing resource entirely.",
                    "D. PATCH — because it applies partial modifications to a resource."
                ],
                correctAnswer: "B",
                candidateAnswer: "B",
                isCorrect: true
            },
            {
                id: 2,
                question: "Which of the following implementations correctly detects both 'start issue' and 'invalid key' keywords in the subject or body with fuzzy matching?",
                tags: ["React State Management", "JavaScript / React"],
                options: [
                    "A. import difflib\ndef detect_issue(subject, body):\n    text = subject + \" \" + body\n    if difflib.get_close_matches(\"start issue\", text.split(), cutoff=0.8):\n        return \"start issue\"\n    elif difflib.get_close_matches(\"invalid key\", text.split(), cutoff=0.8):\n        return \"invalid key\"\n    else:\n        return \"unknown\"",
                    "B. from fuzzywuzzy import fuzz\ndef detect_issue(subject, body):\n    text = subject + \" \" + body",
                    "C. import re\ndef detect_issue(subject, body):\n    text = subject + \" \" + body\n    if re.search(r'start.*issue', text, re.IGNORECASE):\n        return \"start issue\"\n    elif re.search(r'invalid.*key', text, re.IGNORECASE):\n        return \"invalid key\"\n    else:\n        return \"unknown\"",
                    "D. from sklearn.feature_extraction.text import TfidfVectorizer\ndef detect_issue(subject, body):\n    text = subject + \" \" + body"
                ],
                correctAnswer: "A",
                candidateAnswer: "A",
                isCorrect: true
            },
            {
                id: 3,
                question: "What is the primary purpose of the useEffect hook in React?",
                tags: ["React Hooks", "JavaScript / React"],
                options: [
                    "A. To manage component state and re-render the component when state changes.",
                    "B. To perform side effects in functional components, such as data fetching or subscriptions.",
                    "C. To create custom hooks for reusable stateful logic.",
                    "D. To optimize component performance by preventing unnecessary re-renders."
                ],
                correctAnswer: "B",
                candidateAnswer: "A",
                isCorrect: false
            },
            {
                id: 4,
                question: "Which CSS property is used to create a flexbox layout?",
                tags: ["CSS", "Layout"],
                options: [
                    "A. display: grid;",
                    "B. display: flex;",
                    "C. display: block;",
                    "D. display: inline-flex;"
                ],
                correctAnswer: "B",
                candidateAnswer: "B",
                isCorrect: true
            },
            {
                id: 5,
                question: "What is the time complexity of binary search on a sorted array?",
                tags: ["Algorithms", "Data Structures"],
                options: [
                    "A. O(n) - Linear time complexity",
                    "B. O(log n) - Logarithmic time complexity",
                    "C. O(n²) - Quadratic time complexity",
                    "D. O(1) - Constant time complexity"
                ],
                correctAnswer: "B",
                candidateAnswer: "A",
                isCorrect: false
            },
            {
                id: 6,
                question: "Which of the following is NOT a valid HTTP status code?",
                tags: ["Web Development", "HTTP"],
                options: [
                    "A. 200 - OK",
                    "B. 404 - Not Found",
                    "C. 500 - Internal Server Error",
                    "D. 999 - Invalid Status Code"
                ],
                correctAnswer: "D",
                candidateAnswer: "D",
                isCorrect: true
            },
            {
                id: 7,
                question: "What is the main difference between 'let' and 'var' in JavaScript?",
                tags: ["JavaScript", "ES6"],
                options: [
                    "A. 'let' has block scope while 'var' has function scope",
                    "B. 'var' has block scope while 'let' has function scope",
                    "C. There is no difference between 'let' and 'var'",
                    "D. 'let' can only be used in loops while 'var' can be used anywhere"
                ],
                correctAnswer: "A",
                candidateAnswer: "C",
                isCorrect: false
            }
        ],
        coding: [
            {
                id: 3,
                question: "Implement a function to find the longest common subsequence between two strings.",
                tags: ["Algorithm", "Dynamic Programming"],
                code: `def longest_common_subsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]`,
                candidateCode: `def longest_common_subsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]`,
                isCorrect: true
            }
        ],
        truefalse: [
            {
                id: 4,
                question: "In React, useState hook can only be used in functional components.",
                tags: ["React Hooks", "JavaScript / React"],
                correctAnswer: true,
                candidateAnswer: true,
                isCorrect: true
            },
            {
                id: 5,
                question: "CSS Grid and Flexbox are mutually exclusive and cannot be used together.",
                tags: ["CSS", "Layout"],
                correctAnswer: false,
                candidateAnswer: false,
                isCorrect: true
            }
        ]
    };

    const getCurrentQuestions = () => {
        if (reportData && questionsByType[activeTab]) {
            return questionsByType[activeTab].filter(q => 
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.candidateAnswer?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        // Fallback to mock data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((questions as any)[activeTab]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (questions as any)[activeTab].filter((q: Question) => 
                q.question.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return [];
    };

    const renderQuestionTable = () => {
        const questionsToDisplay = getCurrentQuestions();

        if (questionsToDisplay.length === 0) {
            return (
                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                    <p>No questions found</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto rounded-lg" style={{ border: '2px solid var(--border-primary)' }}>
                <table className="w-full border-collapse">
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-primary)' }}>
                            <th className="px-4 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '80px' }}>Q. No</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px' }}>Type</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Answer Provided</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '100px' }}>Time</th>
                            <th className="px-4 py-4 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px' }}>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questionsToDisplay.map((question, index) => (
                            <tr 
                                key={question.id}
                                style={{ 
                                    backgroundColor: 'var(--bg-primary)',
                                    borderBottom: '1px solid var(--border-primary)'
                                }}
                                className="hover:opacity-90 transition-opacity"
                            >
                                <td className="px-4 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {index + 1}
                                </td>
                                <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {question.tags && question.tags.length > 0 ? question.tags[0] : activeTab}
                                </td>
                                <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {question.tags && question.tags.length > 0 && 
                                     (question.tags[0].toLowerCase().includes('essay') || 
                                      question.tags[0].toLowerCase().includes('coding')) ? (
                                        <div className="max-w-2xl">
                                            <pre className="whitespace-pre-wrap font-mono text-xs p-3 rounded" style={{ 
                                                backgroundColor: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--accent-primary)'
                                            }}>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {(question as any).candidateCode || (question as any).candidateAnswer || 'No answer provided'}
                                            </pre>
                                        </div>
                                    ) : (
                                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                        <span className="font-medium">{(question as any).candidateAnswer?.toString() || 'No answer'}</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    N/A
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                        question.isCorrect 
                                            ? 'bg-green-900 text-green-300' 
                                            : 'bg-red-900 text-red-300'
                                    }`}>
                                        {question.isCorrect ? (
                                            <>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Correct
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                Incorrect
                                            </>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--accent-primary)' }} spin />} 
                    tip="Loading performance data..."
                    size="large"
                />
            </div>
        );
    }

    // Get candidate info for header
    const candidateDetails = reportData?.assessment_evaluation?.candidate_image?.candidate_details;
    const candidateEmail = candidateDetails?.email && candidateDetails.email !== 'null'
        ? candidateDetails.email 
        : candidateId || '---';

    return (
        <>
            <style>
                {`
                    .performance-page {
                        position: relative !important;
                        z-index: 1000 !important;
                        isolation: isolate !important;
                    }
                    .performance-page * {
                        position: relative !important;
                    }
                    .performance-header {
                        z-index: 1010 !important;
                        position: relative !important;
                    }
                    .performance-tabs {
                        z-index: 1010 !important;
                        position: relative !important;
                    }
                    .performance-search {
                        z-index: 1010 !important;
                        position: relative !important;
                    }
                `}
            </style>
            <div 
                className="min-h-screen relative performance-page" 
                style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    zIndex: 1000,
                    position: 'relative',
                    isolation: 'isolate'
                }}
            >
            <div 
                className="container mx-auto px-6 py-8 relative" 
                style={{ 
                    zIndex: 10,
                    position: 'relative',
                    isolation: 'isolate'
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 relative performance-header" style={{ zIndex: 1020 }}>
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative cursor-pointer"
                        style={{ zIndex: 30 }}
                    >
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="relative" style={{ zIndex: 20 }}>
                        <h1 
                            className="text-2xl font-bold relative" 
                            style={{ 
                                color: 'var(--text-primary)', 
                                zIndex: 30
                            }}
                        >
                            Technical Skills — Section 1
                        </h1>
                        <p 
                            className="text-sm mt-1 relative"
                            style={{ 
                                color: 'var(--text-secondary)', 
                                zIndex: 30
                            }}
                        >
                            Assessment List / Test Report: {candidateEmail} / Performance Details
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex justify-between items-center mb-6 relative performance-search" style={{ zIndex: 1020 }}>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ zIndex: 30 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search Questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg focus:outline-none w-64 relative cursor-text"
                                style={{ 
                                    zIndex: 25,
                                    backgroundColor: 'var(--bg-primary)',
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)'
                                }}
                            />
                        </div>
                    </div>
                    {/* <Button 
                        style={{ 
                            backgroundColor: '#374151', 
                            borderColor: '#4b5563',
                            color: 'white',
                            zIndex: 30
                        }}
                        className="relative"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                        </svg>
                        Filter by Result
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button> */}
                </div>

                {/* Tabs - Dynamic based on question types */}
                <div className="flex gap-8 mb-8 border-b border-gray-700 relative performance-tabs" style={{ zIndex: 1020 }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(reportData && availableTabs.length > 0 ? availableTabs : [
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        { key: 'mcq', label: 'MCQ', count: (questions as any).mcq?.length || 0 },
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        { key: 'coding', label: 'Coding', count: (questions as any).coding?.length || 0 },
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        { key: 'truefalse', label: 'True or False', count: (questions as any).truefalse?.length || 0 }
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 px-1 text-sm font-medium transition-colors relative cursor-pointer ${
                                activeTab === tab.key
                                    ? 'border-b-2'
                                    : ''
                            }`}
                            style={{ 
                                zIndex: 30,
                                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                borderBottomColor: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent'
                            }}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Questions Table */}
                <div>
                    {renderQuestionTable()}
                </div>
            </div>
            </div>
        </>
    );
};

export default Performance;
