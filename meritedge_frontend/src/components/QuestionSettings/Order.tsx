import { useState, useEffect } from "react";
import { Button, message } from "antd";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
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
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

interface Question {
    question_id: string;
    question_type: string;
    question_type_id?: string;
    duration?: number;
    time_limit?: string | number;
}

interface QuestionTypeGroup {
    type: string;
    formattedType: string;
    count: number;
    totalDuration: number;
    questions: Question[];
}

interface Section {
    section_id: string;
    section_name: string;
    section_order: number;
    timing_settings?: {
        duration?: number;
    };
    questions?: Question[];
}

interface OrderCardProps {
    sections: Section[];
    onSave: (reorderedSections: Section[]) => Promise<void>;
    onQuestionReorder: (sectionId: string, reorderedQuestions: Question[]) => Promise<void>;
    saving?: boolean;
}

export default function OrderCard({ sections: initialSections, onSave, onQuestionReorder, saving = false }: OrderCardProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [sectionsWithQuestionChanges, setSectionsWithQuestionChanges] = useState<Set<string>>(new Set());

    // Initialize sections when prop changes
    useEffect(() => {
        if (initialSections && initialSections.length > 0) {
            const sortedSections = [...initialSections].sort((a, b) => 
                (a.section_order || 0) - (b.section_order || 0)
            );
            setSections(sortedSections);
            setActiveKeys(sortedSections.map((s) => s.section_id));
            setHasChanges(false);
            setSectionsWithQuestionChanges(new Set());
        }
    }, [initialSections]);

    const toggleCollapse = (key: string) => {
        setActiveKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const onSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = sections.findIndex((s) => s.section_id === String(active.id));
        const to = sections.findIndex((s) => s.section_id === String(over.id));
        if (from !== -1 && to !== -1) {
            const reordered = arrayMove(sections, from, to);
            setSections(reordered);
            setHasChanges(true);
        }
    };

    const onChildDragEnd = (sectionId: string) => (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        
        setSections((prev) =>
            prev.map((section) => {
                if (section.section_id !== sectionId || !section.questions) return section;
                
                // Group questions by type
                const typeGroups = groupQuestionsByType(section.questions);
                
                // Find the indices of the dragged types
                const fromIndex = typeGroups.findIndex((g) => g.formattedType === String(active.id));
                const toIndex = typeGroups.findIndex((g) => g.formattedType === String(over.id));
                
                if (fromIndex === -1 || toIndex === -1) return section;
                
                // Reorder the type groups
                const reorderedGroups = arrayMove(typeGroups, fromIndex, toIndex);
                
                // Flatten back to questions array in new order
                const reorderedQuestions: Question[] = [];
                reorderedGroups.forEach(group => {
                    reorderedQuestions.push(...group.questions);
                });
                
                return {
                        ...section,
                    questions: reorderedQuestions,
                };
            })
        );
        setSectionsWithQuestionChanges(prev => new Set(prev).add(sectionId));
    };

    const handleSave = async () => {
        try {
            // Save section order if sections were reordered
            if (hasChanges) {
                await onSave(sections);
            }
            
            // Save question order for each section that had question changes
            for (const sectionId of sectionsWithQuestionChanges) {
                const section = sections.find(s => s.section_id === sectionId);
                if (section?.questions && Array.isArray(section.questions)) {
                    await onQuestionReorder(sectionId, section.questions);
                }
            }
            
            setHasChanges(false);
            setSectionsWithQuestionChanges(new Set());
            message.success("Order updated successfully!");
        } catch {
            message.error("Failed to update order");
        }
    };

    const formatQuestionType = (typeId: string) => {
        if (!typeId) return 'Question';
        
        // Map question_type_id to display names
        const typeIdMap: Record<string, string> = {
            'qt_001': 'Single Choice',
            'qt_002': 'Multiple Choice',
            'qt_003': 'True/False',
            'qt_004': 'Fill in the Blanks',
            'qt_006': 'Essay',
            'qt_007': 'Coding',
            'qt_008': 'Video Response',
            'qt_009': 'Audio-Video Response',
            'qt_010': 'Matching',
            'qt_011': 'Project-Based Assessment',
            'qt_012': 'Case Study',
            'qt_013': 'Simulation',
            'qt_014': 'Ranking',
            'qt_015': 'Drag and Drop',
            'qt_016': 'Hotspot',
            'qt_017': 'Cognitive Ability Test',
            'qt_018': 'Situational Judgment',
            'qt_019': 'Response Time Test',
            'qt_020': 'Pattern Recognition',
            'qt_021': 'Memory Recall',
            'qt_022': 'Audio Response',
        };

        return typeIdMap[typeId] || typeId;
    };

    const groupQuestionsByType = (questions: Question[]): QuestionTypeGroup[] => {
        const groupMap = new Map<string, QuestionTypeGroup>();
        
        questions.forEach(question => {
            // Use question_type_id instead of question_type
            const typeId = question.question_type_id || question.question_type;
            const formattedType = formatQuestionType(typeId);
            
            if (!groupMap.has(formattedType)) {
                groupMap.set(formattedType, {
                    type: typeId,
                    formattedType: formattedType,
                    count: 0,
                    totalDuration: 0,
                    questions: [],
                });
            }
            
            const group = groupMap.get(formattedType)!;
            group.count++;
            group.questions.push(question);
            
            const duration = question.time_limit ? Number(question.time_limit) : (question.duration || 0);
            group.totalDuration += duration;
        });
        
        return Array.from(groupMap.values());
    };

    const formatDuration = (duration?: number) => {
        if (!duration) return "0 mins";
        return `${duration} mins`;
    };

    const getTotalQuestionTypes = () => {
        const uniqueTypes = new Set<string>();
        sections.forEach(section => {
            if (section.questions && Array.isArray(section.questions)) {
                section.questions.forEach(q => {
                    // Use question_type_id to identify unique question types
                    const typeId = q.question_type_id || q.question_type;
                    if (typeId) {
                        // Format and add the type to get unique formatted types
                        const formattedType = formatQuestionType(typeId);
                        uniqueTypes.add(formattedType);
                    }
                });
            }
        });
        return uniqueTypes.size;
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                        <img
                            src={`${import.meta.env.BASE_URL}question-setting/list-bullets.svg`}
                            className="w-5 h-5"
                            alt="Order"
                            style={{ filter: 'brightness(0) invert(1)' }}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    Section & Question Type Order
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Rearrange the order of sections and question types to control the test flow and improve the candidate experience.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
                        </span>
                        <div className="w-px h-4" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {getTotalQuestionTypes()} Question types
                        </span>
                                </div>
                    <Button
                        type="primary"
                        onClick={handleSave}
                        disabled={(!hasChanges && sectionsWithQuestionChanges.size === 0) || saving}
                        loading={saving}
                        className="!h-10 !rounded-lg !px-6"
                            style={{
                            backgroundColor: (hasChanges || sectionsWithQuestionChanges.size > 0) && !saving ? "var(--accent-primary)" : undefined,
                            opacity: (!hasChanges && sectionsWithQuestionChanges.size === 0) || saving ? 0.5 : 1,
                        }}
                    >
                        Save Order
                    </Button>
                </div>
            </div>

            {/* Sections List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                <SortableContext items={sections.map((s) => s.section_id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {sections.map((section, index) => (
                            <SortableItem key={section.section_id} id={section.section_id}>
                                <div 
                                    className="rounded-xl p-4 transition-all duration-200" 
                                    style={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        border: '1px solid var(--border-primary)' 
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="cursor-grab active:cursor-grabbing" onPointerDown={(e) => e.stopPropagation()}>
                                                    <img
                                                        src="/common/dots-six-vertical.svg"
                                                        alt="drag"
                                                    className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity"
                                                        style={{ filter: 'var(--icon-filter)' }}
                                                    />
                                            </div>
                                            <div 
                                                className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                                                onClick={() => toggleCollapse(section.section_id)}
                                            >
                                                <div>
                                                    <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                                                        {section.section_name}
                                                    </div>
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ 
                                                        backgroundColor: 'rgba(124, 58, 237, 0.15)', 
                                                        color: '#a78bfa',
                                                        border: '1px solid rgba(124, 58, 237, 0.3)'
                                                    }}>
                                                        Section {index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div 
                                            className="flex items-center gap-3 cursor-pointer select-none"
                                            onClick={() => toggleCollapse(section.section_id)}
                                        >
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                {formatDuration(section.timing_settings?.duration)}
                                            </span>
                                            {activeKeys.includes(section.section_id) ? (
                                                <CaretUpOutlined className="text-base" style={{ color: 'var(--text-primary)' }} />
                                            ) : (
                                                <CaretDownOutlined className="text-base" style={{ color: 'var(--text-primary)' }} />
                                            )}
                                        </div>
                                    </div>

                                    {activeKeys.includes(section.section_id) && section.questions && Array.isArray(section.questions) && section.questions.length > 0 && (() => {
                                        const questionTypeGroups = groupQuestionsByType(section.questions);
                                        
                                        return (
                                            <DndContext collisionDetection={closestCenter} onDragEnd={onChildDragEnd(section.section_id)}>
                                                <SortableContext items={questionTypeGroups.map((g) => g.formattedType)} strategy={verticalListSortingStrategy}>
                                                    <div className="pt-3 flex flex-col gap-2 ml-7">
                                                        {questionTypeGroups.map((group) => (
                                                            <SortableItem key={group.formattedType} id={group.formattedType}>
                                                                <div 
                                                                    className="rounded-lg px-4 py-3 transition-all duration-200 hover:bg-opacity-80" 
                                                                    style={{ 
                                                                        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                                                                        border: '1px solid var(--border-primary)' 
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="cursor-grab active:cursor-grabbing" onPointerDown={(e) => e.stopPropagation()}>
                                                                                <img
                                                                                    src="/common/dots-six-vertical.svg"
                                                                                    alt="drag"
                                                                                    className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity"
                                                                                    style={{ filter: 'var(--icon-filter)' }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                    {group.formattedType}
                                                                                </span>
                                                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                                                                                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                                                                                    color: 'var(--text-secondary)'
                                                                                }}>
                                                                                    {group.count} {group.count === 1 ? 'question' : 'questions'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                                            {formatDuration(group.totalDuration)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                        </SortableItem>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                        );
                                    })()}
                                </div>
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
