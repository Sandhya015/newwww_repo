/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Space,
  InputNumber,
  Switch,
  message,
  Checkbox,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { createQuestions, createQuestion } from "../../../lib/api";
import { showToast } from "../../../utils/toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const { TextArea } = Input;
const { Option } = Select;

interface QuestionCreationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  questionTypes: any;
  assessmentId: string;
  sectionId: string;
  onRefreshLibrary?: () => void;
}

interface QuestionFormData {
  question_type_id: string;
  category_id: string;
  question_text: string;
  domain: string;
  skill: string;
  difficulty_level: number;
  description: string;
  hints: string[];
  options: Array<{
    text: string;
    is_correct: boolean;
  }>;
  correct_answers: string[];
  languages: string[];
  tags: string[];
  concept: string[];
  answer_format: string;
  expected_output: string;
  test_cases: Array<{
    input: string;
    expected_output: string;
  }>;
  max_score: number;
  time_limit: number;
  shuffle_options: boolean;
  ai_evaluation_enabled: boolean;
  expected_keywords: string[];
  reading_level: string;
  version: number;
  is_template: boolean;
  evaluation_criteria: string[];
  scoring_guidelines: string;
  sample_answer: string;
  company_id: string;
  organization_id: string;
  library_scope: string;
}

const QuestionCreationModal: React.FC<QuestionCreationModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  questionTypes,
  assessmentId,
  sectionId,
  onRefreshLibrary,
}) => {
  const [form] = Form.useForm();
  const [selectedQuestionType, setSelectedQuestionType] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Enhanced TipTap Editor Extensions
  const editorExtensions = [
    StarterKit.configure({
      heading: false, // Disable default heading to use custom configuration
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-purple-500 underline',
      },
    }),
    Image.configure({
      inline: true,
      HTMLAttributes: {
        class: 'max-w-full h-auto',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
  ];

  // TipTap Editor for Sample Answer
  const sampleAnswerEditor = useEditor({
    extensions: editorExtensions,
    content: "",
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      form.setFieldValue("sample_answer", htmlContent);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] prose prose-invert max-w-none focus:outline-none p-4",
        style: "min-height: 300px; padding: 12px; color: var(--text-primary);",
      },
    },
  });

  // TipTap Editor for Question Text
  const questionTextEditor = useEditor({
    extensions: editorExtensions,
    content: "",
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      form.setFieldValue("question_text", htmlContent);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] prose prose-invert max-w-none focus:outline-none p-4",
        style: "min-height: 300px; padding: 12px; color: var(--text-primary);",
      },
    },
  });

  // Toolbar Component with MS Word-like features
  const EditorToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addImage = () => {
      // Upload from file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            message.error('Image size should be less than 5MB');
            return;
          }
          
          // Convert image to base64
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Image = event.target?.result as string;
            // Insert image with base64 data URL
            editor.chain().focus().setImage({ src: base64Image }).run();
            message.success('Image inserted successfully');
          };
          reader.onerror = () => {
            message.error('Failed to read image file');
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    };

    const addImageFromURL = () => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        try {
          editor.chain().focus().setImage({ src: url }).run();
          message.success('Image inserted successfully');
        } catch (error) {
          message.error('Failed to insert image');
        }
      }
    };

    const setLink = () => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    const insertTable = () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const deleteTable = () => {
      editor.chain().focus().deleteTable().run();
    };

    return (
      <div
        className="flex flex-wrap gap-1 p-2 border-b rounded-t-lg"
        style={{
          borderColor: "var(--border-primary)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        {/* Undo/Redo */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          disabled={!editor.can().undo()}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#7C3AED] disabled:!opacity-30"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          disabled={!editor.can().redo()}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#7C3AED] disabled:!opacity-30"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Headings */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("heading", { level: 1 })
              ? "!bg-[#7C3AED] !text-white"
              : ""
          }`}
          title="Heading 1"
        >
          H1
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("heading", { level: 2 })
              ? "!bg-[#7C3AED] !text-white"
              : ""
          }`}
          title="Heading 2"
        >
          H2
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("heading", { level: 3 })
              ? "!bg-[#7C3AED] !text-white"
              : ""
          }`}
          title="Heading 3"
        >
          H3
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Text Formatting */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("bold") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("italic") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("underline") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("strike") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Text Color */}
        <input
          type="color"
          onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-8 h-6 cursor-pointer rounded border"
          style={{ borderColor: "var(--border-primary)" }}
          title="Text Color"
        />
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Highlight */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHighlight({ color: '#ffd700' }).run();
          }}
          style={{ 
            color: "var(--text-primary)",
            backgroundColor: editor.isActive('highlight') ? '#ffd700' : 'transparent'
          }}
          className={`hover:!text-[#7C3AED]`}
          title="Highlight"
        >
          🖍
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Lists */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("bulletList") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Bullet List"
        >
          • List
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("orderedList") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Numbered List"
        >
          1. List
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Text Alignment */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('left').run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive({ textAlign: 'left' }) ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Align Left"
        >
          ⇤
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('center').run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive({ textAlign: 'center' }) ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Align Center"
        >
          ≡
        </Button>
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('right').run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive({ textAlign: 'right' }) ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Align Right"
        >
          ⇥
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Link */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            setLink();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive('link') ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Insert Link"
        >
          🔗
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Image Upload */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            addImage();
          }}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#7C3AED]"
          title="Upload Image from Computer"
        >
          🖼️
        </Button>
        {/* Image from URL */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            addImageFromURL();
          }}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#7C3AED]"
          title="Insert Image from URL"
        >
          🌐
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Table */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            insertTable();
          }}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#7C3AED]"
          title="Insert Table"
        >
          📊
        </Button>
        {/* Delete Table */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            deleteTable();
          }}
          disabled={!editor.can().deleteTable()}
          style={{ color: "var(--text-primary)" }}
          className="hover:!text-[#ef4444] disabled:!opacity-30"
          title="Delete Table"
        >
          🗑️
        </Button>
        <Divider
          type="vertical"
          style={{ borderColor: "var(--border-primary)", margin: "4px 0" }}
        />

        {/* Code Block */}
        <Button
          type="text"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleCodeBlock().run();
          }}
          style={{ color: "var(--text-primary)" }}
          className={`hover:!text-[#7C3AED] ${
            editor.isActive("codeBlock") ? "!bg-[#7C3AED] !text-white" : ""
          }`}
          title="Code Block"
        >
          {"</>"}
        </Button>
      </div>
    );
  };

  const [hints, setHints] = useState<string[]>([""]);
  const [options, setOptions] = useState<
    Array<{ text: string; is_correct: boolean }>
  >([
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([""]);
  const [languages, setLanguages] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([""]);
  const [concept, setConcept] = useState<string[]>([""]);
  const [selectedPredefinedConcepts, setSelectedPredefinedConcepts] = useState<string[]>([]);
  const [testCases, setTestCases] = useState<
    Array<{ input: string; expected_output: string }>
  >([{ input: "", expected_output: "" }]);
  const [expectedKeywords, setExpectedKeywords] = useState<string[]>([""]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>([""]);

  // Predefined concepts list
  const predefinedConcepts = [
    "Aptitude",
    "Engineering",
    "Grammar & Sentence Structure",
    "MFG",
    "Purchase",
    "R & D",
    "Basic Mathematics",
    "General Awareness",
    "HR",
    "MFG 2",
    "QUALITY ASSURANCE",
    "QUALITY CONTROL",
    "Science (Cadico/Nu)",
    "Comprehension (Read the passage and answer the questions below.)",
    "Grammar and Sentence Structure",
    "IT",
    "MFG 3",
    "QUALITY ASSURANCE 2",
    "QUALITY CONTROL 2",
    "Science (Cardio Diabetic)",
  ];

  // Get available categories and question types
  const categories =
    questionTypes?.items?.[0]?.attributes?.data?.categories?.filter(
      (cat: any) => cat.enabled
    ) || [];
  const availableQuestionTypes =
    questionTypes?.items?.[0]?.attributes?.data?.question_types?.filter(
      (qt: any) => qt.enabled
    ) || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedQuestionType(null);
      setSelectedCategory(null);
      setHints([""]);
      setOptions([
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ]);
      setCorrectAnswers([""]);
      setLanguages([""]);
      setTags([""]);
      setConcept([""]);
      setSelectedPredefinedConcepts([]);
      setTestCases([{ input: "", expected_output: "" }]);
      setExpectedKeywords([""]);
      setEvaluationCriteria([""]);
      // Reset TipTap editors
      if (sampleAnswerEditor) {
        sampleAnswerEditor.commands.setContent("");
      }
      if (questionTextEditor) {
        questionTextEditor.commands.setContent("");
      }
    }
  }, [visible, form, sampleAnswerEditor, questionTextEditor]);

  // Handle predefined concept checkbox change
  const handlePredefinedConceptChange = (conceptName: string, checked: boolean) => {
    if (checked) {
      setSelectedPredefinedConcepts([...selectedPredefinedConcepts, conceptName]);
    } else {
      setSelectedPredefinedConcepts(
        selectedPredefinedConcepts.filter((c) => c !== conceptName)
      );
    }
  };

  // Handle question type selection
  const handleQuestionTypeChange = (questionTypeId: string) => {
    const questionType = availableQuestionTypes.find(
      (qt: any) => qt.id === questionTypeId
    );
    setSelectedQuestionType(questionType);

    if (questionType) {
      const category = categories.find(
        (cat: any) => cat.id === questionType.category_id
      );
      setSelectedCategory(category);
      form.setFieldsValue({
        category_id: questionType.category_id,
        question_type_id: questionTypeId,
      });

      const typeCode = (questionType.code || "").toLowerCase();
      if (typeCode === "true_false") {
        setOptions([
          { text: "True", is_correct: false },
          { text: "False", is_correct: false },
        ]);
        setCorrectAnswers([""]);
      } else if (typeCode === "fill_blank") {
        setOptions([
          { text: "Answer 1", is_correct: false },
          { text: "Answer 2", is_correct: false },
        ]);
        setCorrectAnswers([""]);
      } else if (typeCode === "single_choice" || typeCode === "multiple_choice") {
        setOptions([
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ]);
        setCorrectAnswers([""]);
      } else {
        setOptions([
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ]);
      }
    }
  };

  // Helper functions for dynamic arrays
  const addHint = () => setHints([...hints, ""]);
  const removeHint = (index: number) =>
    setHints(hints.filter((_, i) => i !== index));
  const updateHint = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const addOption = () =>
    setOptions([...options, { text: "", is_correct: false }]);
  const removeOption = (index: number) =>
    setOptions(options.filter((_, i) => i !== index));
  const updateOption = (
    index: number,
    field: "text" | "is_correct",
    value: string | boolean
  ) => {
    const newOptions = [...options];
    
    // For single choice questions, ensure only one option is marked as correct
    if (field === "is_correct" && value === true) {
      const isSingleChoice = selectedQuestionType?.code === "single_choice" || 
                            selectedQuestionType?.id === "qt_001";
      
      if (isSingleChoice) {
        // Unmark all other options as correct
        newOptions.forEach((opt, i) => {
          if (i !== index) {
            opt.is_correct = false;
          }
        });
      }
    }
    
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const addCorrectAnswer = () => setCorrectAnswers([...correctAnswers, ""]);
  const removeCorrectAnswer = (index: number) =>
    setCorrectAnswers(correctAnswers.filter((_, i) => i !== index));
  const updateCorrectAnswer = (index: number, value: string) => {
    const newAnswers = [...correctAnswers];
    newAnswers[index] = value;
    setCorrectAnswers(newAnswers);
  };

  const addLanguage = () => setLanguages([...languages, ""]);
  const removeLanguage = (index: number) =>
    setLanguages(languages.filter((_, i) => i !== index));
  const updateLanguage = (index: number, value: string) => {
    const newLanguages = [...languages];
    newLanguages[index] = value;
    setLanguages(newLanguages);
  };

  const addTag = () => setTags([...tags, ""]);
  const removeTag = (index: number) =>
    setTags(tags.filter((_, i) => i !== index));
  const updateTag = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  const addConcept = () => setConcept([...concept, ""]);
  const removeConcept = (index: number) =>
    setConcept(concept.filter((_, i) => i !== index));
  const updateConcept = (index: number, value: string) => {
    const newConcept = [...concept];
    newConcept[index] = value;
    setConcept(newConcept);
  };

  const addTestCase = () =>
    setTestCases([...testCases, { input: "", expected_output: "" }]);
  const removeTestCase = (index: number) =>
    setTestCases(testCases.filter((_, i) => i !== index));
  const updateTestCase = (
    index: number,
    field: "input" | "expected_output",
    value: string
  ) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  const addExpectedKeyword = () =>
    setExpectedKeywords([...expectedKeywords, ""]);
  const removeExpectedKeyword = (index: number) =>
    setExpectedKeywords(expectedKeywords.filter((_, i) => i !== index));
  const updateExpectedKeyword = (index: number, value: string) => {
    const newKeywords = [...expectedKeywords];
    newKeywords[index] = value;
    setExpectedKeywords(newKeywords);
  };

  const addEvaluationCriteria = () =>
    setEvaluationCriteria([...evaluationCriteria, ""]);
  const removeEvaluationCriteria = (index: number) =>
    setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
  const updateEvaluationCriteria = (index: number, value: string) => {
    const newCriteria = [...evaluationCriteria];
    newCriteria[index] = value;
    setEvaluationCriteria(newCriteria);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Combine predefined and custom concepts
      const manualConcepts = concept.filter((c) => c.trim() !== "");
      const allConcepts = [...selectedPredefinedConcepts, ...manualConcepts];

      const sanitizedOptions = options
        .map((option) => ({ ...option, text: option.text.trim() }))
        .filter((option) => option.text !== "");

      const manualCorrectAnswers = correctAnswers
        .map((answer) => answer.trim())
        .filter((answer) => answer !== "");

      const derivedCorrectAnswers = sanitizedOptions
        .filter((option) => option.is_correct)
        .map((option) => option.text);

      const finalCorrectAnswers =
        manualCorrectAnswers.length > 0
          ? manualCorrectAnswers
          : derivedCorrectAnswers;

      // Prepare the question data - only include non-empty values
      const questionData: any = {
        ...values,
        hints: hints.filter((h) => h.trim() !== ""), // Filter out empty hints
        options: sanitizedOptions,
        correct_answers: finalCorrectAnswers,
        languages: languages.filter((l) => l.trim() !== ""),
        tags: [], // Send empty array for removed tags field
        concept: allConcepts, // Combined predefined and custom concepts
        test_cases: testCases.filter(
          (tc) => tc.input.trim() !== "" || tc.expected_output.trim() !== ""
        ),
        expected_keywords: expectedKeywords.filter((k) => k.trim() !== ""),
        evaluation_criteria: evaluationCriteria.filter((c) => c.trim() !== ""),
        library_scope: "company",
        version: 1,
        is_template: false,
        description: "", // Send empty string for removed description field
        scoring_guidelines: "", // Send empty string for removed scoring guidelines field
      };

      // Only include domain if it has a value
      if (values.domain?.trim()) {
        questionData.domain = values.domain.trim();
      }

      // Only include skill if it has a value
      if (values.skill?.trim()) {
        questionData.skill = values.skill.trim();
      }

      // Always create question in library only (not in section)
      const response = await createQuestion(
        questionData as unknown as Record<string, unknown>
      );

      if (response.success) {
        // Show success toast
        showToast({
          message: "Question Created Successfully",
          description: "Your custom question has been added to the library.",
          type: "success",
          position: "top-right",
          duration: 3000,
        });
        onSuccess();
        onCancel();
        // Refresh the library questions if callback is provided
        if (onRefreshLibrary) {
          onRefreshLibrary();
        }
      } else {
        console.error("API Error:", response);
        showToast({
          message: "Failed to Create Question",
          description: response.data?.message || "Failed to create question. Please try again.",
          type: "error",
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error creating question:", error);
      showToast({
        message: "Failed to Create Question",
        description: "An error occurred while creating the question. Please try again.",
        type: "error",
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Render dynamic form fields based on question type
  const renderQuestionTypeSpecificFields = () => {
    if (!selectedQuestionType) return null;

    const questionTypeCode = selectedQuestionType.code;

    switch (questionTypeCode) {
      case "single_choice":
      case "multiple_choice":
      case "true_false":
      case "fill_blank":
        return (
          <Card title="Multiple Choice Options" size="small" className="mb-4">
            {options.map((option, index) => (
              <Row key={index} gutter={8} className="mb-2">
                <Col span={1}>
                  <div className="flex items-center justify-center h-8 w-8 bg-[#7C3AED] text-white rounded-full text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                </Col>
                <Col span={18}>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    value={option.text}
                    onChange={(e) =>
                      updateOption(index, "text", e.target.value)
                    }
                  />
                </Col>
                <Col span={4}>
                  <Switch
                    checked={option.is_correct}
                    onChange={(checked) =>
                      updateOption(index, "is_correct", checked)
                    }
                    checkedChildren="Correct"
                    unCheckedChildren="Incorrect"
                  />
                </Col>
                <Col span={1}>
                  {options.length > 2 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeOption(index)}
                    />
                  )}
                </Col>
              </Row>
            ))}
            <Button
              type="dashed"
              onClick={addOption}
              icon={<PlusOutlined />}
              className="w-full"
            >
              Add Option
            </Button>
          </Card>
        );
      case "essay":
        return (
          <Card title="Answer Configuration" size="small" className="mb-4">
            <Form.Item
              label="Answer Format (required)"
              name="answer_format"
              required={false}
              rules={[
                { required: true, message: "Please specify answer format" },
              ]}
            >
              <Input placeholder="e.g., Single word, Complete sentence, etc." />
            </Form.Item>

            <Form.Item label="Sample Answer" name="sample_answer">
              <div className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)] !rounded-lg">
                <EditorToolbar editor={sampleAnswerEditor} />
                <EditorContent editor={sampleAnswerEditor} />
              </div>
            </Form.Item>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Expected Keywords</div>
              {expectedKeywords.map((keyword, index) => (
                <Row key={index} gutter={8} className="mb-2">
                  <Col span={22}>
                    <Input
                      placeholder="Expected keyword"
                      value={keyword}
                      onChange={(e) =>
                        updateExpectedKeyword(index, e.target.value)
                      }
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeExpectedKeyword(index)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={addExpectedKeyword}
                icon={<PlusOutlined />}
                className="w-full"
              >
                Add Expected Keyword
              </Button>
            </div>
          </Card>
        );

      case "coding":
        return (
          <Card title="Coding Configuration" size="small" className="mb-4">
            <Form.Item
              label="Expected Output (required)"
              name="expected_output"
              required={false}
              rules={[
                { required: true, message: "Please specify expected output" },
              ]}
            >
              <TextArea rows={3} placeholder="Expected output format" />
            </Form.Item>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Test Cases</div>
              {testCases.map((testCase, index) => (
                <Card key={index} size="small" className="mb-2">
                  <Row gutter={8}>
                    <Col span={11}>
                      <Input
                        placeholder="Input"
                        value={testCase.input}
                        onChange={(e) =>
                          updateTestCase(index, "input", e.target.value)
                        }
                      />
                    </Col>
                    <Col span={11}>
                      <Input
                        placeholder="Expected Output"
                        value={testCase.expected_output}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            "expected_output",
                            e.target.value
                          )
                        }
                      />
                    </Col>
                    <Col span={2}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTestCase(index)}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={addTestCase}
                icon={<PlusOutlined />}
                className="w-full"
              >
                Add Test Case
              </Button>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                Supported Languages
              </div>
              {languages.map((language, index) => (
                <Row key={index} gutter={8} className="mb-2">
                  <Col span={22}>
                    <Input
                      placeholder="Programming language"
                      value={language}
                      onChange={(e) => updateLanguage(index, e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeLanguage(index)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={addLanguage}
                icon={<PlusOutlined />}
                className="w-full"
              >
                Add Language
              </Button>
            </div>
          </Card>
        );

      default:
        return (
          <Card title="General Configuration" size="small" className="mb-4">
            <Form.Item label="Answer Format" name="answer_format">
              <Input placeholder="Specify answer format if applicable" />
            </Form.Item>

            <Form.Item label="Sample Answer" name="sample_answer">
              <div className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)] !rounded-lg">
                <EditorToolbar editor={sampleAnswerEditor} />
                <EditorContent editor={sampleAnswerEditor} />
              </div>
            </Form.Item>
          </Card>
        );
    }
  };

  return (
    <Modal
      title="Create Custom Question"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-primary)",
          }}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6D28D9]"
        >
          Create Question
        </Button>,
      ]}
      className="[&_.ant-modal-header]:!bg-[var(--bg-primary)] [&_.ant-modal-header]:!py-4 [&_.ant-modal-footer]:!py-4 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-[var(--border-primary)] [&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-footer]:!bg-[var(--bg-primary)] [&_.ant-modal-footer]:!border-t [&_.ant-modal-footer]:!border-[var(--border-primary)]"
    >
      <Form
        form={form}
        layout="vertical"
        className="[&_.ant-form-item-label]:!text-[var(--text-primary)] [&_.ant-input]:!bg-[var(--bg-secondary)] [&_.ant-input]:!border-[var(--border-primary)] [&_.ant-input]:!text-[var(--text-primary)] [&_.ant-select-selector]:!bg-[var(--bg-secondary)] [&_.ant-select-selector]:!border-[var(--border-primary)] [&_.ant-select-selection-item]:!text-[var(--text-primary)] [&_.ant-input-number]:!bg-[var(--bg-secondary)] [&_.ant-input-number]:!border-[var(--border-primary)]"
      >
        {/* Basic Information */}
                <Form.Item
                  label="Question Type (required)"
                  name="question_type_id"
                  required={false}
                  rules={[
                    { required: true, message: "Please select question type" },
                  ]}
                >
                  <Select
                    placeholder="Select question type"
                    onChange={handleQuestionTypeChange}
                  >
                    {availableQuestionTypes.map((qt: any) => (
                      <Option key={qt.id} value={qt.id}>
                        {qt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

        {/* Hidden field for category - sent to backend but not shown in UI */}
        <Form.Item name="category_id" hidden>
          <Input />
                </Form.Item>

            <Form.Item
              label="Question Text (required)"
              name="question_text"
              required={false}
          rules={[{ required: true, message: "Please enter question text" }]}
            >
          <div className="!bg-[var(--bg-secondary)] !border-[var(--border-primary)] !rounded-lg">
            <EditorToolbar editor={questionTextEditor} />
            <EditorContent editor={questionTextEditor} />
          </div>
            </Form.Item>

        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Concepts</div>
          
          {/* Predefined Concepts - Checkboxes */}
          <Card 
            size="small" 
            className="mb-3"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Select from predefined concepts:
            </div>
            <Row gutter={[8, 8]}>
              {predefinedConcepts.map((conceptName) => (
                <Col key={conceptName} xs={24} sm={12} md={8}>
                  <Checkbox
                    checked={selectedPredefinedConcepts.includes(conceptName)}
                    onChange={(e) =>
                      handlePredefinedConceptChange(conceptName, e.target.checked)
                    }
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{conceptName}</span>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Manual Concepts - Text Input */}
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Or add custom concepts:
          </div>
          {concept.map((conceptItem, index) => (
            <Row key={index} gutter={8} className="mb-2">
              <Col span={22}>
                <Input
                  placeholder="Custom concept"
                  value={conceptItem}
                  onChange={(e) => updateConcept(index, e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeConcept(index)}
                />
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            onClick={addConcept}
            icon={<PlusOutlined />}
            className="w-full"
          >
            Add Custom Concept
          </Button>
        </div>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Domain (required)"
                  name="domain"
                  required={false}
                  rules={[{ required: true, message: "Domain is required" }]}
                >
                  <Input placeholder="e.g., Frontend, Backend" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Skills (required)"
                  name="skill"
                  required={false}
                  rules={[{ required: true, message: "Skills are required" }]}
                >
                  <Input placeholder="e.g., JavaScript, Python" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Difficulty Level"
                  name="difficulty_level"
                  initialValue={1}
                >
                  <InputNumber
                    min={1}
                    max={5}
                    className="w-full"
                    placeholder="1-5"
                  />
                </Form.Item>
              </Col>
            </Row>

        {/* Question Type Specific Fields */}
            {renderQuestionTypeSpecificFields()}

        {/* Hints Field - Optional */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Hints (Optional)
          </div>
          {hints.map((hint, index) => (
            <Row key={index} gutter={8} className="mb-2">
              <Col span={22}>
                <Input
                  placeholder="Enter a hint"
                  value={hint}
                  onChange={(e) => updateHint(index, e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeHint(index)}
                />
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            onClick={addHint}
            icon={<PlusOutlined />}
            className="w-full"
          >
            Add Hint
          </Button>
        </div>

        {/* Additional Settings */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Max Score" name="max_score" initialValue={10}>
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Maximum score"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Time Limit (minutes)"
                  name="time_limit"
                  initialValue={30}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Time limit in minutes"
                  />
                </Form.Item>
              </Col>
            </Row>

        {/* Hidden fields for removed UI elements - sent to backend if needed */}
        <Form.Item name="shuffle_options" hidden initialValue={false}>
                  <Switch />
                </Form.Item>
        <Form.Item name="ai_evaluation_enabled" hidden initialValue={false}>
                  <Switch />
                </Form.Item>
        <Form.Item name="description" hidden>
          <Input />
            </Form.Item>
        <Form.Item name="scoring_guidelines" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionCreationModal;
