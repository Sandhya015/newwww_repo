/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";

// Components
import QuestionLibraryDedicatedQuestionList from "./QuestionLibraryDedicatedQuestionList";

// API
import { getScopedQuestions } from "../../../lib/api";

// Toast
import { showToast } from "../../../utils/toast";

interface QuestionLibraryDedicatedListProps {
    questionTypes: any;
    assessmentId?: string;
    sectionId?: string;
    // Filter parameters - pass these to filter questions dynamically
    skill?: string;           // Filter by skill (e.g., 'JavaScript', 'Python')
    domain?: string;          // Filter by domain (e.g., 'Frontend', 'Backend')
    difficultyLevel?: string; // Filter by difficulty (e.g., 'Easy', 'Medium', 'Hard')
    categoryId?: string;      // Filter by category ID
    questionTypeId?: string;  // Filter by question type ID
    status?: string;          // Filter by status (e.g., 'Active', 'Draft')
    tags?: string;           // Filter by tags (comma-separated)
    concept?: string;        // Filter by concept
    // Filter handlers
    onFilterChange?: (filterType: string, value: string | undefined) => void;
    clearAllFilters?: () => void;
    // Favorite props
    favoriteQuestions?: any[];
    onToggleFavorite?: (question: any) => void;
    isFavorite?: (question: any) => boolean;
}

