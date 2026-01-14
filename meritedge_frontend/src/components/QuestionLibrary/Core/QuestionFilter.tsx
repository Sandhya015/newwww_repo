import { Col, Input, Row, Select, Button, Modal, Upload, Table, message } from 'antd'
import { SearchOutlined, UploadOutlined, DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { postAPI } from '../../../lib/api';
import { showToast } from '../../../utils/toast';

const QUESTION_TYPE_ALIAS_MAP: Record<string, string> = {
    "single choice": "single_choice",
    "single-choice": "single_choice",
    "mcq": "single_choice",
    "multiple choice": "multiple_choice",
    "multiple-choice": "multiple_choice",
    "multi select": "multiple_choice",
    "true false": "true_false",
    "true/false": "true_false",
    "fill in the blank": "fill_blank",
    "fill-in-the-blank": "fill_blank",
    "fill in blanks": "fill_blank",
    "subjective": "subjective",
    "essay": "subjective",
    "coding": "coding",
    "code": "coding",
    "audio": "audio_video",
    "video": "audio_video",
    "audio video": "audio_video",
};

type ConversionIssue = {
    row: number;
    message: string;
};

export default function QuestionFilter({ 
    createButton, 
    onFilterChange, 
    clearAllFilters,
    // Current filter values
    skill,
    domain,
    difficultyLevel,
    categoryId,
    questionTypeId,
    status,
    tags,
    concept,
    // Show bulk upload only in My Library
    showBulkUpload = true,
    // Question types for mapping
    questionTypes = null,
    // Refresh callback
    onUploadSuccess = null,
    // Add to Section button
    addToSectionButton = null,
    // Selected questions count
    selectedCount = 0,
    // Clear selection callback
    onClearSelection = null
}) {
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedComplexity, setSelectedComplexity] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState([]);
    const [selectedConcept, setSelectedConcept] = useState([]);
    
    // Bulk upload states
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [conversionSummary, setConversionSummary] = useState<{
        total: number;
        valid: number;
        issues: ConversionIssue[];
    } | null>(null);

    const questionTypesList = useMemo(() => {
        const nestedTypes = questionTypes?.items?.[0]?.attributes?.data?.question_types;
        if (Array.isArray(nestedTypes)) {
            return nestedTypes;
        }

        if (Array.isArray(questionTypes?.question_types)) {
            return questionTypes.question_types;
        }

        if (Array.isArray(questionTypes?.data)) {
            return questionTypes.data;
        }

        if (Array.isArray(questionTypes)) {
            return questionTypes;
        }

        return [];
    }, [questionTypes]);

    const categoriesList = useMemo(() => {
        const nestedCategories = questionTypes?.items?.[0]?.attributes?.data?.categories;
        if (Array.isArray(nestedCategories)) {
            return nestedCategories;
        }

        if (Array.isArray(questionTypes?.categories)) {
            return questionTypes.categories;
        }

        if (Array.isArray(questionTypes?.data?.categories)) {
            return questionTypes.data.categories;
        }

        return [];
    }, [questionTypes]);

    const normalizeValue = (value: unknown) =>
        typeof value === 'string'
            ? value.trim().toLowerCase()
            : String(value ?? '').trim().toLowerCase();

    const findQuestionType = (value: unknown) => {
        if (!value) return null;
        const raw = String(value).trim();
        if (!raw) return null;

        if (raw.startsWith('qt_')) {
            const directMatch = questionTypesList.find((qt: any) => qt.id === raw);
            if (directMatch) {
                return directMatch;
            }
        }

        const normalized = normalizeValue(raw);

        const directMatch = questionTypesList.find((qt: any) => {
            const candidates = [
                qt.id,
                qt.label,
                qt.name,
                qt.type_name,
                qt.code,
            ]
                .filter(Boolean)
                .map((candidate: string) => normalizeValue(candidate));

            return candidates.includes(normalized);
        });

        if (directMatch) {
            return directMatch;
        }

        const aliasTarget = QUESTION_TYPE_ALIAS_MAP[normalized];
        if (aliasTarget) {
            const aliasMatch = questionTypesList.find((qt: any) => {
                const candidateCode = normalizeValue(qt.code || qt.type_name || '');
                const candidateLabel = normalizeValue(qt.label || '');
                return candidateCode === aliasTarget || candidateLabel === aliasTarget.replace(/_/g, ' ');
            });

            if (aliasMatch) {
                return aliasMatch;
            }
        }

        return null;
    };

    const findCategory = (value: unknown) => {
        if (!value) return null;
        const raw = String(value).trim();
        if (!raw) return null;

        if (raw.startsWith('cat_')) {
            const directMatch = categoriesList.find((category: any) => category.id === raw);
            if (directMatch) {
                return directMatch;
            }
        }

        const normalized = normalizeValue(raw);

        return (
            categoriesList.find((category: any) => {
                const candidates = [category.label, category.name, category.code]
                    .filter(Boolean)
                    .map((candidate: string) => normalizeValue(candidate));
                return candidates.includes(normalized);
            }) || null
        );
    };

    // Download sample Excel template
    const downloadTemplate = () => {
        const templateData = [
            {
                'Question Type': 'Single Choice',
                'Question': 'If a shirt costs $6 and pants cost $8, what is the total?',
                'Concept': 'Aptitude',
                'Domain': 'Math',
                'Skill': 'Calculation',
                'Option 1': '$700',
                'Option 2': '$720',
                'Option 3': '$750',
                'Option 4': '$800',
                'Correct Answer': '$750',
                'Difficulty Level': 1
            },
            {
                'Question Type': 'Single Choice',
                'Question': 'What is the square root of 144?',
                'Concept': 'Aptitude',
                'Domain': 'Math',
                'Skill': 'Calculation',
                'Option 1': '10',
                'Option 2': '11',
                'Option 3': '12',
                'Option 4': '13',
                'Correct Answer': '12',
                'Difficulty Level': 1
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Questions');
        XLSX.writeFile(wb, 'question_upload_template.xlsx');
    };

    // Parse Excel file
    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                console.log('📄 Parsed Excel data:', json);
                if (json.length > 0) {
                    console.log('📋 Available columns:', Object.keys(json[0]));
                    console.log('📊 First row sample:', json[0]);
                }
                
                setParsedData(json);
                setUploadedFile(file);
                setConversionSummary(null);
                message.success(`Parsed ${json.length} questions from file`);
            } catch (error) {
                message.error('Failed to parse Excel file');
                console.error('❌ Parse error:', error);
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // Prevent auto upload
    };

    // Convert Excel data to API format
    const convertToAPIFormat = (excelData: any[]) => {
        console.log('📋 Converting Excel data to API format:', excelData);

        const issues: ConversionIssue[] = [];

        const converted = excelData.map((row: any, index: number) => {
            const rowNumber = index + 2; // Account for header row in Excel
            console.log(`\n🔄 Processing row ${rowNumber}:`, row);

            const questionTypeValue = row['Question Type'] ?? row['question_type'] ?? row['Type'];
            const questionType = findQuestionType(questionTypeValue);

            if (!questionType) {
                issues.push({
                    row: rowNumber,
                    message: `Unknown question type "${questionTypeValue ?? ''}". Ensure it matches an existing library type.`,
                });
                return null;
            }

            let categoryId = questionType.category_id;
            const categoryValue = row['Category'] ?? row['Category Id'] ?? row['category'];
            if (categoryValue) {
                const matchedCategory = findCategory(categoryValue);
                if (matchedCategory) {
                    categoryId = matchedCategory.id;
                } else if (String(categoryValue).startsWith('cat_')) {
                    categoryId = String(categoryValue);
                }
            }

            if (!categoryId) {
                issues.push({
                    row: rowNumber,
                    message: `Unable to resolve category for question type "${questionType.label || questionTypeValue}".`,
                });
                return null;
            }

            const questionText = row['Question'] ?? row['Question Text'] ?? row['question_text'];
            if (!questionText || !String(questionText).trim()) {
                issues.push({
                    row: rowNumber,
                    message: 'Question text is required.',
                });
                return null;
            }

            const conceptValue = row['Concept'] ?? row['concept'];
            const conceptList = Array.isArray(conceptValue)
                ? conceptValue.map((item) => String(item).trim()).filter(Boolean)
                : typeof conceptValue === 'string'
                    ? conceptValue
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : conceptValue
                        ? [String(conceptValue).trim()]
                        : [];

            const domainValue = row['Domain'] ?? row['domain'];
            const skillValue = row['Skill'] ?? row['skill'];

            const difficultyRaw = row['Difficulty Level'] ?? row['difficulty_level'];
            const parsedDifficulty = Number.isFinite(Number(difficultyRaw)) && Number(difficultyRaw) > 0
                ? Number(difficultyRaw)
                : 1;

            const maxScoreRaw = row['Max Score'] ?? row['max_score'];
            const parsedMaxScore = Number.isFinite(Number(maxScoreRaw)) && Number(maxScoreRaw) > 0
                ? Number(maxScoreRaw)
                : 1;

            const timeLimitRaw = row['Time Limit'] ?? row['time_limit'];
            const parsedTimeLimit = Number.isFinite(Number(timeLimitRaw)) && Number(timeLimitRaw) > 0
                ? Number(timeLimitRaw)
                : 60;

            const correctAnswerCell = row['Correct Answer'] ?? row['correct_answer'];
            const correctAnswers = Array.isArray(correctAnswerCell)
                ? correctAnswerCell.map((ans) => String(ans).trim()).filter(Boolean)
                : typeof correctAnswerCell === 'string'
                    ? correctAnswerCell
                        .split(/[,;]/)
                        .map((ans) => ans.trim())
                        .filter(Boolean)
                    : correctAnswerCell
                        ? [String(correctAnswerCell).trim()]
                        : [];

            const normalizedCorrectAnswers = new Set(
                correctAnswers.map((ans) => ans.toLowerCase())
            );

            const preferredOptionKeys = [
                'Option 1',
                'Option 2',
                'Option 3',
                'Option 4',
                'Option 5',
                'Option 6',
                // Backward compatibility with old format
                'Option 1.1',
                'Option 1.2',
                'Option 1.3'
            ];

            const optionsFromPreferred = preferredOptionKeys
                .filter((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '')
                .map((key) => ({ key, value: String(row[key]).trim() }));

            const dynamicOptionKeys = Object.keys(row).filter((columnKey) => /^(Option\s*\d+)/i.test(columnKey));

            const combinedOptionKeys = optionsFromPreferred.length > 0
                ? optionsFromPreferred.map((item) => item.key)
                : dynamicOptionKeys;

            const correctAnswerTexts: string[] = [];

            const options = combinedOptionKeys
                .map((key, idx) => {
                    const optionValue = row[key];
                    if (optionValue === undefined || optionValue === null) return null;
                    const optionText = String(optionValue).trim();
                    if (!optionText) return null;

                    const isCorrect = normalizedCorrectAnswers.has(optionText.toLowerCase());
                    if (isCorrect) {
                        correctAnswerTexts.push(optionText);
                    }

                    return {
                        text: optionText,
                        is_correct: isCorrect,
                        order: idx + 1,
                    };
                })
                .filter(Boolean);

            console.log('📝 Options:', options);

            if (correctAnswers.length > 0 && correctAnswerTexts.length === 0) {
                issues.push({
                    row: rowNumber,
                    message: 'Correct Answer does not match any option text. Please ensure the correct answer exactly matches one of the options.',
                });
            }

            const questionData = {
                question_type_id: questionType.id,
                category_id: categoryId,
                question_text: String(questionText),
                domain: domainValue ? String(domainValue) : '',
                skill: skillValue ? String(skillValue) : '',
                difficulty_level: parsedDifficulty,
                description: '',
                hints: [],
                options,
                correct_answers: correctAnswerTexts,
                languages: [],
                tags: [],
                concept: conceptList,
                question_assets: {},
                answer_format: 'text',
                expected_output: '',
                test_cases: [],
                max_score: parsedMaxScore,
                time_limit: parsedTimeLimit,
                shuffle_options: false,
                ai_evaluation_enabled: false,
                expected_keywords: [],
                translations: {},
                media_alternatives: {},
                reading_level: '',
                version: 1,
                parent_question_id: '',
                is_template: false,
                evaluation_criteria: [],
                scoring_guidelines: '',
                sample_answer: '',
                question_type_details: {},
                ai_insights: {},
                company_id: '',
                organization_id: '',
                library_scope: 'company'
            };

            console.log('📦 Converted question:', questionData);
            return questionData;
        });

        const filtered = converted.filter((question) => question !== null);
        console.log(`\n✅ Total converted: ${converted.length}, Valid: ${filtered.length}, Issues: ${issues.length}`);
        return { questions: filtered, issues };
    };

    // Upload questions to API
    const handleBulkUpload = async () => {
        console.log('🚀 handleBulkUpload called');
        console.log('📊 parsedData:', parsedData);
        
        if (parsedData.length === 0) {
            message.error('No data to upload');
            return;
        }

        setIsUploading(true);
        try {
            console.log('🔧 Converting to API format...');
            if (questionTypesList.length === 0) {
                message.error('Question type metadata is not available. Please refresh and try again.');
                setIsUploading(false);
                return;
            }

            const { questions: questionsData, issues } = convertToAPIFormat(parsedData);
            setConversionSummary({
                total: parsedData.length,
                valid: questionsData.length,
                issues,
            });

            console.log('✅ Converted data:', questionsData);
            console.log('📝 Number of valid questions:', questionsData.length);
            
            if (questionsData.length === 0) {
                message.error('No valid questions found in the file. Please check question types.');
                setIsUploading(false);
                return;
            }

            if (issues.length > 0) {
                const issuePreview = issues
                    .slice(0, 3)
                    .map((issue) => `Row ${issue.row}: ${issue.message}`)
                    .join(' | ');
                message.warning(`Skipped ${issues.length} row(s): ${issuePreview}${issues.length > 3 ? '...' : ''}`);
            }

            console.log('🌐 Calling API with data:', JSON.stringify(questionsData, null, 2));
            const response = await postAPI('/questions/create/bulk', questionsData);
            console.log('📥 API Response:', response);
            
            if (response.success) {
                showToast({
                    message: 'Questions Uploaded Successfully',
                    description: `${questionsData.length} question${questionsData.length === 1 ? '' : 's'} added to your library.${issues.length ? ` Skipped ${issues.length} row${issues.length === 1 ? '' : 's'}.` : ''}`,
                    type: 'success'
                });
                setIsBulkUploadModalOpen(false);
                setParsedData([]);
                setUploadedFile(null);
                setConversionSummary(null);
                
                // Call refresh callback if provided
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            } else {
                console.error('❌ API Error:', response);
                const apiDetail = Array.isArray(response.data?.detail)
                    ? response.data.detail.map((detail: any) => detail?.msg || JSON.stringify(detail)).join(', ')
                    : response.data?.message || response.data?.detail || 'Failed to upload questions';
                message.error(apiDetail);
            }
        } catch (error) {
            console.error('❌ Bulk upload error:', error);
            message.error('An error occurred while uploading questions');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="mt-4 space-y-3">
            {/* Top Row - Search and Action Buttons */}
            <Row align="middle" justify="space-between" gutter={[12, 0]} className="items-center">
                {/* Left side - Search input (50% width) */}
                <Col xs={24} md={12} lg={12} xl={12}>
                    <Input 
                        className="!h-10 !rounded-xl !w-full" 
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                        prefix={<SearchOutlined className="!pr-2" style={{ color: 'var(--text-primary)' }} />} 
                        placeholder="Search Questions..."
                    />
                </Col>

                {/* Right side - Action buttons */}
                <Col xs={24} md={12} lg={12} xl={12}>
                    <div className="flex justify-end">
                        <Row align="middle" gutter={[12, 0]} className="items-center">
                            {/* Bulk Upload Button - Only show in My Library (Question Library page) */}
                            {showBulkUpload && createButton && (
                                <Col>
                                    <Button
                                        icon={<UploadOutlined />}
                                        className="!h-10 !rounded-xl !font-medium !px-4"
                                        style={{
                                            backgroundColor: '#5B21B6',
                                            borderColor: '#5B21B6',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: "0px 4px 12px rgba(124, 58, 237, 0.3)"
                                        }}
                                        onClick={() => setIsBulkUploadModalOpen(true)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#4C1D95";
                                            e.currentTarget.style.borderColor = "#4C1D95";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "#5B21B6";
                                            e.currentTarget.style.borderColor = "#5B21B6";
                                        }}
                                    >
                                        Bulk Upload
                                    </Button>
                                </Col>
                            )}

                            {/* Create Custom Question Button - Only show if not in Question Add page */}
                            {createButton && (
                                <Col>
                                    {createButton}
                                </Col>
                            )}
                        </Row>
                    </div>
                </Col>
            </Row>

            {/* Bottom Row - Filters */}
            <Row align="middle" gutter={[8, 8]}>
                <Col>
                    <span style={{ fontFamily: "Helvetica_Neue-Regular, Helvetica", fontSize: "14px", lineHeight: "20px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        Filter by:
                    </span>
                </Col>

                    {/* Domain Filter */}
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Domain"
                            value={selectedDomain}
                            onChange={(value) => {
                                setSelectedDomain(value);
                                onFilterChange?.('domain', value?.join(','));
                            }}
                            className="!w-44"
                            style={{
                                borderRadius: "10px",
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            dropdownStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)'
                            }}
                            options={[
                                { label: "Frontend", value: "frontend" },
                                { label: "Backend", value: "backend" },
                                { label: "Full Stack", value: "fullstack" },
                                { label: "Mobile", value: "mobile" },
                                { label: "DevOps", value: "devops" },
                                { label: "Data Science", value: "data-science" },
                                { label: "AI/ML", value: "ai-ml" },
                                { label: "Cybersecurity", value: "cybersecurity" }
                            ]}
                        />
                    </Col>

                {/* Skills Filter */}
                <Col>
                        <Select
                            mode="multiple"
                            placeholder="Skills"
                            value={selectedSkills}
                            onChange={(value) => {
                                setSelectedSkills(value);
                                onFilterChange?.('skill', value?.join(','));
                            }}
                            className="!w-44"
                            style={{
                                borderRadius: "10px",
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            dropdownStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)'
                            }}
                            options={[
                                { label: "Astronomy", value: "astronomy" },
                                { label: "Basic Math", value: "basic-math" },
                                { label: "World Knowledge", value: "world-knowledge" },
                                { label: "Testing", value: "testing" },
                                { label: "Programming", value: "programming" },
                                { label: "Science", value: "science" },
                                { label: "Geography", value: "geography" },
                                { label: "History", value: "history" }
                            ]}
                        />
                    </Col>

                    {/* Concept Filter */}
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Concept"
                            value={selectedConcept}
                            onChange={(value) => {
                                setSelectedConcept(value);
                                onFilterChange?.('concept', value?.join(','));
                            }}
                            className="!w-44"
                            style={{
                                borderRadius: "10px",
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            dropdownStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)'
                            }}
                            options={[
                                { label: "Arrays", value: "arrays" },
                                { label: "Strings", value: "strings" },
                                { label: "Linked Lists", value: "linked-lists" },
                                { label: "Trees", value: "trees" },
                                { label: "Graphs", value: "graphs" },
                                { label: "Dynamic Programming", value: "dynamic-programming" },
                                { label: "Sorting", value: "sorting" },
                                { label: "Searching", value: "searching" },
                                { label: "Recursion", value: "recursion" },
                                { label: "Greedy Algorithms", value: "greedy" }
                            ]}
                        />
                    </Col>

                    {/* Complexity Filter (1-5) */}
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Complexity"
                            value={selectedComplexity}
                            onChange={(value) => {
                                setSelectedComplexity(value);
                                onFilterChange?.('difficultyLevel', value?.join(','));
                            }}
                            className="!w-44"
                            style={{
                                borderRadius: "10px",
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                            dropdownStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)'
                            }}
                            options={[
                                { label: "Level 1", value: 1 },
                                { label: "Level 2", value: 2 },
                                { label: "Level 3", value: 3 },
                                { label: "Level 4", value: 4 },
                                { label: "Level 5", value: 5 }
                            ]}
                        />
                    </Col>

                            {/* Add to Section Button and Clear Selection - Inline with filters */}
                            {addToSectionButton && (
                                <Col style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {addToSectionButton}
                                    {selectedCount > 0 && onClearSelection && (
                                        <Button
                                            type="text"
                                            size="small"
                                            onClick={() => {
                                                if (onClearSelection) {
                                                    onClearSelection();
                                                }
                                            }}
                                            style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '14px',
                                                whiteSpace: 'nowrap',
                                                padding: '0',
                                                height: 'auto'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                        >
                                            Clear Selection
                                        </Button>
                                    )}
                                </Col>
                            )}
            </Row>

            {/* Bulk Upload Modal */}
            <Modal
                title={
                    <div style={{ 
                        fontFamily: "Helvetica_Neue-Medium, Helvetica",
                        fontWeight: "500",
                        fontSize: "20px",
                        color: "var(--text-primary)"
                    }}>
                        Bulk Upload Questions
                    </div>
                }
                open={isBulkUploadModalOpen}
                onCancel={() => {
                    setIsBulkUploadModalOpen(false);
                    setParsedData([]);
                    setUploadedFile(null);
                    setConversionSummary(null);
                }}
                width={1200}
                footer={[
                    <Button
                        key="download"
                        icon={<DownloadOutlined />}
                        onClick={downloadTemplate}
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        Download Template
                    </Button>,
                    <Button
                        key="cancel"
                        onClick={() => {
                            setIsBulkUploadModalOpen(false);
                            setParsedData([]);
                            setUploadedFile(null);
                            setConversionSummary(null);
                        }}
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="upload"
                        type="primary"
                        loading={isUploading}
                        disabled={parsedData.length === 0}
                        onClick={handleBulkUpload}
                        style={{
                            backgroundColor: '#5B21B6',
                            borderColor: '#5B21B6'
                        }}
                    >
                        Upload {parsedData.length > 0 ? `(${parsedData.length} row${parsedData.length === 1 ? '' : 's'})` : ''}
                    </Button>
                ]}
                styles={{
                    content: {
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)"
                    },
                    header: {
                        backgroundColor: "var(--bg-primary)",
                        borderBottom: "1px solid var(--border-primary)"
                    },
                    body: {
                        backgroundColor: "var(--bg-primary)",
                        maxHeight: '70vh',
                        overflowY: 'auto'
                    }
                }}
            >
                <div className="space-y-4">
                    {/* Instructions */}
                    <div className="p-4 rounded-lg" style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                        border: '1px solid'
                    }}>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Instructions:</h4>
                        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                            <li>Download the template using the button below</li>
                            <li>Fill in the question details in the Excel file</li>
                            <li>Supported columns: Question Type, Question, Concept, Domain, Skill, Option 1, Option 2, Option 3, Option 4, Correct Answer, Difficulty Level (optional)</li>
                            <li>Question Type must match your library question types (e.g., Single Choice, Multiple Choice, Coding)</li>
                            <li>Use commas to separate multiple concepts or correct answers</li>
                            <li>Upload the completed file</li>
                        </ul>
                    </div>

                    {conversionSummary && (
                        <div className="p-4 rounded-lg" style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid',
                            borderColor: 'var(--border-primary)'
                        }}>
                            <div className="flex flex-col gap-1">
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                    Ready for upload: {conversionSummary.valid} of {conversionSummary.total} row{conversionSummary.total === 1 ? '' : 's'}
                                </span>
                                {conversionSummary.issues.length > 0 && (
                                    <div>
                                        <span style={{ color: '#F87171', fontWeight: 500 }}>
                                            Skipped rows:
                                        </span>
                                        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '16px', marginTop: '8px' }}>
                                            {conversionSummary.issues.slice(0, 5).map((issue) => (
                                                <li key={`${issue.row}-${issue.message}`}>
                                                    Row {issue.row}: {issue.message}
                                                </li>
                                            ))}
                                            {conversionSummary.issues.length > 5 && (
                                                <li>...and {conversionSummary.issues.length - 5} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    <Upload.Dragger
                        accept=".xlsx,.xls"
                        beforeUpload={handleFileUpload}
                        fileList={uploadedFile ? [uploadedFile as any] : []}
                        onRemove={() => {
                            setUploadedFile(null);
                            setParsedData([]);
                            setConversionSummary(null);
                        }}
                        maxCount={1}
                    >
                        <p className="ant-upload-drag-icon">
                            <FileExcelOutlined style={{ fontSize: '48px', color: '#5B21B6' }} />
                        </p>
                        <p className="ant-upload-text" style={{ color: 'var(--text-primary)' }}>
                            Click or drag Excel file to this area to upload
                        </p>
                        <p className="ant-upload-hint" style={{ color: 'var(--text-secondary)' }}>
                            Support for .xlsx and .xls files only
                        </p>
                    </Upload.Dragger>

                    {/* Preview Table */}
                    {parsedData.length > 0 && (
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                                Preview ({parsedData.length} questions) - Columns: {Object.keys(parsedData[0] || {}).join(', ')}
                            </h4>
                            <div style={{ 
                                maxHeight: '400px', 
                                overflowY: 'auto',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px'
                            }}>
                                <Table
                                    dataSource={parsedData}
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 1800 }}
                                    size="small"
                                    rowKey={(record, index) => index?.toString() || '0'}
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)'
                                    }}
                                >
                                    {/* Dynamically render all columns */}
                                    {parsedData.length > 0 && Object.keys(parsedData[0]).map((column) => {
                                        const isCorrectAnswer = column.toLowerCase().includes('correct');
                                        const isQuestionType = column.toLowerCase().includes('type');
                                        const isQuestion = column.toLowerCase() === 'question';
                                        
                                        return (
                                            <Table.Column 
                                                key={column}
                                                title={column}
                                                dataIndex={column}
                                                width={isQuestion ? 250 : 120}
                                                fixed={isQuestionType ? 'left' : (isCorrectAnswer ? 'right' : undefined)}
                                                ellipsis={!isCorrectAnswer}
                                                render={(text) => {
                                                    if (isCorrectAnswer) {
                                                        return (
                                                            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                                                {text}
                                                            </span>
                                                        );
                                                    }
                                                    return text;
                                                }}
                                            />
                                        );
                                    })}
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}
