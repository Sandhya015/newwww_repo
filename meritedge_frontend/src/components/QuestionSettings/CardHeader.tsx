import { Button, Col, Modal, Row, Typography, Checkbox, DatePicker, InputNumber, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentAssessment } from "../../store/miscSlice";
import { publishAssessment, getAssessment, getSectionSettings } from "../../lib/api";
import { showToast } from "../../utils/toast";
import dayjs from "dayjs";

const { Title, Paragraph } = Typography;

interface QuestionSettingsCardHeaderProps {
    selectedMenuItem?: string;
    onMenuChange?: (key: string) => void;
}

export default function QuestionSettingsCardHeader({ 
    selectedMenuItem = "general",
    onMenuChange 
}: QuestionSettingsCardHeaderProps) {
    const navigate = useNavigate();
    const currentAssessment = useSelector(selectCurrentAssessment);

    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishFormData, setPublishFormData] = useState({
        publish_immediately: true,
        scheduled_publish_date: "",
        send_notifications: true,
        auto_archive_date: "",
        archive_after_days: 0
    });
    
    const handleButtonClick = () => {
        if (selectedMenuItem === "general") {
            // Navigate to section tab
            if (onMenuChange) {
                onMenuChange("section");
            }
        } else if (selectedMenuItem === "section") {
            // Open publish modal
            openPublishModal();
        }
    };

    const openPublishModal = () => {
        // Check if assessment is ready for publishing
        if (!currentAssessment?.key) {
            message.error('No assessment selected');
            return;
        }
        
        setIsPublishOpen(true);
    };
    
    const handlePublishCancel = () => {
        setIsPublishOpen(false);
        setPublishFormData({
            publish_immediately: true,
            scheduled_publish_date: "",
            send_notifications: true,
            auto_archive_date: "",
            archive_after_days: 0
        });
    };

    const handlePublishFormChange = (field: string, value: string | boolean | number) => {
        setPublishFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePublishError = (response: { status_code?: number; data?: { detail?: string } }) => {
        if (response.status_code === 400) {
            const errorDetail = response.data?.detail || '';
            if (errorDetail.includes('Assessment not ready for publishing')) {
                const regex = /\[(.*?)\]/;
                const missingRequirements = regex.exec(errorDetail);
                if (missingRequirements) {
                    const requirements = missingRequirements[1]
                        .replace(/'/g, '')
                        .split(', ')
                        .map(req => `• ${req}`);
                    
                    message.error({
                        content: (
                            <div>
                                <div className="font-semibold mb-2">Assessment not ready for publishing</div>
                                <div className="text-sm">Please configure the following settings first:</div>
                                <ul className="text-sm mt-1 ml-4">
                                    {requirements.map((req) => (
                                        <li key={req}>{req}</li>
                                    ))}
                                </ul>
                                <div className="text-sm mt-2 text-blue-300">
                                    Go to the "General" tab to configure these settings.
                                </div>
                            </div>
                        ),
                        duration: 8
                    });
                } else {
                    message.error('Assessment not ready for publishing. Please configure the required settings first.');
                }
            } else {
                message.error(errorDetail || 'Failed to publish assessment');
            }
        } else {
            const errorMessage = typeof response.data === 'string' ? response.data : 'Failed to publish assessment';
            message.error(errorMessage);
        }
    };

    // Validate section times before publishing
    const validateSectionTimes = async (): Promise<{ isValid: boolean; missingSections: string[] }> => {
        if (!currentAssessment?.key) {
            return { isValid: false, missingSections: [] };
        }

        try {
            // Get assessment with sections
            const assessmentResponse = await getAssessment(currentAssessment.key);
            if (!assessmentResponse.success || !assessmentResponse.data?.sections) {
                return { isValid: false, missingSections: [] };
            }

            const sections = assessmentResponse.data.sections;
            const missingSections: string[] = [];

            // Check each section for section time
            for (const section of sections) {
                const sectionId = section.section_id || section.unique_id;
                if (!sectionId) continue;

                try {
                    const settingsResponse = await getSectionSettings(currentAssessment.key, sectionId);
                    if (settingsResponse.success && settingsResponse.data) {
                        const sectionTime = settingsResponse.data.section_config?.section_time;
                        
                        // Check if section_time exists and has at least one non-zero value
                        if (!sectionTime || (sectionTime.hours === 0 && sectionTime.mins === 0)) {
                            missingSections.push(section.section_name || `Section ${section.section_order || ''}`);
                        }
                    } else {
                        // If we can't fetch settings, assume section time is missing
                        missingSections.push(section.section_name || `Section ${section.section_order || ''}`);
                    }
                } catch (error) {
                    console.error(`Error fetching settings for section ${sectionId}:`, error);
                    missingSections.push(section.section_name || `Section ${section.section_order || ''}`);
                }
            }

            return {
                isValid: missingSections.length === 0,
                missingSections
            };
        } catch (error) {
            console.error('Error validating section times:', error);
            return { isValid: false, missingSections: [] };
        }
    };

    const handlePublishSubmit = async () => {
        if (!currentAssessment?.key) {
            message.error('No assessment selected');
            return;
        }

        setIsPublishing(true);
        try {
            // Validate section times before publishing
            const validation = await validateSectionTimes();
            if (!validation.isValid) {
                setIsPublishing(false);
                const sectionList = validation.missingSections.join(', ');
                showToast({
                    message: "Section Time Required",
                    description: `Please set section time for the following sections: ${sectionList}. Control how long candidates spend on each section by setting a specific time limit.`,
                    position: "top-right",
                    duration: 5000,
                    type: "error"
                });
                return;
            }

            const response = await publishAssessment(currentAssessment.key, publishFormData);
            if (response.success) {
                // Close the modal first
                setIsPublishOpen(false);
                
                // Show success toast
                showToast({
                    message: "Assessment Published Successfully",
                    description: "Your assessment has been published and is now live!",
                    position: "top-right",
                    duration: 4000,
                    type: "success"
                });
                
                // Navigate after showing toast
                setTimeout(() => {
                    navigate('/cognitive');
                }, 2000);
            } else {
                handlePublishError(response);
            }
        } catch (error) {
            console.error('Error publishing assessment:', error);
            message.error('An error occurred while publishing the assessment');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <>
            <Row align="middle" justify="space-between" gutter={20} className="pb-5" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                <Col>
                    <Row align="middle">
                        <Col>
                            <Row align="middle" gutter={10}>
                                <Col style={{ fontFamily: "Helvetica_Neue-Medium, Helvetica", fontWeight: "500", color: "var(--text-primary)", fontSize: "24px", }}>
                                    Settings
                                </Col>
                            </Row>
                            <p className="!mt-2" style={{ fontFamily: "Helvetica_Neue-Regular, Helvetica", fontWeight: "400", color: "var(--text-secondary)", fontSize: "16px", }} >
                                Configure proctoring, section timers, and candidate details for a secure test experience.
                            </p>
                        </Col>
                    </Row>
                </Col>

                <Col>
                    <Row align="middle" justify="space-between" gutter={20}>
                        {/* <Col>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Search..."
                                className="!h-10 !w-70 sm:!h-12 !pl-5 !mt-2 !rounded-xl !text-white !bg-[#1D1D23] !border !border-[#23263C] !placeholder-[#ffffff] [&>input::placeholder]:!text-[#c2c2c2]"
                                autoComplete="new-password"
                            />
                        </Col> */}

                        <Col>
                            {/* <div className="group !relative !w-full !rounded-full !overflow-hidden !mt-3">
                                <div className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full" style={{ background: "conic-gradient(from 360deg at 50% 50%, #1E1E1E 110deg, #FFFFFF 180deg, #1E1E1E 250deg)" }} />

                                <div
                                    className="!bg-black !rounded-full !flex !items-center !justify-start h-auto !rounded-full overflow-hidden !border-[#33343B] !m-[2px]"
                                    style={{
                                        background: "linear-gradient(158deg, rgba(64,65,79,0.3) 0%, rgba(27,27,31,0.3) 100%)",
                                        boxShadow: "0px 4px 4px #00000040",
                                        backdropFilter: "blur(25px) brightness(100%)",
                                        WebkitBackdropFilter: "blur(25px) brightness(100%)"
                                    }}
                                >
                                    <div className="!bg-[#000000] !text-white !rounded-full !border-none flex items-center justify-center !px-6 !py-5 !m-[1.5px]" onClick={openPublishModal}>
                                        <img src={`${import.meta.env.BASE_URL}question-setting/rocket-launch.svg`} /> Publish now
                                    </div>
                                </div>
                            </div> */}
                        
                            {selectedMenuItem === "general" ? (
                                <Button 
                                    className="!rounded-full !border flex items-center justify-center !px-6 !py-6 !mt-3" 
                                    style={{ 
                                        borderColor: "var(--border-primary)", 
                                        backgroundColor: "transparent",
                                        color: "var(--text-primary)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                    onClick={handleButtonClick}
                                >
                                    Next
                                </Button>
                            ) : (
                                <div className="group !relative !w-full !rounded-full !overflow-hidden !mt-3">
                                    <div className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full group-hover:!opacity-50" style={{ background: "conic-gradient(from 360deg at 50% 50%, var(--bg-primary) 110deg, var(--text-primary) 180deg, var(--bg-primary) 250deg)" }} />
                                
                                    <Button 
                                        className="!backdrop-blur-[10px] duration-400 !rounded-full !border-none flex items-center justify-center !px-6 !py-6 !m-[1.5px]" 
                                        style={{
                                            backgroundColor: "var(--bg-primary)",
                                            color: "var(--text-primary)"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                                        }}
                                        onClick={handleButtonClick}
                                    >
                                        <img src={`${import.meta.env.BASE_URL}question-setting/rocket-launch.svg`} alt="Publish" /> Publish now
                                    </Button>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Modal
                className="!w-[600px] 
                    [&_.ant-modal-content]:!bg-[var(--bg-primary)]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-header]:!bg-[var(--bg-primary)]
                    [&_.ant-modal-title]:!text-[var(--text-primary)]
                    [&_.ant-modal-body]:!text-[var(--text-primary)]
                    [&_.ant-modal-close]:!text-[var(--text-primary)]
                    [&_.ant-modal-close]:!top-5 [&_.ant-modal-close]:!right-5
                    [&_.ant-modal-close-x]:!text-lg"
                title={
                    <Row justify="center" align="middle" style={{ marginBottom: "20px" }}>
                        <Col span={24} style={{ textAlign: "center" }}>
                            <Title level={4} style={{ color: 'var(--text-primary)' }}>Publish Assessment</Title>
                            <Paragraph className="!font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Configure publish settings for your assessment
                            </Paragraph>
                            <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                                <Paragraph className="!text-yellow-300 !text-xs !mb-0">
                                    <strong>Note:</strong> Make sure you've configured the invite start date and end date in the General tab before publishing.
                                </Paragraph>
                            </div>
                        </Col>
                    </Row>
                }
                open={isPublishOpen}
                onCancel={handlePublishCancel}
                footer={[
                    <Button key="cancel" onClick={handlePublishCancel} style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                        Cancel
                    </Button>,
                    <Button 
                        key="publish" 
                        type="primary" 
                        onClick={handlePublishSubmit}
                        loading={isPublishing}
                        disabled={isPublishing}
                        style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                    >
                        {isPublishing ? 'Publishing...' : 'Publish Assessment'}
                    </Button>
                ]}
            >
                <div className="space-y-6">
                    {/* Publish Immediately */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="publish_immediately" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Publish Immediately</label>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Publish the assessment right now</p>
                        </div>
                        <Checkbox
                            id="publish_immediately"
                            checked={publishFormData.publish_immediately}
                            onChange={(e) => handlePublishFormChange('publish_immediately', e.target.checked)}
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>

                    {/* Scheduled Publish Date */}
                    {!publishFormData.publish_immediately && (
                        <div>
                            <label htmlFor="scheduled_publish_date" className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Scheduled Publish Date</label>
                            <DatePicker
                                id="scheduled_publish_date"
                                showTime
                                value={publishFormData.scheduled_publish_date ? dayjs(publishFormData.scheduled_publish_date) : null}
                                onChange={(date) => handlePublishFormChange('scheduled_publish_date', date ? date.toISOString() : '')}
                                className="w-full [&_.ant-picker-input]:!text-[var(--text-primary)] [&_.ant-picker-input]:!bg-[var(--bg-secondary)] [&_.ant-picker-input]:!placeholder-[var(--text-secondary)]"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    )}

                    {/* Send Notifications */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="send_notifications" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Send Notifications</label>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Notify candidates about the assessment</p>
                        </div>
                        <Checkbox
                            id="send_notifications"
                            checked={publishFormData.send_notifications}
                            onChange={(e) => handlePublishFormChange('send_notifications', e.target.checked)}
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>

                    {/* Auto Archive Date */}
                    <div>
                        <label htmlFor="auto_archive_date" className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Auto Archive Date (Optional)</label>
                        <DatePicker
                            id="auto_archive_date"
                            showTime
                            value={publishFormData.auto_archive_date ? dayjs(publishFormData.auto_archive_date) : null}
                            onChange={(date) => handlePublishFormChange('auto_archive_date', date ? date.toISOString() : '')}
                            className="w-full [&_.ant-picker-input]:!text-[var(--text-primary)] [&_.ant-picker-input]:!bg-[var(--bg-secondary)] [&_.ant-picker-input]:!placeholder-[var(--text-secondary)]"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Archive After Days */}
                    <div>
                        <label htmlFor="archive_after_days" className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Archive After Days (Optional)</label>
                        <InputNumber
                            id="archive_after_days"
                            value={publishFormData.archive_after_days}
                            onChange={(value) => handlePublishFormChange('archive_after_days', value || 0)}
                            min={0}
                            className="w-full [&_.ant-input-number-input]:!text-[var(--text-primary)] [&_.ant-input-number-input]:!bg-[var(--bg-secondary)] [&_.ant-input-number-input]:!placeholder-[var(--text-secondary)]"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                </div>
            </Modal>
        </>
    )
}