export default function QuestionLibraryDedicatedList({ 
    questionTypes,
    assessmentId,
    sectionId,
    skill,
    domain,
    difficultyLevel,
    categoryId,
    questionTypeId,
    status,
    tags,
    concept,
    onFilterChange,
    clearAllFilters,
    favoriteQuestions = [],
    onToggleFavorite,
    isFavorite
}: QuestionLibraryDedicatedListProps) {
    
    // State for company questions
    const [companyQuestions, setCompanyQuestions] = useState<any[]>([]);
    const [isLoadingCompanyQuestions, setIsLoadingCompanyQuestions] = useState(false);
    const [companyLastEvaluatedKey, setCompanyLastEvaluatedKey] = useState<Record<string, unknown> | null>(null);
    const [hasMoreCompanyQuestions, setHasMoreCompanyQuestions] = useState(true);

    // State for Otomeyt questions (not used since showOnlyMyLibrary=true)
    const [otomeytQuestions, setOtomeytQuestions] = useState<any[]>([]);
    const [isLoadingOtomeytQuestions, setIsLoadingOtomeytQuestions] = useState(false);
    const [otomeytLastEvaluatedKey, setOtomeytLastEvaluatedKey] = useState<Record<string, unknown> | null>(null);
    const [hasMoreOtomeytQuestions, setHasMoreOtomeytQuestions] = useState(true);

    // Function to fetch company questions with filters
    const fetchCompanyQuestions = async (isLoadMore = false) => {
        if (isLoadingCompanyQuestions) return;
        
        console.log("🔍 Fetching company questions with filters:", {
            questionTypeId,
            skill,
            domain,
            difficultyLevel,
            categoryId,
            status,
            tags,
            concept
        });
        
        setIsLoadingCompanyQuestions(true);
        try {
            // ALWAYS fetch all questions and filter on frontend for reliability
            // Backend filtering might not work consistently
            const hasFilter = !!questionTypeId;
            
            const response = await getScopedQuestions(
                'company', 
                1000,  // Fetch all questions to filter on frontend
                undefined,  // Don't use pagination when filtering
                skill,
                domain,
                difficultyLevel,
                categoryId,
                undefined,  // Don't send questionTypeId to API - we'll filter on frontend
                status,
                tags,
                concept
            );
            
            console.log("✅ Company questions response:", response);
            
            if (response && response.data) {
                console.log("📦 Total questions received from API:", response.data.length);
                console.log("📦 Sample of first 3 questions:", response.data.slice(0, 3).map((q: any) => ({
                    type_id: q.question_type_id,
                    type: q.question_type,
                    text: q.question_text?.substring(0, 40)
                })));
                
                let filteredData = response.data;
                
                // ALWAYS filter on frontend if questionTypeId is present
                if (questionTypeId) {
                    const typeIds = questionTypeId.includes(',') 
                        ? questionTypeId.split(',') 
                        : [questionTypeId];
                    
                    console.log("🔧 Frontend filtering for type(s):", typeIds);
                    
                    // Log all question type IDs before filtering
                    const allTypeIds = response.data.map((q: any) => q.question_type_id);
                    const uniqueTypeIds = [...new Set(allTypeIds)] as string[];
                    console.log("📋 All unique question type IDs in response:", uniqueTypeIds);
                    console.log("📋 Looking for these IDs:", typeIds);
                    console.log("📋 Do any match?", uniqueTypeIds.some((id: string) => typeIds.includes(id)));
                    
                    filteredData = response.data.filter((q: any) => {
                        const matches = typeIds.includes(q.question_type_id);
                        if (matches && filteredData.length < 5) {
                            console.log("✓ Match found:", q.question_type_id, q.question_text?.substring(0, 50));
                        }
                        return matches;
                    });
                    
                    console.log("✅ Filtered to", filteredData.length, "questions");
                    
                    if (filteredData.length === 0 && response.data.length > 0) {
                        console.error("⚠️ NO MATCHES FOUND! This means the question_type_id doesn't match.");
                        console.error("⚠️ Expected one of:", typeIds);
                        console.error("⚠️ But got:", uniqueTypeIds);
                    }
                }
                
                console.log("✅ Final filtered questions count:", filteredData.length);
                
                // Sort questions by created_at descending (newest first)
                const sortedData = [...filteredData].sort((a, b) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA; // Descending order (newest first)
                });
                
                console.log("✅ Setting company questions to:", sortedData.length, "items (sorted by newest first)");
                
                if (isLoadMore) {
                    setCompanyQuestions(prev => [...prev, ...sortedData]);
                } else {
                    setCompanyQuestions(sortedData);
                }
                
                // Update pagination info
                if (response.last_evaluated_key && typeof response.last_evaluated_key === 'object') {
                    setCompanyLastEvaluatedKey(response.last_evaluated_key || null);
                } else {
                    setCompanyLastEvaluatedKey(response.last_evaluated_key || null);
                }
                setHasMoreCompanyQuestions(!!response.last_evaluated_key);
            }
        } catch (error) {
            console.error('Failed to fetch company questions:', error);
            showToast({
                message: "Error",
                description: "Failed to fetch company questions",
                position: 'top-right',
                duration: 3000
            });
        } finally {
            setIsLoadingCompanyQuestions(false);
        }
    };

    // Function to fetch Otomeyt questions with filters
    const fetchOtomeytQuestions = async (isLoadMore = false) => {
        if (isLoadingOtomeytQuestions) return;
        
        console.log("🔍 Fetching otomeyt questions with filters:", {
            questionTypeId,
            skill,
            domain,
            difficultyLevel,
            categoryId,
            status,
            tags,
            concept
        });
        
        setIsLoadingOtomeytQuestions(true);
        try {
            // For combo selections (multiple question types), fetch without type filter
            // and filter on frontend to get all matching questions
            const hasMultipleTypes = questionTypeId && questionTypeId.includes(',');
            const apiQuestionTypeId = hasMultipleTypes ? undefined : questionTypeId;
            
            const response = await getScopedQuestions(
                'otomeyt', 
                hasMultipleTypes ? 1000 : 20,  // Fetch more for combo filtering
                isLoadMore && !hasMultipleTypes ? otomeytLastEvaluatedKey : undefined,
                skill,
                domain,
                difficultyLevel,
                categoryId,
                apiQuestionTypeId,  // Don't send to API for combo
                status,
                tags,
                concept
            );
            
            console.log("✅ Otomeyt questions response:", response);
            
            if (response && response.data) {
                let filteredData = response.data;
                
                // If multiple question types selected, filter on frontend
                // Backend might not support comma-separated IDs
                if (questionTypeId && questionTypeId.includes(',')) {
                    const typeIds = questionTypeId.split(',');
                    console.log("🔧 Frontend filtering for multiple types:", typeIds);
                    filteredData = response.data.filter((q: any) => 
                        typeIds.includes(q.question_type_id)
                    );
                    console.log("✅ Filtered to", filteredData.length, "questions");
                }
                
                // Sort questions by created_at descending (newest first)
                const sortedData = [...filteredData].sort((a, b) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA; // Descending order (newest first)
                });
                
                if (isLoadMore) {
                    setOtomeytQuestions(prev => [...prev, ...sortedData]);
                } else {
                    setOtomeytQuestions(sortedData);
                }
                
                // Update pagination info
                if (response.last_evaluated_key && typeof response.last_evaluated_key === 'object') {
                    setOtomeytLastEvaluatedKey(response.last_evaluated_key || null);
                } else {
                    setOtomeytLastEvaluatedKey(response.last_evaluated_key || null);
                }
                setHasMoreOtomeytQuestions(!!response.last_evaluated_key);
            }
        } catch (error) {
            console.error('Failed to fetch Otomeyt questions:', error);
            showToast({
                message: "Error",
                description: "Failed to fetch Otomeyt questions",
                position: 'top-right',
                duration: 3000
            });
        } finally {
            setIsLoadingOtomeytQuestions(false);
        }
    };

    // Load more company questions
    const loadMoreCompanyQuestions = () => {
        if (hasMoreCompanyQuestions && !isLoadingCompanyQuestions) {
            fetchCompanyQuestions(true);
        }
    };

    // Load more Otomeyt questions
    const loadMoreOtomeytQuestions = () => {
        if (hasMoreOtomeytQuestions && !isLoadingOtomeytQuestions) {
            fetchOtomeytQuestions(true);
        }
    };

    // Refresh questions
    const refreshQuestions = () => {
        setCompanyQuestions([]);
        setCompanyLastEvaluatedKey(null);
        setHasMoreCompanyQuestions(true);
        fetchCompanyQuestions();
    };

    // Fetch questions when component mounts or filters change
    useEffect(() => {
        // Reset states when filters change
        setCompanyQuestions([]);
        setCompanyLastEvaluatedKey(null);
        setHasMoreCompanyQuestions(true);
        
        setOtomeytQuestions([]);
        setOtomeytLastEvaluatedKey(null);
        setHasMoreOtomeytQuestions(true);
        
        // Fetch both company and otomeyt questions with filters
        fetchCompanyQuestions();
        fetchOtomeytQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skill, domain, difficultyLevel, categoryId, questionTypeId, status, tags, concept]);



    return (
        <QuestionLibraryDedicatedQuestionList 
            myLibraryQuestions={companyQuestions}
            isLoadingQuestions={isLoadingCompanyQuestions}
            hasMoreQuestions={hasMoreCompanyQuestions}
            loadMoreQuestions={loadMoreCompanyQuestions}
            otomeytLibraryQuestions={otomeytQuestions}
            isLoadingOtomeytQuestions={isLoadingOtomeytQuestions}
            hasMoreOtomeytQuestions={hasMoreOtomeytQuestions}
            loadMoreOtomeytQuestions={loadMoreOtomeytQuestions}
            questionTypes={questionTypes}
            showOnlyMyLibrary={true}
            assessmentId={assessmentId}
            sectionId={sectionId}
            onRefresh={refreshQuestions}
            // Filter props
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
            // Favorite props
            favoriteQuestions={favoriteQuestions}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
        />
    );
}
