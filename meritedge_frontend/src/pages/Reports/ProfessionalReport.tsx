import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
    UserOutlined,
    MailOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TrophyOutlined,
    FileTextOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import { Spin, message, Button } from 'antd';
import { getIndividualCandidateReport, getCandidateEvaluation } from '../../lib/api';

// Media API types
interface MediaFile {
    file_type: string;
    file_name: string;
    s3_key: string;
    presigned_url: string;
    expires_at: string;
    file_size: number;
    last_modified: string;
}

interface MediaResponse {
    candidate_id: string;
    assessment_id: string;
    files: MediaFile[];
    total_files: number;
    bucket_name: string;
    base_path: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CandidateReportData extends Record<string, any> {
    candidate_id: string;
}

const ProfessionalReport: React.FC = () => {
    const { candidateId } = useParams<{ candidateId: string }>();
    const [searchParams] = useSearchParams();
    const [reportData, setReportData] = useState<CandidateReportData | null>(null);
    const [mediaData, setMediaData] = useState<MediaResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
        fetchMediaData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateId]);

    const fetchMediaData = async () => {
        try {
            if (!candidateId) return;

            const apiBaseUrl = import.meta.env.VITE_API_URL || '';
            const accessToken = localStorage.getItem('access_token') || '';
            if (!accessToken) return;

            const response = await fetch(`${apiBaseUrl}/candidates/${candidateId}/media?expires_in=3600`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data: MediaResponse = await response.json();
                setMediaData(data);
            }
        } catch (error) {
            console.error('Error fetching media data:', error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const assessmentId = searchParams.get('assessment_id');
            
            if (!assessmentId || !candidateId) {
                message.error('Missing required parameters');
                setLoading(false);
                return;
            }

            const response = await getIndividualCandidateReport(assessmentId, candidateId);
            
            if (response.success && response.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let candidateData = response.data as any;
                
                try {
                    const evaluationResponse = await getCandidateEvaluation(candidateId);
                    if (evaluationResponse.success && evaluationResponse.data) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const evaluationData = evaluationResponse.data as any;
                        candidateData = {
                            ...candidateData,
                            assessment_evaluation: {
                                ...evaluationData.assessment_evaluation,
                                ...candidateData.assessment_evaluation,
                            },
                            proctoring_analysis: candidateData.proctoring_analysis || evaluationData.proctoring_analysis,
                            assessment_performance: candidateData.assessment_performance || evaluationData.assessment_performance,
                        };
                    }
                } catch (evalError) {
                    console.log('Using candidate-reports data:', evalError);
                }
                
                setReportData(candidateData);
            } else {
                message.error('Failed to fetch candidate report');
            }
        } catch (error) {
            console.error('Error fetching candidate report:', error);
            message.error('Failed to fetch candidate report');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format values
    const formatValue = (value: string | null | undefined): string => {
        if (!value || value === 'null' || value === 'NULL') {
            return '---';
        }
        return value;
    };

    // Helper function to format time
    const formatTime = (seconds: string | number): string => {
        const totalSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-white">
                <Spin size="large" tip="Loading professional report..." />
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-white">
                <p className="text-gray-600">Report not found</p>
            </div>
        );
    }

    // Extract data with fallbacks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidateInfo = reportData.candidate_info || (reportData.assessment_evaluation as any)?.candidate_image?.candidate_details || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assessmentPerf = reportData.assessment_performance || (reportData.assessment_evaluation as any)?.assessment_performance || {};
    const overallMetrics = assessmentPerf.overall_metrics || {};
    const sectionPerformance = assessmentPerf.section_performance || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proctoringAnalysis = reportData.proctoring_analysis || (reportData.assessment_evaluation as any)?.proctoring_analysis || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalDecision = (reportData.assessment_evaluation as any)?.final_decision || {};

    const candidateName = formatValue(candidateInfo.full_name);
    const candidateEmail = formatValue(candidateInfo.email);
    const scorePercentage = parseFloat(overallMetrics.score_percentage || '0');
    const grade = overallMetrics.grade || 'N/A';
    const totalQuestions = parseInt(overallMetrics.total_questions || '0');
    const correctAnswers = parseInt(overallMetrics.correct_answers || '0');
    const timeTaken = formatTime(overallMetrics.total_time_spent_seconds || '0');
    const completedAt = assessmentPerf.assessment_completed_at 
        ? new Date(assessmentPerf.assessment_completed_at).toLocaleString()
        : '---';
    
    const riskLevel = proctoringAnalysis.risk_assessment?.overall_risk_level || 'unknown';
    const totalViolations = proctoringAnalysis.violation_analysis?.total_violations || '0';
    const status = finalDecision.status || 'unknown';

    // Get compiled video
    const compiledVideo = mediaData?.files?.find(f => f.file_type === 'compiled_video');

    return (
        <div className="min-h-screen bg-white print:bg-white">
            <style>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}</style>

            {/* Professional Header - IDFC Bank Theme */}
            <div className="text-white p-8 print:p-6" style={{ background: 'linear-gradient(135deg, #8B0000 0%, #6B0000 100%)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 print:text-3xl">Assessment Report</h1>
                            <p className="text-red-100 text-lg">Candidate Performance Analysis</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-red-100">Generated on</p>
                            <p className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-8 print:p-6">
                
                {/* Candidate Information Card */}
                <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 print:shadow-none print:border print:border-gray-400">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <UserOutlined style={{ color: '#8B0000' }} />
                        Candidate Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <UserOutlined className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-semibold text-gray-900 text-lg">{candidateName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MailOutlined className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="font-medium text-gray-900">{candidateEmail}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CalendarOutlined className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Assessment Completed</p>
                                    <p className="font-medium text-gray-900">{completedAt}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ClockCircleOutlined className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Time Taken</p>
                                    <p className="font-medium text-gray-900">{timeTaken}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Summary - Highlighted Box */}
                <div className="rounded-xl shadow-lg p-8 mb-8 print:bg-gray-50" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', border: '2px solid #C67171' }}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrophyOutlined className="text-yellow-500" />
                        Performance Summary
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {/* Score Card */}
                        <div className="bg-white rounded-lg p-6 text-center shadow-md print:shadow-none print:border print:border-gray-300">
                            <div className={`text-5xl font-bold mb-2 ${scorePercentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                {scorePercentage}%
                            </div>
                            <p className="text-gray-600 font-medium">Overall Score</p>
                            <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                scorePercentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {scorePercentage >= 50 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                {scorePercentage >= 50 ? 'PASSED' : 'FAILED'}
                            </div>
                        </div>

                        {/* Grade Card */}
                        <div className="bg-white rounded-lg p-6 text-center shadow-md print:shadow-none print:border print:border-gray-300">
                            <div className={`text-5xl font-bold mb-2 ${
                                grade === 'A' ? 'text-green-600' : 
                                grade === 'B' ? 'text-orange-600' : 
                                grade === 'C' ? 'text-yellow-600' : 'text-red-600'
                            }`} style={grade === 'B' ? { color: '#8B0000' } : {}}>
                                {grade}
                            </div>
                            <p className="text-gray-600 font-medium">Grade</p>
                            <p className="text-sm text-gray-500 mt-2">{overallMetrics.performance_level || 'N/A'}</p>
                        </div>

                        {/* Questions Card */}
                        <div className="bg-white rounded-lg p-6 text-center shadow-md print:shadow-none print:border print:border-gray-300">
                            <div className="text-4xl font-bold mb-2" style={{ color: '#8B0000' }}>
                                {correctAnswers}/{totalQuestions}
                            </div>
                            <p className="text-gray-600 font-medium">Correct Answers</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Accuracy: {overallMetrics.accuracy_percentage || '0'}%
                            </p>
                        </div>

                        {/* Risk Level Card */}
                        <div className="bg-white rounded-lg p-6 text-center shadow-md print:shadow-none print:border print:border-gray-300">
                            <div className={`text-3xl font-bold mb-2 uppercase ${
                                riskLevel === 'low' ? 'text-green-600' : 
                                riskLevel === 'medium' ? 'text-yellow-600' : 
                                riskLevel === 'high' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {riskLevel}
                            </div>
                            <p className="text-gray-600 font-medium">Proctoring Risk</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Violations: {totalViolations}
                            </p>
                        </div>
                    </div>

                    {/* Final Decision */}
                    {finalDecision.reason && (
                        <div className={`rounded-lg p-6 ${
                            status === 'pass' ? 'bg-green-50 border-2 border-green-200' :
                            status === 'fail' ? 'bg-red-50 border-2 border-red-200' :
                            'bg-yellow-50 border-2 border-yellow-200'
                        }`}>
                            <h3 className="font-bold text-lg mb-2 text-gray-800">Final Decision</h3>
                            <p className="text-gray-700 mb-3">{finalDecision.reason}</p>
                            {finalDecision.recommendations && finalDecision.recommendations.length > 0 && (
                                <div className="mt-3">
                                    <p className="font-semibold text-sm text-gray-700 mb-2">Recommendations:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {finalDecision.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="text-gray-600 text-sm">{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section-wise Performance */}
                <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 print:shadow-none print:border print:border-gray-400">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileTextOutlined style={{ color: '#8B0000' }} />
                        Section-wise Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.values(sectionPerformance).map((section: any, index: number) => {
                            const sectionScore = parseInt(section.score || '0');
                            const sectionTotal = parseInt(section.total_questions || '0');
                            const sectionPercentage = sectionTotal > 0 ? (sectionScore / sectionTotal) * 100 : 0;
                            
                            return (
                                <div key={section.section_id || index} className="bg-gray-50 rounded-lg p-5 border border-gray-200 print:border-gray-400">
                                    <h3 className="font-bold text-gray-800 mb-3">{section.section_name || `Section ${index + 1}`}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Score:</span>
                                            <span className="font-semibold text-gray-900">{sectionScore}/{sectionTotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Percentage:</span>
                                            <span className={`font-semibold ${
                                                sectionPercentage >= 60 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {sectionPercentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Time Spent:</span>
                                            <span className="font-medium text-gray-900">
                                                {Math.floor(parseInt(section.time_spent_seconds || '0') / 60)} min
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Correct:</span>
                                            <span className="font-medium text-green-600">{section.correct_answers || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Question Details */}
                {assessmentPerf.question_details && assessmentPerf.question_details.length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 page-break print:shadow-none print:border print:border-gray-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Question-wise Analysis</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 print:bg-gray-200">
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Q. No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Answer</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessmentPerf.question_details.map((question: any, idx: number) => (
                                        <tr key={question.question_id || idx} className="hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="border border-gray-300 px-4 py-3 text-sm">{question.question_order || idx + 1}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                                                {question.question_type || 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm max-w-xs truncate" title={question.answer_provided}>
                                                {question.answer_provided || 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm font-semibold">
                                                {question.score_achieved}/{question.max_possible_score}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                                                {question.time_spent_seconds}s
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                {question.is_correct ? (
                                                    <CheckCircleOutlined className="text-green-600 text-lg" />
                                                ) : (
                                                    <CloseCircleOutlined className="text-red-600 text-lg" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Proctoring Analysis */}
                {proctoringAnalysis.status !== 'no_videos_found' && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 page-break print:shadow-none print:border print:border-gray-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Proctoring Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:border-gray-400">
                                <p className="text-sm text-gray-600 mb-1">Overall Risk Level</p>
                                <p className={`text-2xl font-bold uppercase ${
                                    riskLevel === 'low' ? 'text-green-600' :
                                    riskLevel === 'medium' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {riskLevel}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:border-gray-400">
                                <p className="text-sm text-gray-600 mb-1">Total Violations</p>
                                <p className="text-2xl font-bold text-gray-900">{totalViolations}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:border-gray-400">
                                <p className="text-sm text-gray-600 mb-1">Videos Analyzed</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {proctoringAnalysis.summary?.total_videos_analyzed || '0'}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Violations */}
                        {proctoringAnalysis.detailed_violations && proctoringAnalysis.detailed_violations.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-bold text-gray-800 mb-3">Violation Details</h3>
                                <div className="space-y-2">
                                    {proctoringAnalysis.detailed_violations.map((violation: any, idx: number) => (
                                        <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${
                                                        violation.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                        violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-50'
                                                    }`} style={violation.severity === 'low' ? { color: '#8B0000' } : {}}>
                                                        {violation.severity?.toUpperCase()}
                                                    </span>
                                                    <span className="text-gray-700 font-medium">{violation.type}</span>
                                                </div>
                                                <span className="text-gray-500 text-xs">Video {violation.video_id}</span>
                                            </div>
                                            <p className="text-gray-600 mt-1 text-xs">
                                                Confidence: {(parseFloat(violation.confidence || '0') * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Assessment Video */}
                {compiledVideo && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 no-print">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment Recording</h2>
                        <div className="rounded-lg p-8 text-center" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', border: '2px dashed #C67171' }}>
                            <div className="mb-4">
                                <DownloadOutlined style={{ fontSize: '48px', color: '#8B0000' }} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Assessment Video Recording</h3>
                            <p className="text-gray-600 mb-4">
                                Click the button below to download the full assessment recording
                            </p>
                            <div className="flex justify-center gap-4 items-center mb-4">
                                <div className="text-sm text-gray-600">
                                    <p><strong>Filename:</strong> {compiledVideo.file_name}</p>
                                    <p><strong>Size:</strong> {(compiledVideo.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                                    <p><strong>Format:</strong> MP4 Video</p>
                                    <p><strong>Expires:</strong> {new Date(compiledVideo.expires_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Button 
                                type="primary"
                                size="large"
                                icon={<DownloadOutlined />}
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = compiledVideo.presigned_url;
                                    link.download = compiledVideo.file_name;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    message.success('Video download started');
                                }}
                                className="cursor-pointer"
                                style={{
                                    backgroundColor: '#8B0000',
                                    borderColor: '#8B0000',
                                    fontWeight: '600',
                                    padding: '10px 32px',
                                    height: 'auto',
                                    fontSize: '16px'
                                }}
                            >
                                Download Assessment Video
                            </Button>
                        </div>
                    </div>
                )}

                {/* Candidate Images */}
                {mediaData && mediaData.files.filter(f => f.file_type === 'candidate_image').length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-8 page-break print:shadow-none print:border print:border-gray-400">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Candidate Verification Images</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mediaData.files
                                .filter(file => file.file_type === 'candidate_image')
                                .map((file, index) => (
                                    <div key={file.s3_key} className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-400">
                                        <img 
                                            src={file.presigned_url}
                                            alt={`Candidate ${index + 1}`}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/placeholder-avatar.png';
                                            }}
                                        />
                                        <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">
                                            Image {index + 1}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-gray-500 text-sm">
                    <p>This is an automated assessment report generated by the system.</p>
                    <p className="mt-1">Report ID: {candidateId}</p>
                    <p className="mt-1">© {new Date().getFullYear()} Merit Edge Assessment Platform</p>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalReport;

