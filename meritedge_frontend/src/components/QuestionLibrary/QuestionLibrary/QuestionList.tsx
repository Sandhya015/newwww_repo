/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs } from "antd";
import { useState, useEffect } from "react";

// Components
import OtomeytLibraryQuestion from "./OtomeytLibraryQuestion";
import MyLibraryQuestion from "./MyLibraryQuestion";
import FavouriteQuestion from "./FavouriteQuestion";



export default function QuestionList({ 
    myLibraryQuestions,
    isLoadingQuestions,
    hasMoreQuestions,
    loadMoreQuestions,
    questionTypes,
    otomeytLibraryQuestions,
    isLoadingOtomeytQuestions,
    hasMoreOtomeytQuestions,
    loadMoreOtomeytQuestions,
    assessmentId,
    sectionId,
    sectionData,
    onAssessmentRefresh,
    onRefreshLibrary,
    showOnlyMyLibrary = false,
    onTabChange,
    otomeytTotalCount = 0,
    onSectionSelect,
    favoriteQuestions = [],
    onToggleFavorite,
    isFavorite,
    onAddToSectionClick
}: {
    myLibraryQuestions: any[];
    isLoadingQuestions: boolean;
    hasMoreQuestions: boolean;
    loadMoreQuestions: () => void;
    questionTypes: any;
    otomeytLibraryQuestions: any[];
    isLoadingOtomeytQuestions: boolean;
    hasMoreOtomeytQuestions: boolean;
    loadMoreOtomeytQuestions: () => void;
    assessmentId?: string;
    sectionId?: string;
    sectionData?: {
        total_section: string;
        data: {
            sections: Array<{
                section_id: string;
                section_name: string;
                question_count: string;
                questions: any[];
                total_score: string;
                section_order: string;
                question_ids: string[];
            }>;
            [key: string]: any;
        };
    };
    onAssessmentRefresh?: () => void;
    onRefreshLibrary?: () => void;
    showOnlyMyLibrary?: boolean;
    onTabChange?: (activeKey: string) => void;
    otomeytTotalCount?: number;
    onSectionSelect?: (sectionId: string) => void;
    favoriteQuestions?: any[];
    onToggleFavorite?: (question: any) => void;
    isFavorite?: (question: any) => boolean;
    onAddToSectionClick?: () => void;
}) {
    const [selectedCount, setSelectedCount] = useState(0);

    // Define all tabs
    const allTabs = [
        {
            key: "1",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/otomeyt-ai-logo-2.svg`} className="w-5 h-5" />
                    <span>Otomeyt Library ({otomeytTotalCount})</span>
                </div>
            ),
            children: <OtomeytLibraryQuestion 
                otomeytLibraryData={otomeytLibraryQuestions || []} 
                questionTypes={questionTypes}
                isLoadingQuestions={isLoadingOtomeytQuestions}
                hasMoreQuestions={hasMoreOtomeytQuestions}
                loadMoreQuestions={loadMoreOtomeytQuestions}
                assessmentId={assessmentId}
                sectionId={sectionId}
                sectionData={sectionData}
                onAssessmentRefresh={onAssessmentRefresh}
                onSectionSelect={onSectionSelect}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                onSelectionChange={setSelectedCount}
            />,
        },
        {
            key: "2",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/book.svg`} className="w-5 h-5" style={{ filter: 'var(--icon-filter)' }} />
                    <span>My Library ({myLibraryQuestions?.length || 0})</span>
                </div>
            ),
            children: <MyLibraryQuestion 
                myLibraryData={myLibraryQuestions || []} 
                isLoadingQuestions={isLoadingQuestions}
                hasMoreQuestions={hasMoreQuestions}
                loadMoreQuestions={loadMoreQuestions}
                questionTypes={questionTypes}
                assessmentId={assessmentId}
                sectionId={sectionId}
                sectionData={sectionData}
                onAssessmentRefresh={onAssessmentRefresh}
                onRefreshLibrary={onRefreshLibrary}
                onSectionSelect={onSectionSelect}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                onSelectionChange={setSelectedCount}
            />,
        },
        {
            key: "3",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <img src={`${import.meta.env.BASE_URL}common/twinkling-stars.gif`} className="w-5 h-5" />
                    <span>Ai Library</span>
                </div>
            ),
            children: <span className="text-white">AI Library</span>,
            disabled: true,
        },
        {
            key: "4",
            label: (
                <div className="flex items-center gap-2 min-w-max">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>Favourite ({favoriteQuestions?.length || 0})</span>
                </div>
            ),
            children: <FavouriteQuestion 
                favoriteQuestions={favoriteQuestions || []}
                questionTypes={questionTypes}
                assessmentId={assessmentId}
                sectionId={sectionId}
                sectionData={sectionData}
                onAssessmentRefresh={onAssessmentRefresh}
                onSectionSelect={onSectionSelect}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
                onSelectionChange={setSelectedCount}
            />,
        },
    ];

    // Filter tabs based on showOnlyMyLibrary prop
    const tabsToShow = showOnlyMyLibrary 
        ? allTabs.filter(tab => tab.key === "2") // Only My Library tab
        : allTabs; // All tabs

    // Handle Add to Section click from sidebar - dispatch custom event
    useEffect(() => {
        const handleAddToSection = () => {
            // Dispatch custom event that question components can listen to
            window.dispatchEvent(new CustomEvent('openAddToSectionModal'));
        };
        // Store the handler so parent can call it
        (window as any).__triggerAddToSection = handleAddToSection;
        
        // Also expose the selected count for the sidebar and notify when it changes
        (window as any).__selectedQuestionsCount = selectedCount;
        window.dispatchEvent(new CustomEvent('selectionCountChanged'));
    }, [selectedCount]);

    return (
        <>
            <Tabs
                defaultActiveKey="1"
                items={tabsToShow}
                onChange={(activeKey) => {
                    console.log("📑 Tab changed to:", activeKey === "1" ? "Otomeyt Library" : "My Library");
                    if (onTabChange) {
                        onTabChange(activeKey);
                    }
                }}
                className={`
                    text-lg
                    [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                    [&_.ant-tabs-tab-btn]:!font-semibold
                    [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                    [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!font-bold
                    [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!opacity-100
                    [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                    [&_.ant-tabs-ink-bar]:h-1.5
                    [&_.ant-tabs-nav]:border-b-0
                    [&_.ant-tabs-content-holder]:border-0
                    [&_.ant-tabs-tabpane]:animate-[slideUpFadeIn_0.6s_ease-out_forwards]
                    [&_.ant-tabs-tab:first-child_.ant-tabs-tab-btn]:!relative
                `}
            />
        </>
    )
}
