/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, Spin, Empty, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

// Components
import OtomeytLibraryQuestion from "./OtomeytLibraryQuestion";
import QuestionLibraryDedicatedMyLibraryQuestion from "./QuestionLibraryDedicatedMyLibraryQuestion";
import FavouriteQuestion from "./FavouriteQuestion";
import QuestionFilter from "../Core/QuestionFilter";
import QuestionCreationModal from "../QuestionAdd/QuestionCreationModal";

// API
import { getScopedQuestions } from "../../../lib/api";

interface QuestionLibraryDedicatedQuestionListProps {
    // My Library (Company) questions
    myLibraryQuestions: any[];
    isLoadingQuestions: boolean;
    hasMoreQuestions: boolean;
    loadMoreQuestions: () => void;
    
    // Otomeyt Library questions
    otomeytLibraryQuestions: any[];
    isLoadingOtomeytQuestions: boolean;
    hasMoreOtomeytQuestions: boolean;
    loadMoreOtomeytQuestions: () => void;
    
    // Common props
    questionTypes: any;
    showOnlyMyLibrary?: boolean;
    assessmentId?: string;
    sectionId?: string;
    
    // Refresh function
    onRefresh?: () => void;
    
    // Filter props
    onFilterChange?: (filterType: string, value: string | undefined) => void;
    clearAllFilters?: () => void;
    skill?: string;
    domain?: string;
    difficultyLevel?: string;
    categoryId?: string;
    questionTypeId?: string;
    status?: string;
    tags?: string;
    concept?: string;
    // Favorite props
    favoriteQuestions?: any[];
    onToggleFavorite?: (question: any) => void;
    isFavorite?: (question: any) => boolean;
    // Add to Section props
    selectedQuestionsCount?: number;
    onAddToSection?: () => void;
}

