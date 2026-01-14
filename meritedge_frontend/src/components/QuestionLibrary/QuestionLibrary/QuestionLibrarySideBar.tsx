import { Card, Col, Collapse, Row, Tree, TreeDataNode } from "antd";
import { useMemo, useState, useEffect } from "react";

// Define proper types for the data structures
interface QuestionType {
  description: string;
  code: string;
  id: string;
  label: string;
  category_id: string | null;
  enabled: boolean;
}

interface QuestionTypeData {
  default: unknown;
  question_types: QuestionType[];
  categories: unknown[];
  is_active: boolean;
  mandatory: boolean;
}

interface QuestionTypesData {
  items: Array<{
    unique_id: string;
    entity_type: string;
    attributes: {
      data: QuestionTypeData;
    };
  }>;
}

// Interface for tree node data
interface TreeNodeData {
  key: string;
  title: string;
  count: number;
  description?: string;
  enabled?: boolean;
}

const renderTreeNodes = (
  data: TreeNodeData[],
  questionCounts?: Record<string, number>
): TreeDataNode[] =>
  data.map((node) => ({
    key: node.key,
    isLeaf: true,
    title: (
      <div className="!flex !items-center !justify-between !w-full !pr-2 !pl-2">
        <span className="text-xs sm:text-sm" style={{ flex: 1, minWidth: 0 }}>
          {node.title}
        </span>
        <span
          className="text-xs sm:text-sm text-[#A3A3A3] shrink-0 ml-auto"
          style={{ textAlign: "right" }}
        >
          ({questionCounts?.[node.key] || 0})
        </span>
      </div>
    ),
  }));

