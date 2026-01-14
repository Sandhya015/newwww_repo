import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeftOutlined,
    DownloadOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    CalendarOutlined,
    GlobalOutlined,
    TeamOutlined,
    FileTextOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { Button, Card, message, Spin } from 'antd';
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

interface CandidateReportData {
    candidate_id: string;
    candidate_info?: {
        full_name: string;
        email: string;
        invited_at: string;
        status?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invite_details?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    video_compilation?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    candidate_image?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proctoring_analysis?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assessment_performance?: Record<string, any>;
    status?: string;
    assessment_evaluation?: {
        candidate_id: string;
        evaluation_id: string;
        final_decision: {
            reason: string;
            decision_factors: {
                proctoring_valid: boolean;
                score_percentage: string;
                completion_percentage: string;
                completion_adequate: boolean;
                proctoring_risk_level: string;
                performance_pass: boolean;
            };
            requires_manual_review: boolean;
            confidence_level: string;
            recommendations: string[];
            next_steps: string[];
            status: string;
        };
        generated_at: string;
        evaluation_summary: {
            overall_status: string;
            proctoring_risk_level: string;
            requires_manual_review: boolean;
            assessment_score: string;
            confidence_level: string;
        };
        video_compilation: {
            source_videos?: Array<{
                s3_key: string;
                processed_at: string;
                filename: string;
                file_size: string;
                video_id: string;
            }>;
            database_entry_id?: string;
            compiled_video_url?: string;
            compilation_metadata?: {
                compilation_method: string;
                source_video_order: string[];
                total_source_videos: string;
                compilation_timestamp: string;
                presigned_url_expires_in_days: string;
            };
            compiled_video_filename?: string;
            compiled_video_s3_key?: string;
            compiled_video_size?: string;
            status: string;
            error?: string;
            compilation_timestamp?: string;
        };
        evaluation_status: string;
        assessment_id: string;
        candidate_image: {
            s3_key: string | null;
            expires_in_seconds: string;
            image_found: boolean;
            image_filename: string | null;
            image_url: string | null;
            generated_at: string;
            candidate_details?: {
                candidate_id: string;
                assessment_id: string;
                full_name: string | null;
                user_type: string | null;
                invite_token: string;
                email: string | null;
            };
        };
        proctoring_analysis: {
            summary?: {
                successful_analyses: string;
                total_videos_analyzed: string;
                analysis_success_rate: string;
                failed_analyses: string;
            };
            generated_at?: string;
            risk_assessment?: {
                average_audio_risk: string;
                average_visual_risk: string;
                risk_trend: string;
                maximum_risk_score: string;
                overall_risk_level: string;
                average_risk_score: string;
            };
            final_assessment?: {
                decision: string;
                decision_reason: string;
                confidence_level: string;
            };
            violation_analysis?: {
                total_violations: string;
                severity_breakdown: {
                    low: string;
                    high: string;
                    medium: string;
                };
                violation_patterns: Record<string, string>;
                recurring_violations: unknown[];
            };
            timeline_analysis?: {
                videos_timeline: Array<{
                    processed_at: string;
                    risk_score: string;
                    video_id: string;
                    violations_count: string;
                    status: string;
                }>;
                risk_progression: string[];
            };
            detailed_violations?: Array<{
                severity: string;
                processed_at: string;
                type: string;
                video_id: string;
                confidence: string;
                timestamp: string;
            }>;
            recommendations?: string[];
            status: string;
        };
        assessment_performance: {
            section_performance: Record<string, {
                score: string;
                time_spent_seconds: string;
                section_id: string;
                total_questions: string;
                section_name: string;
                correct_answers: string;
                question_types: Record<string, {
                    score: string;
                    time_spent_seconds: string;
                    total_questions: string;
                    question_type: string;
                    question_type_name: string;
                    correct_answers: string;
                    answered_questions: string;
                }>;
                answered_questions: string;
            }>;
            question_details: Array<{
                time_spent_seconds: string;
                max_possible_score: string;
                answer_provided: string;
                question_order: string;
                score_achieved: string;
                question_type: string;
                submitted_at: string;
                question_id: string;
                is_correct: boolean;
                status: string;
            }>;
            overall_metrics: {
                average_time_per_question: string;
                completion_percentage: string;
                max_possible_score: string;
                score_percentage: string;
                accuracy_percentage: string;
                total_questions: string;
                performance_level: string;
                total_time_spent_seconds: string;
                grade: string;
                correct_answers: string;
                overall_score: string;
                answered_questions: string;
            };
            assessment_completed_at: string;
            assessment_status: string;
            assessment_started_at: string;
            status: string;
        };
    };
}

interface SkillData {
    skill: string;
    totalQuestions: number;
    details: {
        type: string;
        correct: number;
        wrong: number;
        skipped?: number | string;
        scvgScore?: string;
    }[];
    skillGap: string;
    skillGapColor: string;
    feedback: string;
}

const CandidateReport: React.FC = () => {
    const { candidateId } = useParams<{ candidateId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [reportData, setReportData] = useState<CandidateReportData | null>(null);
    const [mediaData, setMediaData] = useState<MediaResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [videoError, setVideoError] = useState<string | null>(null);

    const toggleSectionExpansion = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };


    // PDF Download functionality
    const handleDownloadPDF = () => {
        const element = document.getElementById('candidate-report');
        if (!element) return;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Get the HTML content
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Candidate Report - ${candidateId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 25px; page-break-inside: avoid; }
                    .section h3 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
                    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                    .metric-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
                    .pass { color: #10b981; }
                    .fail { color: #ef4444; }
                    .violation { color: #f59e0b; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f3f4f6; }
                    @media print {
                        body { margin: 0; }
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Candidate Assessment Report</h1>
                    <p>Candidate ID: ${candidateId}</p>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="section">
                    <h3>Executive Summary</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Overall Score</h4>
                            <p class="${parseInt(reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.score_percentage || '0') >= 40 ? 'pass' : 'fail'}">
                                ${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.score_percentage || 0}%
                            </p>
                        </div>
                        <div class="metric-card">
                            <h4>Status</h4>
                            <p class="${reportData?.assessment_evaluation?.final_decision?.status === 'valid' || reportData?.assessment_evaluation?.final_decision?.status === 'pass' ? 'pass' : 'fail'}">
                                ${reportData?.assessment_evaluation?.final_decision?.status?.toUpperCase() || 'INVALID'}
                            </p>
                        </div>
                        <div class="metric-card">
                            <h4>Violations</h4>
                            <p class="violation">
                                ${reportData?.assessment_evaluation?.proctoring_analysis?.violation_analysis?.total_violations || 0}
                            </p>
                        </div>
                        <div class="metric-card">
                            <h4>Time Taken</h4>
                            <p>${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.total_time_spent_seconds || 0}s</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Assessment Performance</h3>
                    <p><strong>Total Questions:</strong> ${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.total_questions || 0}</p>
                    <p><strong>Correct Answers:</strong> ${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.correct_answers || 0}</p>
                    <p><strong>Accuracy:</strong> ${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.accuracy_percentage || 0}%</p>
                    <p><strong>Grade:</strong> ${reportData?.assessment_evaluation?.assessment_performance?.overall_metrics?.grade || 'N/A'}</p>
                </div>

                <div class="section">
                    <h3>Proctoring Analysis</h3>
                    <p><strong>Risk Level:</strong> ${reportData?.assessment_evaluation?.proctoring_analysis?.risk_assessment?.overall_risk_level || 'N/A'}</p>
                    <p><strong>Average Risk Score:</strong> ${reportData?.assessment_evaluation?.proctoring_analysis?.risk_assessment?.average_risk_score || 0}</p>
                    <p><strong>Total Violations:</strong> ${reportData?.assessment_evaluation?.proctoring_analysis?.violation_analysis?.total_violations || 0}</p>
                </div>

                <div class="section">
                    <h3>Recommendations</h3>
                    <ul>
                        ${reportData?.assessment_evaluation?.final_decision?.recommendations?.map((rec: string) => `<li>${rec}</li>`).join('') || '<li>No specific recommendations</li>'}
                    </ul>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    useEffect(() => {
        fetchReportData();
        fetchMediaData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateId]);

    const fetchMediaData = async () => {
        try {
            if (!candidateId) {
                return;
            }

            const apiBaseUrl = import.meta.env.VITE_API_URL || '';
            const accessToken = localStorage.getItem('access_token') || '';

            if (!accessToken) {
                return;
            }

            console.log('Fetching media data for:', candidateId);
            
            const response = await fetch(`${apiBaseUrl}/candidates/${candidateId}/media?expires_in=3600`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: MediaResponse = await response.json();
            
            console.log('Media Data Response:', data);
            console.log('Total Files:', data.total_files);
            console.log('Files Array:', data.files);
            
            // Log each file type
            data.files.forEach((file, index) => {
                console.log(`File ${index + 1}:`, {
                    type: file.file_type,
                    name: file.file_name,
                    size: `${(file.file_size / 1024).toFixed(2)} KB`,
                    url: file.presigned_url.substring(0, 100) + '...'
                });
            });
            
            setMediaData(data);
        } catch (error) {
            console.error('Error fetching media data:', error);
            // Don't show error message as media is optional
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const assessmentId = searchParams.get('assessment_id');
            
            if (!assessmentId || !candidateId) {
                message.error(`Missing parameters: Assessment ID: ${assessmentId}, Candidate ID: ${candidateId}`);
                setLoading(false);
                return;
            }

            console.log('Fetching candidate report from candidate-reports endpoint');
            console.log('Assessment ID:', assessmentId);
            console.log('Candidate ID:', candidateId);
            
            // Use the candidate-reports endpoint which has more complete data
            const response = await getIndividualCandidateReport(assessmentId, candidateId);
            
            console.log('Candidate Report Response:', response);
            
            if (response.success && response.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let candidateData = response.data as any;
                
                console.log('Raw Candidate Data from candidate-reports:', candidateData);
                console.log('Candidate Info:', candidateData.candidate_info);
                console.log('Invite Details:', candidateData.invite_details);
                console.log('Assessment Performance:', candidateData.assessment_performance);
                console.log('Proctoring Analysis:', candidateData.proctoring_analysis);
                console.log('Assessment Evaluation:', candidateData.assessment_evaluation);
                console.log('Video Compilation:', candidateData.assessment_evaluation?.video_compilation);
                
                // Try to fetch additional evaluation data if available
                try {
                    const evaluationResponse = await getCandidateEvaluation(candidateId);
                    console.log('Additional Evaluation Response:', evaluationResponse);
                    
                    if (evaluationResponse.success && evaluationResponse.data) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const evaluationData = evaluationResponse.data as any;
                        
                        // Merge evaluation data, prioritizing candidate-reports data
                        candidateData = {
                            ...candidateData,
                            // Only override if candidate-reports doesn't have these fields
                            assessment_evaluation: {
                                ...evaluationData.assessment_evaluation,
                                ...candidateData.assessment_evaluation,
                            },
                            proctoring_analysis: candidateData.proctoring_analysis || evaluationData.proctoring_analysis,
                            assessment_performance: candidateData.assessment_performance || evaluationData.assessment_performance,
                            video_compilation: candidateData.video_compilation || evaluationData.video_compilation,
                            candidate_image: candidateData.candidate_image || evaluationData.candidate_image
                        };
                        
                        console.log('Merged data with evaluation:', candidateData);
                    }
                } catch (evalError) {
                    console.log('Could not fetch additional evaluation data, using candidate-reports data:', evalError);
                }
                
                // Map API data to component structure
                const mappedData: CandidateReportData = {
                    candidate_id: candidateData.candidate_id,
                    candidate_info: {
                        full_name: candidateData.candidate_info?.full_name || 'N/A',
                        email: candidateData.candidate_info?.email || 'N/A',
                        invited_at: candidateData.candidate_info?.invited_at || '',
                        status: candidateData.status || 'N/A'
                    },
                    assessment_evaluation: candidateData.assessment_evaluation,
                    proctoring_analysis: candidateData.proctoring_analysis,
                    assessment_performance: candidateData.assessment_performance,
                    video_compilation: candidateData.video_compilation,
                    candidate_image: candidateData.candidate_image,
                    invite_details: candidateData.invite_details
                };
                
                console.log('Final Mapped Data:', mappedData);
                
                setReportData(mappedData);
            } else {
                message.error(`Failed to fetch candidate report: ${response.data || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error fetching candidate report:', error);
            message.error('Failed to fetch candidate report');
        } finally {
            setLoading(false);
        }
    };


    // Get candidate info from API data
    const getCandidateInfo = () => {
        if (!reportData) {
            return { 
                name: "Loading...", 
                email: "Loading...", 
                contact: "---", 
                testTaken: "---", 
                ipAddress: "---", 
                invitedBy: "---", 
                status: "---", 
                score: 0 
            };
        }

        // Extract completed at from either assessment_performance or assessment_evaluation
        const completedAt = reportData.assessment_performance?.assessment_completed_at
            ? new Date(reportData.assessment_performance.assessment_completed_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : reportData.assessment_evaluation?.assessment_performance?.assessment_completed_at
            ? new Date(reportData.assessment_evaluation.assessment_performance.assessment_completed_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'N/A';

        // Extract invited by from invite_details
        console.log('=== INVITED BY DEBUG ===');
        console.log('invite_details:', reportData.invite_details);
        console.log('candidate_info:', reportData.candidate_info);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('invite_details.invited_by:', (reportData.invite_details as any)?.invited_by);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('invite_details.invited_by_email:', (reportData.invite_details as any)?.invited_by_email);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('candidate_info.invited_by:', (reportData.candidate_info as any)?.invited_by);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invitedBy = (reportData.invite_details as any)?.invited_by || 
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         (reportData.invite_details as any)?.invited_by_email || 
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         (reportData.candidate_info as any)?.invited_by || 
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         (reportData.candidate_info as any)?.invited_by_email || 
                         'N/A';
        
        console.log('Final invitedBy value:', invitedBy);

        // Extract score from multiple possible locations
        const score = reportData.assessment_performance?.overall_metrics?.score_percentage
            ? parseFloat(String(reportData.assessment_performance.overall_metrics.score_percentage))
            : reportData.assessment_evaluation?.assessment_performance?.overall_metrics?.score_percentage
            ? parseFloat(String(reportData.assessment_evaluation.assessment_performance.overall_metrics.score_percentage))
            : reportData.assessment_evaluation?.final_decision?.decision_factors?.score_percentage
            ? parseFloat(reportData.assessment_evaluation.final_decision.decision_factors.score_percentage)
            : 0;

        return {
            name: reportData.candidate_info?.full_name || candidateId || 'N/A',
            email: reportData.candidate_info?.email || 'N/A',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            contact: (reportData.candidate_info as any)?.contact || 'N/A',
            testTaken: completedAt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ipAddress: (reportData.candidate_info as any)?.ip_address || 'N/A',
            invitedBy: invitedBy,
            status: reportData.candidate_info?.status || reportData.status || reportData.assessment_evaluation?.evaluation_status || 'N/A',
            score: score
        };
    };

    const candidateInfo = getCandidateInfo();

    // Debug performance data
    console.log('Report Data for Performance:', reportData);
    console.log('Assessment Performance (root):', reportData?.assessment_performance);
    console.log('Assessment Performance (evaluation):', reportData?.assessment_evaluation?.assessment_performance);
    
    // Prioritize assessment_performance at root level over nested in assessment_evaluation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assessmentPerformance = reportData?.assessment_performance || (reportData?.assessment_evaluation as any)?.assessment_performance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overallMetrics = (assessmentPerformance as any)?.overall_metrics;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionPerformance = (assessmentPerformance as any)?.section_performance;
    
    console.log('Selected Assessment Performance:', assessmentPerformance);
    console.log('Overall Metrics:', overallMetrics);
    console.log('Section Performance:', sectionPerformance);
    console.log('Total Questions:', overallMetrics?.total_questions);
    console.log('Correct Answers:', overallMetrics?.correct_answers);

    const performanceData = {
        totalScore: candidateInfo.score,
        totalCutoff: 40,
        candidateAchieved: candidateInfo.score,
        totalQuestions: parseInt(String(overallMetrics?.total_questions || '0')),
        correctAnswers: parseInt(String(overallMetrics?.correct_answers || '0')),
        assessmentSections: sectionPerformance 
            ? Object.keys(sectionPerformance).length 
            : 0,
        incorrectSkipped: parseInt(String(overallMetrics?.total_questions || '0')) - 
                         parseInt(String(overallMetrics?.correct_answers || '0'))
    };

    console.log('Calculated Performance Data:', performanceData);

    // Generate skill analysis from section performance data
    const skillAnalysisData: SkillData[] = sectionPerformance 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? Object.values(sectionPerformance).map((section: any) => {
            const totalQuestions = parseInt(section.total_questions);
            const correctAnswers = parseInt(section.correct_answers);
            const wrongAnswers = totalQuestions - correctAnswers;
            const skillGapPercentage = ((wrongAnswers / totalQuestions) * 100).toFixed(2);
            
            // Determine skill gap color based on percentage
            let skillGapColor = 'bg-green-700/60 text-green-300';
            if (parseFloat(skillGapPercentage) > 30) {
                skillGapColor = 'bg-red-700/60 text-red-300';
            } else if (parseFloat(skillGapPercentage) > 15) {
                skillGapColor = 'bg-orange-600/60 text-orange-300';
            } else if (parseFloat(skillGapPercentage) > 10) {
                skillGapColor = 'bg-yellow-600/50 text-yellow-300';
            }

            // Generate details from question types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const details = Object.values(section.question_types).map((qType: any) => {
                const correct = parseInt(qType.correct_answers);
                const total = parseInt(qType.total_questions);
                const wrong = total - correct;
                
                return {
                    type: `${qType.total_questions} - ${qType.question_type_name}`,
                    correct,
                    wrong,
                    skipped: 0,
                    scvgScore: qType.score ? `${((parseInt(qType.score) / parseInt(qType.total_questions)) * 100).toFixed(0)}%` : undefined
                };
            });

            return {
                skill: section.section_name,
                totalQuestions,
                details,
                skillGap: `${skillGapPercentage}%`,
                skillGapColor,
                feedback: `Performance analysis for ${section.section_name}: ${correctAnswers} correct out of ${totalQuestions} questions.`
            };
        })
        : [];

    // Generate section performance data from API
    const sectionPerformanceData = reportData?.assessment_evaluation?.assessment_performance?.section_performance 
        ? Object.values(reportData.assessment_evaluation.assessment_performance.section_performance).map((section, index) => {
            const totalQuestions = parseInt(section.total_questions);
            const score = parseInt(section.score);
            const scorePercentage = (score / totalQuestions) * 100;
            const timeSpentMinutes = Math.floor(parseInt(section.time_spent_seconds) / 60);
            
            // Determine cutoff color based on score percentage
            let cutoffColor = 'bg-green-600/90';
            if (scorePercentage < 50) {
                cutoffColor = 'bg-red-700/80';
            } else if (scorePercentage < 65) {
                cutoffColor = 'bg-yellow-600/80';
            }

            // Get question types
            const questionTypes = Object.values(section.question_types)
                .map(qt => qt.question_type_name)
                .join(', ');

            return {
                title: section.section_name,
                section: `Section ${index + 1}`,
                totalQuestions,
                givenTime: "N/A", // Not available in API
                takenTime: `${timeSpentMinutes} min`,
                questionTypes,
                cutoff: `Score: ${score}/${totalQuestions} (${scorePercentage.toFixed(0)}%)`,
                cutoffColor,
            };
        })
        : [];


    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--accent-primary)' }} spin />} 
                    tip="Loading candidate evaluation..."
                    size="large"
                />
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div className="text-center">
                    <h2 className="text-2xl mb-4">Candidate evaluation not found</h2>
                    <Button onClick={() => navigate('/reports')}>Back to Reports</Button>
                </div>
            </div>
        );
    }

    return (
        <div id="candidate-report" className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', zIndex: 1, position: 'relative' }}>
            {/* Header */}
            <div className="p-6 border-b relative" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', zIndex: 10, position: 'relative' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => {
                                const assessmentId = searchParams.get('assessment_id');
                                if (assessmentId) {
                                    navigate(`/reports?assessment_id=${assessmentId}`);
                                } else {
                                    navigate('/reports');
                                }
                            }}
                            className="flex items-center cursor-pointer"
                        />
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', zIndex: 11, position: 'relative' }}>
                                Test Report: {candidateInfo.name}
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)', zIndex: 11, position: 'relative' }}>
                                Assessment List /Test Report: {candidateInfo.name}
                            </p>
                        </div>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            const assessmentId = searchParams.get('assessment_id');
                            const url = `/professional-report/candidate/${candidateId}${assessmentId ? `?assessment_id=${assessmentId}` : ''}`;
                            window.open(url, '_blank');
                        }}
                        className="bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer"
                        style={{ 
                            backgroundColor: '#374151', 
                            borderColor: '#4b5563',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            fontWeight: '600'
                        }}
                    >
                        Download Report
                    </Button>
                </div>
            </div>

            <div className="p-6 relative" style={{ backgroundColor: 'var(--bg-primary)', zIndex: 5, position: 'relative' }}>
                {/* Candidate Overview */}
                <div className="mb-6 relative" style={{ zIndex: 6, position: 'relative' }}>
                    <div className="p-6 rounded-2xl shadow-lg" style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        borderWidth: '1px', 
                        borderStyle: 'solid', 
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                    }}>
                        {/* Title */}
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Candidate Overview</h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Get a quick snapshot of candidate participation, performance, top talent, drop-offs, and behavioral insights to identify trends and hidden potential.
                    </p>
                        </div>

                        {/* Card */}
                        <div className="flex flex-col md:flex-row rounded-xl overflow-hidden" style={{ 
                            backgroundColor: 'var(--bg-tertiary)', 
                            borderWidth: '1px', 
                            borderStyle: 'solid', 
                            borderColor: 'var(--border-primary)'
                        }}>
                            {/* Left: Performance Section */}
                            <div className="flex-1 p-6 flex flex-col items-center justify-center" style={{ 
                                backgroundColor: 'var(--bg-secondary)', 
                                borderRightWidth: '1px', 
                                borderRightStyle: 'solid', 
                                borderRightColor: 'var(--border-primary)'
                            }}>
                                <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Performance</h3>

                                {/* Gauge */}
                                <div className="relative w-32 h-32 mb-3">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="54" stroke="var(--border-primary)" strokeWidth="10" fill="none" />
                                                <circle
                                            cx="64"
                                            cy="64"
                                            r="54"
                                                    stroke={Number(candidateInfo.score) >= 50 ? "#10b981" : "#ef4444"}
                                            strokeWidth="10"
                                            strokeDasharray={`${(Number(candidateInfo.score) / 100) * 339} 339`}
                                                    strokeLinecap="round"
                                            fill="none"
                                        />
                                            </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{candidateInfo.score}%</span>
                                        <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Total Score</span>
                                        </div>
                                    </div>
                                    
                                <p className={`text-xs text-center ${
                                    Number(candidateInfo.score) >= 50 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                            {Number(candidateInfo.score) >= 50 
                                                ? 'Candidate has met the qualifying criteria for this test.'
                                                : 'Not qualified'
                                            }
                                        </p>
                                        
                                {/* Bars */}
                                <div className="w-full mt-4">
                                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        <span>Total Cut-off:</span>
                                        <span>50%</span>
                                                </div>
                                    <div className="w-full h-2 rounded-full mb-3 overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div className="h-full bg-blue-500 w-[50%]" />
                                            </div>
                                            
                                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        <span>Candidate Achieved:</span>
                                        <span>{candidateInfo.score}%</span>
                                                </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div className={`h-full ${
                                            Number(candidateInfo.score) >= 50 ? 'bg-green-500' : 'bg-red-500'
                                        }`} style={{ width: `${candidateInfo.score}%` }} />
                                            </div>
                                        </div>
                                    </div>

                            {/* Right: Candidate Info */}
                            <div className="flex-1 p-6 grid grid-cols-2 gap-x-8 gap-y-3">
                                {/* Left Column */}
                                        <div className="space-y-4">
                                    <div className="flex items-center text-sm">
                                        <UserOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                        <span className="font-medium text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.name}</span>
                                            </div>

                                    <div className="flex items-center text-sm">
                                        <MailOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email:</span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.email}</span>
                                            </div>

                                    <div className="flex items-center text-sm">
                                        <PhoneOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.contact}</span>
                                            </div>

                                    <div className="flex items-center text-sm">
                                        <CalendarOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Test Taken:</span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.testTaken}</span>
                                            </div>
                                        </div>

                                {/* Right Column */}
                                        <div className="space-y-4">
                                    <div className="flex items-center text-sm">
                                        <GlobalOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>IP Address:</span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.ipAddress}</span>
                                            </div>

                                    <div className="flex items-center text-sm">
                                        <TeamOutlined className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Invited By:</span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{candidateInfo.invitedBy}</span>
                                            </div>

                                    <div className="flex items-center text-sm">
                                        <FileTextOutlined className="w-4 h-4 text-green-500 mr-2" />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                        <span className="bg-green-600/20 text-green-400 px-3 py-0.5 rounded-full text-xs font-medium ml-2">
                                            Completed
                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <Card className="mb-12" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Executive Summary</h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Get a quick snapshot of candidate participation, performance, top talent, drop-offs, and behavioral insights to identify trends and hidden potential.</p>
                        </div>
                        <button
                            onClick={() => toggleSectionExpansion('executive-summary')}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg 
                                className={`w-5 h-5 transition-transform duration-200 ${
                                    expandedSections.has('executive-summary') ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="var(--text-secondary)" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {expandedSections.has('executive-summary') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Top Strengths */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Top Strengths</h3>
                            <p className="text-green-500 text-sm">
                                {skillAnalysisData
                                    .filter(skill => parseFloat(skill.skillGap.replace('%', '')) < 15)
                                    .map(skill => skill.skill)
                                    .join(', ') || 'N/A'}
                            </p>
                                </div>
                        
                        {/* Major Gaps */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Major Gaps</h3>
                            <p className="text-red-500 text-sm">
                                {skillAnalysisData
                                    .filter(skill => parseFloat(skill.skillGap.replace('%', '')) > 30)
                                    .map(skill => skill.skill)
                                    .join(', ') || 'N/A'}
                            </p>
                                </div>
                        
                        {/* Assessment Sections */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Assessment Sections</h3>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{performanceData.assessmentSections}</p>
                        </div>
                        
                        {/* Total Questions */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Total Questions</h3>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{performanceData.totalQuestions}</p>
                        </div>
                        
                        {/* Correct Answers */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Correct Answers</h3>
                            <p className="text-green-500 text-2xl font-bold">{performanceData.correctAnswers}</p>
                        </div>
                        
                        {/* Incorrect/Skipped */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Incorrect/Skipped</h3>
                            <p className="text-red-500 text-2xl font-bold">{performanceData.incorrectSkipped}</p>
                        </div>
                        </div>
                    )}
                </Card><br></br>

                {/* SGA Analysis */}
                <Card className="mb-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>SGA Analysis</h2>
                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                                A quick snapshot of candidate participation, performance, top talent, drop-offs, and behavioral insights to identify trends and hidden potential.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleSectionExpansion('sga-analysis')}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg 
                                className={`w-5 h-5 transition-transform duration-200 ${
                                    expandedSections.has('sga-analysis') ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="var(--text-secondary)" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {expandedSections.has('sga-analysis') && (
                        <div className="p-4 rounded-xl shadow-md overflow-x-auto min-w-full" style={{ 
                            backgroundColor: 'var(--bg-tertiary)', 
                            borderWidth: '1px', 
                            borderStyle: 'solid', 
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}>
                        <table className="w-full border-collapse text-sm table-fixed">
                            <thead>
                                <tr className="text-xs" style={{ 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    color: 'var(--text-secondary)',
                                    borderBottomWidth: '1px',
                                    borderBottomStyle: 'solid',
                                    borderBottomColor: 'var(--border-primary)'
                                }}>
                                    <th className="text-left px-4 py-3 font-medium w-48 min-w-[200px]">Skill</th>
                                    <th className="text-left px-4 py-3 font-medium w-40">Question Type</th>
                                    <th className="text-left px-4 py-3 font-medium w-20">Correct</th>
                                    <th className="text-left px-4 py-3 font-medium w-20">Wrong</th>
                                    <th className="text-left px-4 py-3 font-medium w-20">Skipped</th>
                                    <th className="text-left px-4 py-3 font-medium w-24">SCVG Score %</th>
                                    <th className="text-left px-4 py-3 font-medium w-24">Skill Gap</th>
                                    <th className="text-left px-4 py-3 font-medium w-80">Feedback</th>
                                </tr>
                            </thead>

                            <tbody>
                                {skillAnalysisData.map((skill, idx) => (
                                    <React.Fragment key={idx}>
                                        {skill.details.map((detail, i) => (
                                            <tr
                                                key={i}
                                                className={`transition cursor-pointer ${
                                                    i === 0 ? "align-top" : ""
                                                }`}
                                                style={{ 
                                                    borderBottomWidth: '1px',
                                                    borderBottomStyle: 'solid',
                                                    borderBottomColor: 'var(--border-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                {/* Skill name only for first row */}
                                                {i === 0 ? (
                                                    <td
                                                        rowSpan={skill.details.length}
                                                        className="px-4 py-3 font-semibold text-sm align-top w-48 min-w-[200px]"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        <div className="whitespace-nowrap">
                                                            {skill.skill}
                                                        </div>
                                                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                            (Total Questions {skill.totalQuestions})
                                                        </p>
                                                    </td>
                                                ) : null}

                                                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{detail.type}</td>
                                                <td className="px-4 py-3 text-green-500 font-medium">
                                                    {detail.correct}
                                                </td>
                                                <td className="px-4 py-3 text-red-500 font-medium">
                                                    {detail.wrong}
                                                </td>
                                                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                                                    {detail.skipped ?? "--"}
                                                </td>
                                                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                                                    {detail.scvgScore ?? "--"}
                                                </td>

                                                {/* Skill Gap only for first row */}
                                                {i === 0 ? (
                                                    <td
                                                        rowSpan={skill.details.length}
                                                        className="px-4 py-3 text-center align-top"
                                                    >
                                                        <span
                                                            className={`px-2 py-1 rounded-md text-xs font-medium ${skill.skillGapColor}`}
                                                        >
                                                            {skill.skillGap}
                                                        </span>
                                                    </td>
                                                ) : null}

                                                {/* Feedback only for first row */}
                                                {i === 0 ? (
                                                    <td
                                                        rowSpan={skill.details.length}
                                                        className="px-4 py-3 text-sm align-top w-80"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        <div className="break-words">
                                                            {skill.feedback}
                                                        </div>
                                                    </td>
                                                ) : null}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </Card>

                {/* Section-wise Performance */}
                <div className="py-8 px-6 rounded-xl mb-8 mt-8" style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)'
                }}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Section-wise Performance</h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Get a quick snapshot of candidate participation, performance, top
                                talent, drop-offs, and behavioral insights to identify trends and hidden
                                potential.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleSectionExpansion('section-performance')}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg 
                                className={`w-5 h-5 transition-transform duration-200 ${
                                    expandedSections.has('section-performance') ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="var(--text-secondary)" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {expandedSections.has('section-performance') && (
                        <>
                            {/* Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {sectionPerformanceData.map((sec, index) => (
                            <div
                                key={index}
                                className="rounded-2xl p-4 flex flex-col justify-between shadow-md"
                                style={{ 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    borderWidth: '1px', 
                                    borderStyle: 'solid', 
                                    borderColor: 'var(--border-primary)'
                                }}
                            >
                                {/* Header Row */}
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{sec.title}</h3>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sec.section}</p>
                                    </div>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-medium ${sec.cutoffColor}`}
                                    >
                                        {sec.cutoff}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Question:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{sec.totalQuestions}</span>
                                    </div>

                                    <div className="flex justify-between rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Given Time:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{sec.givenTime}</span>
                                    </div>

                                    <div className="flex justify-between rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Taken Time:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{sec.takenTime}</span>
                                    </div>

                                    <div className="flex flex-col rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <span className="mb-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Question Types:
                                        </span>
                                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{sec.questionTypes}</span>
                                    </div>
                                </div>

                                {/* Footer Link */}
                                <div className="mt-4">
                                    <button 
                                        onClick={() => navigate(`/reports/performance/${candidateId}`)}
                                        className="text-xs hover:underline cursor-pointer"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        View All Questions & Responses
                                    </button>
                                </div>
                            </div>
                        ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Face Analysis */}
                <Card className="mb-8 mt-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Face Analysis</h2>
                            <p className="text-gray-400">
                                Get a quick snapshot of candidate participation, performance, top talent, drop-offs, and behavioral insights to identify trends and hidden potential.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleSectionExpansion('face-analysis')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                    expandedSections.has('face-analysis') ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {expandedSections.has('face-analysis') && (
                        <>
                            {mediaData && mediaData.files.filter(f => f.file_type === 'candidate_image').length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
                                    {mediaData.files
                                        .filter(file => file.file_type === 'candidate_image')
                                        .map((file, index) => (
                                            <div key={file.s3_key} className="bg-blue-900 rounded-lg p-4 border border-gray-600">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-sm font-medium text-gray-300">Image {index + 1}</span>
                                                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                        Verified
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-gray-800 rounded-lg overflow-hidden relative mb-3" style={{ height: '300px' }}>
                                                    <img 
                                                        src={file.presigned_url}
                                                        alt={`Candidate ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/placeholder-avatar.png';
                                                        }}
                                                    />
                                                </div>
                                                
                                                <div className="text-xs text-gray-400 space-y-1">
                                                    <p className="truncate" title={file.file_name}>{file.file_name}</p>
                                                    <p>Size: {(file.file_size / 1024).toFixed(2)} KB</p>
                                                    <p>Captured: {new Date(file.last_modified).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center p-8">
                                    <p className="text-gray-400">No candidate images available</p>
                                </div>
                            )}
                        </>
                    )}
                </Card><br></br>

                {/* Screen Activity Log */}
                <Card className="mb-8 mt-16" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Screen Activity Log</h2>
                            <p className="text-gray-400">
                                Get a quick snapshot of candidate participation, performance.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleSectionExpansion('screen-activity')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                    expandedSections.has('screen-activity') ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {expandedSections.has('screen-activity') && (
                        <>
                            {reportData?.assessment_evaluation?.video_compilation?.status === 'failed' || 
                             reportData?.assessment_evaluation?.video_compilation?.error ? (
                                <div className="flex flex-col justify-center items-center p-8">
                                    <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-6 max-w-md text-center">
                                        <p className="text-yellow-400 font-semibold mb-2">Video Compilation Error</p>
                                        <p className="text-gray-400 text-sm">
                                            {reportData.assessment_evaluation.video_compilation.error || 'Video compilation failed'}
                                        </p>
                                    </div>
                                </div>
                            ) : mediaData && mediaData.files.filter(f => f.file_type === 'compiled_video').length > 0 ? (
                                <>
                                    {console.log('Rendering compiled video from media API')}
                                    {console.log('Media data files:', mediaData.files)}
                                    {console.log('Compiled video files:', mediaData.files.filter(f => f.file_type === 'compiled_video'))}
                                    <div className="mb-6">
                                        <p className="text-gray-300 mb-4">
                                            Compiled Assessment Video ({mediaData.files.filter(f => f.file_type === 'compiled_video').length} file(s))
                                        </p>
                                        
                                        {mediaData.files
                                            .filter(file => file.file_type === 'compiled_video')
                                            .map((file) => {
                                                console.log('Rendering video:', file.file_name, 'URL:', file.presigned_url);
                                                return (
                                                    <div key={file.s3_key} className="bg-gray-900 rounded-lg p-4 mb-4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h3 className="text-white font-semibold">Compiled Assessment Video</h3>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-sm text-gray-400">
                                                                    Size: {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                                                                </div>
                                                                <Button 
                                                                    type="primary"
                                                                    icon={<DownloadOutlined />}
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = file.presigned_url;
                                                                        link.download = file.file_name;
                                                                        link.target = '_blank';
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                        message.success('Video download started');
                                                                    }}
                                                                    className="cursor-pointer"
                                                                    style={{
                                                                        backgroundColor: '#3b82f6',
                                                                        borderColor: '#3b82f6',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    Download Video
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {videoError ? (
                                                            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6 text-center">
                                                                <p className="text-red-400 mb-2">Video playback error</p>
                                                                <p className="text-gray-400 text-sm mb-4">{videoError}</p>
                                                                <Button 
                                                                    type="primary"
                                                                    icon={<DownloadOutlined />}
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = file.presigned_url;
                                                                        link.download = file.file_name;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }}
                                                                >
                                                                    Download Video Instead
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <video 
                                                                controls 
                                                                className="w-full max-w-4xl rounded-lg bg-black"
                                                                preload="auto"
                                                                playsInline
                                                                onError={(e) => {
                                                                    console.error('Video load error:', e);
                                                                    console.error('Failed video URL:', file.presigned_url);
                                                                    const videoElement = e.currentTarget;
                                                                    console.error('Video error details:', {
                                                                        error: videoElement.error,
                                                                        errorCode: videoElement.error?.code,
                                                                        errorMessage: videoElement.error?.message,
                                                                        networkState: videoElement.networkState,
                                                                        readyState: videoElement.readyState,
                                                                        src: videoElement.src
                                                                    });
                                                                    setVideoError(`Error code ${videoElement.error?.code}: ${videoElement.error?.message || 'Unknown error'}`);
                                                                }}
                                                                onLoadedMetadata={(e) => {
                                                                    console.log('Video loaded successfully:', file.file_name);
                                                                    console.log('Video duration:', e.currentTarget.duration);
                                                                    console.log('Video dimensions:', e.currentTarget.videoWidth, 'x', e.currentTarget.videoHeight);
                                                                    setVideoError(null);
                                                                }}
                                                                onCanPlay={() => {
                                                                    console.log('Video is ready to play');
                                                                }}
                                                                onLoadStart={() => {
                                                                    console.log('Video loading started...');
                                                                }}
                                                                style={{ maxHeight: '600px' }}
                                                            >
                                                                <source src={file.presigned_url} type="video/mp4" />
                                                                <source src={file.presigned_url} type="video/webm" />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        )}
                                                        <div className="mt-3 text-xs text-gray-400 space-y-1">
                                                            <p className="truncate" title={file.file_name}>Filename: {file.file_name}</p>
                                                            <p>Last Modified: {new Date(file.last_modified).toLocaleString()}</p>
                                                            <p>Expires: {new Date(file.expires_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            ) : reportData?.assessment_evaluation?.video_compilation?.source_videos && 
                               reportData.assessment_evaluation.video_compilation.source_videos.length > 0 ? (
                                <>
                                    <div className="mb-6">
                                        <p className="text-gray-300 mb-4">
                                            Video Compilation: {reportData.assessment_evaluation.video_compilation.compilation_metadata?.total_source_videos || reportData.assessment_evaluation.video_compilation.source_videos.length} source videos
                                        </p>
                                        
                                        {reportData.assessment_evaluation.video_compilation.compiled_video_url && (
                                            <div className="bg-gray-900 rounded-lg p-4">
                                                <h3 className="text-white font-semibold mb-2">Compiled Assessment Video</h3>
                                                <video 
                                                    controls 
                                                    className="w-full max-w-4xl rounded-lg"
                                                    src={reportData.assessment_evaluation.video_compilation.compiled_video_url}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                                {reportData.assessment_evaluation.video_compilation.compiled_video_size && (
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Size: {(parseInt(reportData.assessment_evaluation.video_compilation.compiled_video_size) / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6">
                                        <h3 className="text-white font-semibold mb-4">Source Video Segments</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {reportData.assessment_evaluation.video_compilation.source_videos.map((video) => (
                                                <div key={video.video_id} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-medium text-gray-300">Video {video.video_id}</span>
                                                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                                            {(parseInt(video.file_size) / 1024).toFixed(0)} KB
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-2">{video.filename}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Processed: {new Date(video.processed_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-center items-center p-8">
                                    <p className="text-gray-400">No screen activity data available</p>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default CandidateReport;