export default function QuestionLibraryDedicatedQuestionList({ 
    myLibraryQuestions,
    isLoadingQuestions,
    hasMoreQuestions,
    loadMoreQuestions,
    otomeytLibraryQuestions,
    isLoadingOtomeytQuestions,
    hasMoreOtomeytQuestions,
    loadMoreOtomeytQuestions,
    questionTypes,
    showOnlyMyLibrary = false,
    assessmentId,
    sectionId,
    onRefresh,
    // Filter props
    onFilterChange,
    clearAllFilters,
    skill,
    domain,
    difficultyLevel,
    categoryId,
    questionTypeId,
    status,
    tags,
    concept,
    // Favorite props
    favoriteQuestions = [],
    onToggleFavorite,
    isFavorite,
    // Add to Section props
    selectedQuestionsCount = 0,
    onAddToSection
}: QuestionLibraryDedicatedQuestionListProps) {

    // Function to refresh questions from scoped API
    const refreshQuestions = async () => {
        try {
            const result = await getScopedQuestions('company', 20);
            if (result && result.data) {
                // Call the onRefresh callback if provided
                if (onRefresh) {
                    onRefresh();
                }
            }
        } catch (error) {
            console.error('Error refreshing questions:', error);
        }
    };

    // State for question creation modal
    const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
    
    // Track selected questions count from child components
    const [selectedCount, setSelectedCount] = useState(0);
    
    // Debug: Log when selectedCount changes
    useEffect(() => {
        console.log('🔢 Selected count updated:', selectedCount);
    }, [selectedCount]);

    // Define all tabs
    const allTabs = [
        {
            key: "1",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/otomeyt-ai-logo-2.svg`} className="w-5 h-5" />
                    <span>Otomeyt Library ({otomeytLibraryQuestions?.length || 0})</span>
                </div>
            ),
            children: (
                <div className="min-h-[400px]">
                    {isLoadingOtomeytQuestions && otomeytLibraryQuestions.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <Spin size="large" />
                        </div>
                    ) : otomeytLibraryQuestions.length === 0 ? (
                        <Empty 
                            description="No questions found"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            {onRefresh && (
                                <Button 
                                    type="primary" 
                                    icon={<ReloadOutlined />} 
                                    onClick={onRefresh}
                                >
                                    Refresh
                                </Button>
                            )}
                        </Empty>
                    ) : (
                        <OtomeytLibraryQuestion 
                            otomeytLibraryData={otomeytLibraryQuestions || []} 
                            questionTypes={questionTypes}
                            isLoadingQuestions={isLoadingOtomeytQuestions}
                            hasMoreQuestions={hasMoreOtomeytQuestions}
                            loadMoreQuestions={loadMoreOtomeytQuestions}
                            onToggleFavorite={onToggleFavorite}
                            isFavorite={isFavorite}
                            onSelectionChange={setSelectedCount}
                        />
                    )}
                </div>
            ),
        },
        {
            key: "2",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/book.svg`} className="w-5 h-5" style={{ filter: 'var(--icon-filter)' }} />
                    <span>My Library ({myLibraryQuestions?.length || 0})</span>
                </div>
            ),
            children: (
                <div className="min-h-[400px]">
                    {isLoadingQuestions && myLibraryQuestions.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <Spin size="large" />
                        </div>
                    ) : myLibraryQuestions.length === 0 ? (
                        <Empty 
                            description="No questions found"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            {onRefresh && (
                                <Button 
                                    type="primary" 
                                    icon={<ReloadOutlined />} 
                                    onClick={onRefresh}
                                >
                                    Refresh
                                </Button>
                            )}
                        </Empty>
                    ) : (
                        <QuestionLibraryDedicatedMyLibraryQuestion 
                            myLibraryData={myLibraryQuestions || []} 
                            isLoadingQuestions={isLoadingQuestions}
                            hasMoreQuestions={hasMoreQuestions}
                            loadMoreQuestions={loadMoreQuestions}
                            questionTypes={questionTypes}
                            onToggleFavorite={onToggleFavorite}
                            isFavorite={isFavorite}
                            onSelectionChange={setSelectedCount}
                        />
                    )}
                </div>
            ),
        },
        {
            key: "3",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>Favourite ({favoriteQuestions?.length || 0})</span>
                </div>
            ),
            children: (
                <div className="min-h-[400px]">
                    {favoriteQuestions.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <Empty 
                                description={
                                    <span style={{ color: "var(--text-secondary)" }}>
                                        No favorite questions yet. Click the heart icon on any question to add it to favorites.
                                    </span>
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </div>
                    ) : (
                        <FavouriteQuestion 
                            favoriteQuestions={favoriteQuestions || []}
                            questionTypes={questionTypes}
                            onToggleFavorite={onToggleFavorite}
                            isFavorite={isFavorite}
                        />
                    )}
                </div>
            ),
        },
        {
            key: "4",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/twinkling-stars.gif`} className="w-5 h-5" />
                    <span>Ai Library</span>
                </div>
            ),
            children: (
                <div className="flex justify-center items-center h-64">
                    <Empty 
                        description="AI Library coming soon"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </div>
            ),
            disabled: true,
        },
    ];

    // Filter tabs based on showOnlyMyLibrary prop
    const tabsToShow = showOnlyMyLibrary 
        ? allTabs.filter(tab => tab.key === "2" || tab.key === "3") // My Library and Favourite tabs
        : allTabs; // All tabs

    // Create Custom Question Button
    const createCustomQuestionButton = (
        <Button
            type="primary"
            className="!font-medium !px-4 !h-10 !rounded-xl"
            style={{
                fontFamily: "Helvetica_Neue-Medium, Helvetica",
                fontWeight: "500",
                fontSize: "14px",
                backgroundColor: "#5B21B6",
                borderColor: "#5B21B6",
                color: "#ffffff",
                display: 'flex',
                alignItems: 'center',
                boxShadow: "0px 4px 12px rgba(124, 58, 237, 0.3)"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4C1D95";
                e.currentTarget.style.borderColor = "#4C1D95";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#5B21B6";
                e.currentTarget.style.borderColor = "#5B21B6";
            }}
            onClick={() => {
                setIsQuestionModalVisible(true);
            }}
        >
            Create Custom Question
        </Button>
    );

    // Add to Section Button - REMOVED (not needed in Question Library page)

    return (
        <div className="w-full" style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '100%' }}>
            {/* Question Filter Component */}
            <QuestionFilter 
                createButton={createCustomQuestionButton}
                onFilterChange={onFilterChange}
                clearAllFilters={clearAllFilters}
                skill={skill}
                domain={domain}
                difficultyLevel={difficultyLevel}
                categoryId={categoryId}
                questionTypeId={questionTypeId}
                status={status}
                tags={tags}
                concept={concept}
                questionTypes={questionTypes}
                onUploadSuccess={onRefresh}
                showBulkUpload={showOnlyMyLibrary}
            />

            <Tabs
                defaultActiveKey={showOnlyMyLibrary ? "2" : "1"}
                items={tabsToShow}
                className={`
                    text-lg
                    [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                    [&_.ant-tabs-tab-btn]:!font-semibold
                    [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                    [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold
                    [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                    [&_.ant-tabs-ink-bar]:h-1.5
                    [&_.ant-tabs-nav]:border-b-0
                    [&_.ant-tabs-content-holder]:border-0
                    [&_.ant-tabs-tabpane]:animate-[slideUpFadeIn_0.6s_ease-out_forwards]
                `}
                style={{ backgroundColor: 'var(--bg-secondary)' }}
            />

            {/* Question Creation Modal */}
            <QuestionCreationModal
                visible={isQuestionModalVisible}
                onCancel={() => setIsQuestionModalVisible(false)}
                onSuccess={async () => {
                    // Call the scoped API to refresh questions
                    await refreshQuestions();
                    
                    // Close the modal
                    setIsQuestionModalVisible(false);
                }}
                questionTypes={questionTypes}
                assessmentId={assessmentId || ''}
                sectionId={sectionId || ''}
                onRefreshLibrary={refreshQuestions}
            />
        </div>
    );
}