// Function to process questionTypes data and generate Collapse items with custom hierarchy
const generateCollapseItems = (
  questionTypes: QuestionTypesData | null,
  selectedQuestionTypes?: string[],
  onQuestionTypeSelection?: (questionTypeIds: string[]) => void,
  questionCounts?: Record<string, number>
) => {
  if (
    !questionTypes ||
    !questionTypes.items ||
    questionTypes.items.length === 0
  ) {
    return [];
  }

  // Get the first (and only) item's data
  const questionTypeData = questionTypes.items[0]?.attributes?.data;
  if (!questionTypeData) {
    return [];
  }

  const { question_types } = questionTypeData;

  // Define custom hierarchy structure
  const customHierarchy = [
    {
      key: "multiple_choice_parent",
      label: "Objective",
      icon: `${import.meta.env.BASE_URL}question-library/code.svg`,
      iconType: "bordered", // Icon with border and gradient (same as others)
      children: ["qt_001", "qt_002", "qt_003", "qt_004"], // Single Choice, Multiple Choice, True/False, Fill in the Blanks
    },

    {
      key: "subjective_parent",
      label: "Subjective",
      icon: `${import.meta.env.BASE_URL}question-library/code.svg`,
      iconType: "bordered", // Icon with border and gradient
      children: [], // No children - standalone heading
    },
    {
      key: "coding_parent",
      label: "Coding",
      icon: `${import.meta.env.BASE_URL}question-library/code.svg`,
      iconType: "bordered", // Icon with border and gradient
      children: ["frontend", "api_based", "fullstack", "data_science"], // Front-End, API Based, Full-stack, Data Science as sub-items
    },
    {
      key: "audio_video_parent",
      label: "Audio Video",
      icon: `${import.meta.env.BASE_URL}question-library/code.svg`,
      iconType: "bordered", // Icon with border and gradient
      children: [], // No children - standalone heading
    },
  ];

  return customHierarchy.map((parent) => {
    // Check if this is a standalone category (no children)
    const isStandalone = parent.children.length === 0;

    // Special handling for Coding parent with domain sub-items
    const isCodingParent = parent.key === "coding_parent";

    // Filter questions for this parent category (only for Objective which uses actual question type IDs)
    const parentQuestions = question_types.filter(
      (qt) => parent.children.includes(qt.id) && qt.enabled
    );

    // Generate tree data for questions in this parent category
    const treeData: TreeNodeData[] = parentQuestions.map((qt) => ({
      key: qt.id,
      title: qt.label,
      count: 0,
      description: qt.description,
      enabled: qt.enabled,
    }));

    // For Coding parent, create tree data for domain sub-items
    if (isCodingParent) {
      const codingSubItems: TreeNodeData[] = [
        {
          key: "domain_frontend",
          title: "Front-End",
          count: 0,
        },
        {
          key: "domain_api_based",
          title: "API Based",
          count: 0,
        },
        {
          key: "domain_fullstack",
          title: "Full-stack",
          count: 0,
        },
        {
          key: "domain_data_science",
          title: "Data Science",
          count: 0,
        },
      ];

      // Calculate total count for all coding sub-items
      const totalCodingCount = codingSubItems.reduce((sum) => sum, 0);

      return {
        key: parent.key,
        label: (
          <div className="flex items-center w-full gap-2 sm:gap-3">
            <div className="flex justify-center items-center w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] p-[4px] sm:p-[6px] shrink-0 rounded-[6.182px] border border-[#61C1FC] [background:radial-gradient(52.12%_52.12%_at_64.71%_50%,rgba(5,180,255,0.38)_0%,#0F1014_100%)]">
              <img
                src={parent.icon}
                alt={parent.label}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <p
              className="text-xs sm:text-sm md:text-base !mb-0"
              style={{ color: "var(--text-primary)", flex: 1, minWidth: 0 }}
            >
              {parent.label}
              <span
                className=" ml-1"
                style={{
                  color: "var(--text-secondary)",
                  minWidth: "fit-content",
                  order: 2,
                }}
              >
                ({totalCodingCount})
              </span>
            </p>
          </div>
        ),
        children: (
          <Tree
            checkable
            checkedKeys={selectedQuestionTypes || []}
            onCheck={(checkedKeys, info) => {
              if (onQuestionTypeSelection) {
                // ONLY ONE QUESTION TYPE SELECTABLE AT A TIME
                if (info.checked && info.node.key) {
                  console.log("✅ Selecting ONLY:", info.node.key);
                  onQuestionTypeSelection([info.node.key as string]);
                } else {
                  console.log("❌ Deselecting. Clearing all filters.");
                  onQuestionTypeSelection([]);
                }
              }
            }}
            className="[&_.ant-tree-node-content-wrapper]:hover:!text-[var(--text-primary)] [&_.ant-tree-checkbox-inner]:!border-[var(--border-primary)] [&_.ant-tree-checkbox-inner]:!bg-[var(--bg-primary)] [&_.ant-tree-checkbox-checked_.ant-tree-checkbox-inner]:!bg-[#7C3AED] [&_.ant-tree-checkbox-checked_.ant-tree-checkbox-inner]:!border-[#7C3AED]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            showLine
            defaultExpandAll
            selectable={false}
            expandAction={false}
            treeData={renderTreeNodes(codingSubItems, questionCounts)}
          />
        ),
      };
    }

    // For standalone categories, render as clickable items
    if (isStandalone) {
      console.log(
        "🏷️ Processing standalone category:",
        parent.key,
        parent.label
      );

      // Map category to question type ID
      let questionTypeId = "";
      let questionCount = 0;

      if (parent.key === "subjective_parent") {
        questionTypeId = "qt_006"; // Coding mapped to Subjective label
        questionCount = questionCounts?.["qt_006"] || 0;
        console.log(
          "  → Subjective label mapped to qt_006, count:",
          questionCount
        );
      } else if (parent.key === "audio_video_parent") {
        questionTypeId = "qt_007"; // Audio (default)
        questionCount =
          (questionCounts?.["qt_007"] || 0) + (questionCounts?.["qt_008"] || 0);
        console.log("  → Mapped to Audio/Video, count:", questionCount);
      }

      const isSelected =
        selectedQuestionTypes?.includes(questionTypeId) || false;
      console.log(
        "  → Is selected?",
        isSelected,
        "questionTypeId:",
        questionTypeId
      );

      return {
        key: parent.key,
        label: (
          <div
            className="flex items-center gap-2 sm:gap-3 !pl-0 cursor-pointer hover:opacity-80 transition-opacity w-full pr-4 sm:pr-6 relative"
            onClick={() => {
              console.log(
                "🖱️ Clicked on:",
                parent.label,
                "→ Question Type ID:",
                questionTypeId
              );
              if (onQuestionTypeSelection && questionTypeId) {
                // ONLY ONE CATEGORY SELECTABLE AT A TIME
                if (isSelected) {
                  // If already selected, deselect (clear all)
                  console.log("❌ Deselecting. Clearing all filters.");
                  onQuestionTypeSelection([]);
                } else {
                  // Replace any existing selection with this one (single selection)
                  console.log(
                    "✅ Selecting ONLY this category:",
                    questionTypeId
                  );
                  onQuestionTypeSelection([questionTypeId]);
                }
              }
            }}
            style={{
              backgroundColor: isSelected
                ? "rgba(124, 58, 237, 0.1)"
                : "transparent",
              borderRadius: "8px",
              padding: "4px",
              width: "100%",
            }}
          >
            <span className="flex justify-center items-center w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] p-[4px] sm:p-[6px] shrink-0 rounded-[6.182px] border border-[#61C1FC] [background:radial-gradient(52.12%_52.12%_at_64.71%_50%,rgba(5,180,255,0.38)_0%,#0F1014_100%)]">
              <img
                src={parent.icon}
                alt={parent.label}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </span>
            <span
              className="text-xs sm:text-sm md:text-base"
              style={{
                color: "var(--text-primary)",
                fontWeight: isSelected ? "600" : "normal",
                flex: 1,
                minWidth: 0,
              }}
            >
              {parent.label}
            </span>
            <span
              className="text-xs sm:text-sm shrink-0 absolute right-3 sm:right-6"
              style={{
                color: isSelected
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)",
                minWidth: "fit-content",
                textAlign: "right",
              }}
            >
              ({questionCount})
            </span>
          </div>
        ),
        showArrow: false, // Don't show collapse arrow for standalone items
        collapsible: "disabled" as const, // Make it non-collapsible
        children: null,
      };
    }

    // For parent categories with children (Multiple Choice)
    // Calculate total count for all children
    const totalChildrenCount = parentQuestions.reduce((sum, qt) => {
      return sum + (questionCounts?.[qt.id] || 0);
    }, 0);

    return {
      key: parent.key,
      label: (
        <div className="flex items-center w-full gap-2 sm:gap-3">
          <div className="flex justify-center items-center w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] p-[4px] sm:p-[6px] shrink-0 rounded-[6.182px] border border-[#61C1FC] [background:radial-gradient(52.12%_52.12%_at_64.71%_50%,rgba(5,180,255,0.38)_0%,#0F1014_100%)]">
            <img
              src={parent.icon}
              alt={parent.label}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <p
            className="text-xs sm:text-sm md:text-base"
            style={{ color: "var(--text-primary)", flex: 1, minWidth: 0 }}
          >
            {parent.label}
            <span
              className="text-xs sm:text-sm shrink-0 ml-1"
              style={{
                color: "var(--text-secondary)",
                minWidth: "fit-content",
                order: 2,
              }}
            >
              ({totalChildrenCount})
            </span>
          </p>
        </div>
      ),
      children:
        parentQuestions.length > 0 ? (
          <Tree
            checkable
            checkedKeys={selectedQuestionTypes || []}
            onCheck={(checkedKeys, info) => {
              if (onQuestionTypeSelection) {
                // ONLY ONE QUESTION TYPE SELECTABLE AT A TIME
                // If checking a new item, keep only that one
                if (info.checked && info.node.key) {
                  console.log("✅ Selecting ONLY:", info.node.key);
                  onQuestionTypeSelection([info.node.key as string]);
                } else {
                  // If unchecking, clear all
                  console.log("❌ Deselecting. Clearing all filters.");
                  onQuestionTypeSelection([]);
                }
              }
            }}
            className="[&_.ant-tree-node-content-wrapper]:hover:!text-[var(--text-primary)] [&_.ant-tree-checkbox-inner]:!border-[var(--border-primary)] [&_.ant-tree-checkbox-inner]:!bg-[var(--bg-primary)] [&_.ant-tree-checkbox-checked_.ant-tree-checkbox-inner]:!bg-[#7C3AED] [&_.ant-tree-checkbox-checked_.ant-tree-checkbox-inner]:!border-[#7C3AED]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            showLine
            defaultExpandAll
            selectable={false}
            expandAction={false}
            treeData={renderTreeNodes(treeData, questionCounts)}
          />
        ) : null,
    };
  });
};

