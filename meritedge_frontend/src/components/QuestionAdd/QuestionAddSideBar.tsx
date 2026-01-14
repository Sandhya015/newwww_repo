import { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Row,
  Typography,
  Dropdown,
  Tooltip,
} from "antd";
import {
  EllipsisOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Text } = Typography;

interface QuestionAddSideBarProps {
  sectionData: any;
  openQuestionAddSection: () => void;
  isQuestionAddSectionOpen: boolean;
  handleChangeSection: (sectionId: string) => void;
  selectedSectionID: string;
  handleEditSection: (section: any) => void;
  handleDeleteSection: (section: any) => void;
  openAddSectionModal: () => void;
  sectionQuestions: any;
  sectionQuestionsLoading: boolean;
  onSectionReorder?: (reorderedSections: any[]) => void;
}

// Sortable Section Item Component
function SortableSectionItem({
  section,
  index,
  selectedSectionID,
  handleChangeSection,
  handleEditSection,
  handleDeleteSection,
}: {
  section: any;
  index: number;
  selectedSectionID: string;
  handleChangeSection: (sectionId: string) => void;
  handleEditSection: (section: any) => void;
  handleDeleteSection: (section: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.section_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragging = useRef(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={(e) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        wasDragging.current = false;
      }}
      onMouseMove={(e) => {
        if (dragStartPos.current) {
          const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
          const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
          if (deltaX > 5 || deltaY > 5) {
            // Threshold to consider it a drag
            wasDragging.current = true;
          }
        }
      }}
      onMouseUp={() => {
        dragStartPos.current = null;
      }}
    >
      <div
        className="!relative !w-full !rounded-[20px] !overflow-hidden mt-5"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onClick={(e) => {
          // Only select section if we didn't drag
          if (!wasDragging.current && !isDragging) {
            handleChangeSection(section?.section_id);
          }
          wasDragging.current = false; // Reset for next interaction
        }}
      >
        {selectedSectionID == section?.section_id && (
          <div
            className="!absolute !inset-0 !h-[500%] !w-[150%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_5.5s_linear_infinite] !rounded-[20px]"
            style={{
              background:
                "conic-gradient(from 360deg at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 41%, rgba(255,255,255,1) 55%, rgba(255,255,255,0) 60%)",
            }}
          />
        )}

        <Card
          className={`!m-[1px] !rounded-[20px] !flex !items-center !justify-start !p-5 ${
            selectedSectionID == section?.section_id
              ? "!border-none"
              : "!border-[var(--border-primary)]"
          }`}
          style={{
            backgroundColor:
              selectedSectionID == section?.section_id
                ? "var(--bg-tertiary)"
                : "var(--bg-secondary)",
            border:
              selectedSectionID == section?.section_id
                ? "none"
                : "1px solid var(--border-primary)",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            padding: "16px",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {selectedSectionID == section?.section_id ? (
            <div
              className="absolute"
              style={{
                zIndex: 1,
                width: "132px",
                height: "254px",
                top: "-58px",
                left: "60%",
                backgroundColor: "#7C3AED",
                borderRadius: "66.15px/127.09px",
                transform: "rotate(-41.94deg)",
                filter: "blur(51.5px)",
                opacity: 0.65,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "1px",
                borderRadius: "8px",
                background:
                  "conic-gradient(from 180deg at 51% 51%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 41%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 60%)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          )}

          <div className="relative w-full" style={{ zIndex: 2 }}>
            {/* Section Name */}
            <div className="mb-3">
              <Tooltip title={section.section_name} placement="top">
                <div
                  className="!text-base font-semibold !block !overflow-hidden !text-ellipsis !whitespace-nowrap"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "Helvetica Neue, Helvetica, sans-serif",
                    lineHeight: "1.4",
                  }}
                >
                  {section.section_name}
                </div>
              </Tooltip>
            </div>

            {/* Section Instructions (if available) */}
            {section.instructions &&
              section.instructions.trim() &&
              section.instructions.toLowerCase() !==
                "default section created automatically" && (
                <div className="mb-4">
                  <Tooltip title={section.instructions} placement="top">
                    <div
                      className="!text-xs font-normal !block !overflow-hidden !text-ellipsis !whitespace-nowrap"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "Helvetica Neue, Helvetica, sans-serif",
                        lineHeight: "1.5",
                      }}
                    >
                      {section.instructions}
                    </div>
                  </Tooltip>
                </div>
              )}

            {/* Questions Count Badge */}
            <div
              className="relative py-2.5 px-4 rounded-xl"
              style={{
                backgroundColor:
                  selectedSectionID == section?.section_id
                    ? "rgba(124, 58, 237, 0.15)"
                    : "var(--bg-tertiary)",
                border: `1px solid ${
                  selectedSectionID == section?.section_id
                    ? "var(--accent-primary)"
                    : "var(--border-primary)"
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "36px",
              }}
            >
              <Text
                className="!text-xs font-medium"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, sans-serif",
                  color:
                    selectedSectionID == section?.section_id
                      ? "var(--accent-primary)"
                      : "var(--text-secondary)",
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                {String(section.question_count || 0).padStart(2, "0")} Question
                {section.question_count !== 1 ? "s" : ""}
              </Text>
            </div>
          </div>

          <div
            className="absolute flex items-center"
            style={{
              top: "16px",
              right: "16px",
              zIndex: 3,
              height: "32px",
              display: "flex",
              alignItems: "center",
            }}
            onClick={(e) => {
              // Stop event propagation to prevent triggering section change
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Also stop on mousedown to prevent any click events
              e.stopPropagation();
            }}
          >
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    label: "Edit",
                    icon: <EditOutlined />,
                    onClick: (e) => {
                      // Stop propagation when menu item is clicked
                      e?.domEvent?.stopPropagation();
                      handleEditSection(section);
                    },
                  },
                  {
                    key: "delete",
                    label: "Delete",
                    icon: <DeleteOutlined />,
                    onClick: (e) => {
                      // Stop propagation when menu item is clicked
                      e?.domEvent?.stopPropagation();
                      handleDeleteSection(section);
                    },
                    danger: true,
                  },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
              onOpenChange={(open) => {
                // Prevent any side effects when dropdown opens/closes
                if (open) {
                  // Dropdown is opening - ensure no section change happens
                }
              }}
            >
              <div
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  backgroundColor:
                    selectedSectionID == section?.section_id
                      ? "rgba(124, 58, 237, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: `1px solid ${
                    selectedSectionID == section?.section_id
                      ? "rgba(124, 58, 237, 0.3)"
                      : "transparent"
                  }`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    selectedSectionID == section?.section_id
                      ? "rgba(124, 58, 237, 0.2)"
                      : "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    selectedSectionID == section?.section_id
                      ? "rgba(124, 58, 237, 0.15)"
                      : "rgba(255, 255, 255, 0.05)";
                }}
                onClick={(e) => {
                  // Stop propagation to prevent section change
                  e.stopPropagation();
                }}
              >
                <EllipsisOutlined
                  className="rotate-90"
                  style={{
                    fontSize: "18px",
                    color:
                      selectedSectionID == section?.section_id
                        ? "var(--accent-primary)"
                        : "var(--text-secondary)",
                    cursor: "pointer",
                    opacity: 1,
                  }}
                />
              </div>
            </Dropdown>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function QuestionAddSideBar({
  sectionData,
  openQuestionAddSection,
  isQuestionAddSectionOpen,
  handleChangeSection,
  selectedSectionID,
  handleEditSection,
  handleDeleteSection,
  openAddSectionModal,
  sectionQuestions,
  sectionQuestionsLoading,
  onSectionReorder,
}: QuestionAddSideBarProps) {
  const [sections, setSections] = useState<any[]>([]);

  // Initialize sections when sectionData changes
  useEffect(() => {
    if (sectionData?.data?.sections) {
      const sortedSections = [...sectionData.data.sections].sort(
        (a, b) => (a.section_order || 0) - (b.section_order || 0)
      );
      setSections(sortedSections);
    }
  }, [sectionData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = sections.findIndex((s) => s.section_id === String(active.id));
    const to = sections.findIndex((s) => s.section_id === String(over.id));

    if (from !== -1 && to !== -1) {
      const reordered = arrayMove(sections, from, to);
      setSections(reordered);

      // Call the reorder handler
      if (onSectionReorder) {
        onSectionReorder(reordered);
      }
    }
  };

  // Calculate section count with fallback to ensure consistency
  const getSectionCount = () => {
    const serverCount = parseInt(sectionData?.total_section || "0");
    const actualCount = sections.length || 0;
    // Use the higher of the two counts to ensure consistency
    return Math.max(serverCount, actualCount);
  };

  return (
    <>
      <Card
        title={
          <Row align="top" justify="space-between">
            {isQuestionAddSectionOpen && <Col>Sections</Col>}
            <Col>
              <img
                src={`${import.meta.env.BASE_URL}layout/toggle-icon.svg`}
                className="object-contain w-6 cursor-pointer"
                alt="Expanded Logo"
                onClick={openQuestionAddSection}
              />
            </Col>
          </Row>
        }
        variant="borderless"
        className="!h-[calc(100vh-180px)] sm:!h-[calc(100vh-200px)] md:!h-[calc(100vh-220px)] lg:!h-[calc(100vh-262px)] !rounded-2xl !mb-3 !overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-primary)",
        }}
        styles={{
          header: {
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderBottom: "1px solid var(--border-primary)",
          },
          body: {
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          },
        }}
      >
        {!isQuestionAddSectionOpen ? (
          <div
            className="h-full flex items-center justify-center select-none cursor-pointer"
            style={{
              minHeight: "200px",
              position: "relative",
            }}
            onClick={openQuestionAddSection}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "14px",
                whiteSpace: "nowrap",
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                position: "absolute",
                letterSpacing: "0.05em",
              }}
            >
              List of Sections ({getSectionCount()})
            </div>
          </div>
        ) : (
          <>
            <Row align="middle" justify="space-between" className="gap-4">
              <Col
                className="font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                List of Sections ({getSectionCount()})
              </Col>
              <Col>
                <Button
                  className="!p-[10px] !bg-[#7C3AED] !text-white !rounded-2xl !px-4 !border-none"
                  onClick={openAddSectionModal}
                >
                  <PlusOutlined style={{ fontSize: "12px", color: "white" }} />{" "}
                  Add Section
                </Button>
              </Col>
            </Row>

            {sectionQuestionsLoading && (
              <div
                className="mb-4 p-3 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-primary)",
                }}
              >
                <Text
                  className="!text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading section questions...
                </Text>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.section_id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section, index) => (
                  <SortableSectionItem
                    key={section.section_id}
                    section={section}
                    index={index}
                    selectedSectionID={selectedSectionID}
                    handleChangeSection={handleChangeSection}
                    handleEditSection={handleEditSection}
                    handleDeleteSection={handleDeleteSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </>
        )}
      </Card>
    </>
  );
}
