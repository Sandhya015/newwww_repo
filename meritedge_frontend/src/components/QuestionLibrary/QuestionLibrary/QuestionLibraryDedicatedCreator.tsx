import { useState, useEffect } from "react";

// Components
import QuestionCreator from "../QuestionAdd/QuestionCreator";

// API
import { getQuestionTypes } from "../../../lib/api";

// Toast
import { showToast } from "../../../utils/toast";

interface QuestionLibraryDedicatedCreatorProps {
    onQuestionCreated?: () => void;
}

export default function QuestionLibraryDedicatedCreator({ 
    onQuestionCreated 
}: QuestionLibraryDedicatedCreatorProps) {
    
    // State for question types
    const [questionTypes, setQuestionTypes] = useState<any>(null);
    const [questionTypesLoading, setQuestionTypesLoading] = useState(false);

    // Fetch question types on component mount
    useEffect(() => {
        getQuestionTypesData();
    }, []);

    // Function to fetch question types
    const getQuestionTypesData = async () => {
        setQuestionTypesLoading(true);
        try {
            const response = await getQuestionTypes();
            if (response.success) {
                setQuestionTypes(response.data || []);
            } else {
                showToast({
                    message: "Error",
                    description: "Failed to fetch question types",
                    position: 'top-right',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Failed to fetch question types:', error);
            showToast({
                message: "Error",
                description: "Failed to fetch question types",
                position: 'top-right',
                duration: 3000
            });
        } finally {
            setQuestionTypesLoading(false);
        }
    };

    // Handle question created callback
    const handleQuestionCreated = () => {
        // Call the parent callback
        if (onQuestionCreated) {
            onQuestionCreated();
        }
    };

    return (
        <QuestionCreator 
            questionTypes={questionTypes}
            onQuestionCreated={handleQuestionCreated}
        />
    );
}