export default function QuestionLibrarySideBar({
  selectedQuestionId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleSelectionSummaryOk,
  openQuestionLibrary,
  isQuestionLibraryOpen,
  questionTypes,
  questionTypesLoading,
  shouldHaveFullHeight = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleQuestionSelectionChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleSelectAllQuestions,
  handleClearAllQuestions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleSelectCategoryQuestions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedCategories,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedQuestionTypes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCategorySelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onQuestionTypeSelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  questionCounts,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  // Track selected count from question components
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const checkSelectedCount = () => {
      const count = (window as any).__selectedQuestionsCount || 0;
      if (count !== selectedCount) {
        setSelectedCount(count);
      }
    };

    // Check immediately
    checkSelectedCount();

    // Set up interval to check periodically (since we can't easily subscribe to changes)
    const interval = setInterval(checkSelectedCount, 200);

    // Also listen for custom events when selection changes
    const handleSelectionChange = () => {
      checkSelectedCount();
    };
    window.addEventListener("selectionCountChanged", handleSelectionChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "selectionCountChanged",
        handleSelectionChange
      );
    };
  }, [selectedCount]);

  // Memoize the collapse items to prevent unnecessary re-renders
  const collapseItems = useMemo(() => {
    if (!questionTypes || !questionTypes.items) {
      return [];
    }
    return generateCollapseItems(
      questionTypes,
      selectedQuestionTypes,
      onQuestionTypeSelection,
      questionCounts
    );
  }, [
    questionTypes,
    selectedQuestionTypes,
    onQuestionTypeSelection,
    questionCounts,
  ]);

  return (
    <div
      className={`relative ${
        shouldHaveFullHeight
          ? "h-full"
          : "h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] md:h-[calc(100vh-220px)] lg:h-[calc(100vh-255px)]"
      }`}
    >
      <Card
        className="!h-full !rounded-2xl !overflow-y-auto [&_.ant-card-head]:sticky [&_.ant-card-head]:top-0 [&_.ant-card-head]:z-20"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-primary)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          paddingBottom: selectedQuestionId?.length > 0 ? "200px" : "0",
        }}
        styles={{
          header: {
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderBottom: "1px solid var(--border-primary)",
          },
          body: {
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          },
        }}
        title={
          <Row align="middle" justify="space-between">
            {isQuestionLibraryOpen && (
              <Col
                className="text-sm sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Question Type(s)
              </Col>
            )}
            <Col>
              <img
                src={`${import.meta.env.BASE_URL}layout/toggle-icon.svg`}
                className="object-contain w-5 sm:w-6 cursor-pointer"
                alt="Expanded Logo"
                onClick={openQuestionLibrary}
                style={{ filter: "var(--icon-filter)" }}
              />
            </Col>
          </Row>
        }
      >
        {isQuestionLibraryOpen && (
          <>
            {questionTypesLoading ? (
              <div
                className="text-center py-6 sm:py-8"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#7C3AED] mx-auto mb-3"></div>
                <p className="text-xs sm:text-sm">Loading question types...</p>
              </div>
            ) : questionTypes && questionTypes.items ? (
              <Collapse
                className="
                                    [&_.ant-collapse-header]:!text-[var(--text-primary)]
                                    [&_.ant-collapse-content]:!text-[var(--text-primary)]
                                    [&_.ant-collapse-expand-icon]:!order-last
                                    [&_.ant-collapse-expand-icon]:!ml-2
                                    [&_.ant-collapse-expand-icon]:!text-[var(--text-secondary)]
                                    [&_.ant-collapse-item-active_.ant-collapse-expand-icon]:!text-[var(--accent-primary)]
                                "
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
                defaultActiveKey={["multiple_choice_parent", "coding_parent"]}
                ghost
                items={collapseItems}
              />
            ) : (
              <div
                className="text-center py-6 sm:py-8"
                style={{ color: "var(--text-secondary)" }}
              >
                <p className="text-xs sm:text-sm">
                  No question types available
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
