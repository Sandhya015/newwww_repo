import { useSelector } from "react-redux";
import { selectCurrentAssessment } from "../../../store/miscSlice";

// Components
import QuestionLibrarySideBar from "./QuestionLibrarySideBar";

interface QuestionLibraryDedicatedSideBarProps {
    selectedQuestionId: string[];
    handleSelectionSummaryOk: (index: number) => void;
    openQuestionLibrary: () => void;
    isQuestionLibraryOpen: boolean;
    selectedQuestions: Array<{id: string, category_id: string}>;
    handleQuestionSelectionChange: (checkedKeys: string[]) => void;
    handleSelectAllQuestions: () => void;
    handleClearAllQuestions: () => void;
    handleSelectCategoryQuestions: (categoryId: string, select: boolean) => void;
    // Question types props
    questionTypes: any;
    questionTypesLoading: boolean;
    // Filter props
    selectedCategories?: string[];
    selectedQuestionTypes?: string[];
    onCategorySelection?: (categoryIds: string[]) => void;
    onQuestionTypeSelection?: (questionTypeIds: string[]) => void;
    // Question counts
    questionCounts?: Record<string, number>;
}

export default function QuestionLibraryDedicatedSideBar({
    selectedQuestionId,
    handleSelectionSummaryOk,
    openQuestionLibrary,
    isQuestionLibraryOpen,
    selectedQuestions,
    handleQuestionSelectionChange,
    handleSelectAllQuestions,
    handleClearAllQuestions,
    handleSelectCategoryQuestions,
    // Question types props
    questionTypes,
    questionTypesLoading,
    // Filter props
    selectedCategories,
    selectedQuestionTypes,
    onCategorySelection,
    onQuestionTypeSelection,
    // Question counts
    questionCounts
}: QuestionLibraryDedicatedSideBarProps) {
    
    // Get current assessment data from store
    const currentAssessment = useSelector(selectCurrentAssessment);

    return (
        <QuestionLibrarySideBar
            selectedQuestionId={selectedQuestionId}
            handleSelectionSummaryOk={handleSelectionSummaryOk}
            openQuestionLibrary={openQuestionLibrary}
            isQuestionLibraryOpen={isQuestionLibraryOpen}
            questionTypes={questionTypes}
            questionTypesLoading={questionTypesLoading}
            selectedQuestions={selectedQuestions}
            handleQuestionSelectionChange={handleQuestionSelectionChange}
            handleSelectAllQuestions={handleSelectAllQuestions}
            handleClearAllQuestions={handleClearAllQuestions}
            handleSelectCategoryQuestions={handleSelectCategoryQuestions}
            // Filter props
            selectedCategories={selectedCategories}
            selectedQuestionTypes={selectedQuestionTypes}
            onCategorySelection={onCategorySelection}
            onQuestionTypeSelection={onQuestionTypeSelection}
            // Question counts
            questionCounts={questionCounts}
        />
    );
}
