/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Typography,
    Button,
    Divider,
    Tooltip,
    message,
} from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
    UndoOutlined,
    RedoOutlined,
    LinkOutlined,
    PictureOutlined,
    BgColorsOutlined,
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    StrikethroughOutlined,
    OrderedListOutlined,
    UnorderedListOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined,
    ClearOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface EssayQuestionProps {
    question: any;
    onAnswerChange?: (answer: string) => void;
    initialAnswer?: string;
}

export default function EssayQuestion({ question, onAnswerChange, initialAnswer }: EssayQuestionProps) {
    const editorExtensions = useMemo(
        () => [
            StarterKit.configure({ heading: false }),
            Heading.configure({ levels: [1, 2, 3] }),
            Underline,
            TextStyle,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-[#7C3AED] underline hover:text-[#A78BFA]",
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-md shadow-lg mt-3",
                },
            }),
            Placeholder.configure({
                placeholder:
                    "Type your answer here...\n\n• Be clear and detailed in your explanation\n• Structure your answer with proper paragraphs\n• Include examples where applicable\n• Review your answer before submitting",
            }),
            CharacterCount.configure(),
        ],
        []
    );

    const editor = useEditor({
        extensions: editorExtensions,
        content: "",
        autofocus: true,
        editorProps: {
            attributes: {
                class:
                    "min-h-[280px] prose prose-invert max-w-none focus:outline-none p-4 bg-transparent",
                style: "font-size:14px; line-height:1.7;",
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const questionId = question?.question_id || question?.id || "";
            
            // CRITICAL: Extract text content FIRST and check if it's the questionId
            // This is the PRIMARY check - if textContent is questionId, BLOCK EVERYTHING
            const textContent = html.replace(/<[^>]*>/g, '').trim();
            
            // AGGRESSIVE BLOCK: If textContent matches questionId in ANY way, completely block it
            if (textContent === questionId) {
                console.error("🚫 BLOCKED: Text content is questionId, clearing editor and NOT calling onAnswerChange. QuestionId:", questionId);
                // Immediately clear the editor
                setTimeout(() => {
                    if (editor && !editor.isEmpty) {
                        const currentHtml = editor.getHTML();
                        const currentText = currentHtml.replace(/<[^>]*>/g, '').trim();
                        if (currentText === questionId) {
                            editor.commands.clearContent();
                            console.log("✅ Cleared editor content that contained questionId");
                        }
                    }
                }, 0);
                return; // DO NOT call onAnswerChange - COMPLETE BLOCK
            }
            
            // Additional check: if HTML contains questionId as the only meaningful content
            if (html.includes(questionId) && textContent === questionId) {
                console.error("🚫 BLOCKED: HTML contains only questionId, clearing editor");
                setTimeout(() => {
                    if (editor && !editor.isEmpty) {
                        editor.commands.clearContent();
                    }
                }, 0);
                return; // DO NOT call onAnswerChange
            }
            
            // Check if HTML is just the questionId with minimal tags
            if (html.includes(questionId) && textContent === questionId) {
                console.error("🚫 BLOCKED: HTML is just questionId, clearing editor");
                setTimeout(() => {
                    if (editor && !editor.isEmpty) {
                        editor.commands.clearContent();
                    }
                }, 0);
                return; // DO NOT call onAnswerChange
            }
            
            // Only proceed if textContent is NOT the questionId and has actual content
            if (onAnswerChange && textContent !== questionId && textContent.length > 0) {
                console.log("✅ VALID CONTENT: Calling onAnswerChange - HTML length:", html.length, "Text length:", textContent.length, "Text preview:", textContent.substring(0, 50));
                onAnswerChange(html);
            } else if (textContent === questionId) {
                console.error("🚫 FINAL BLOCK: Text content is questionId, NOT calling onAnswerChange");
                setTimeout(() => {
                    if (editor && !editor.isEmpty) {
                        editor.commands.clearContent();
                    }
                }, 0);
            } else {
                console.log("📝 Skipping onAnswerChange - empty or invalid content. Text length:", textContent.length);
            }
        },
    });

    const hasInitializedRef = useRef<boolean>(false);
    const lastQuestionIdRef = useRef<string | null>(null);
    const lastAppliedContentRef = useRef<string | null>(null);
    const userHasTypedRef = useRef<boolean>(false);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const questionId = question?.question_id || question?.id || "";
        const isNewQuestion = questionId && questionId !== lastQuestionIdRef.current;

        // Helper function to check if a string looks like a hash (UUID, hash, etc.)
        const looksLikeHash = (str: string): boolean => {
            if (!str || typeof str !== 'string') return false;
            // Check for UUID pattern (e.g., "9459795c-a678-4f00-906b-ea5b77da4ed4")
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            // Check for other hash patterns (long alphanumeric strings without spaces)
            const hashPattern = /^[0-9a-f]{20,}$/i;
            const noSpaces = !/\s/.test(str);
            const isLong = str.length > 20;
            
            return uuidPattern.test(str) || (hashPattern.test(str) && noSpaces && isLong);
        };

        // Prioritize initialAnswer prop (from questionAnswers state) over question's candidate_answer
        // Only use question fields if initialAnswer is null/undefined AND it doesn't look like a hash
        // IMPORTANT: Reject "True" or "False" - those are for True/False questions, not essays
        // CRITICAL: Reject questionId - it should never be used as content
        let initialContent: string;
        if (initialAnswer !== undefined && initialAnswer !== null && typeof initialAnswer === 'string') {
            // CRITICAL: Reject questionId - it should never be used as content
            if (initialAnswer === questionId) {
                console.error("❌ EssayQuestion: initialAnswer is same as questionId, rejecting:", questionId);
                // Use default empty content
                initialContent = "<p></p>";
            }
            // Reject "True" or "False" for essay questions
            else if (initialAnswer === 'True' || initialAnswer === 'False') {
                // Don't use this - it's the wrong answer type
                // Check question fields instead
                const candidateAnswer = question?.candidate_answer_html ?? question?.candidate_answer;
                if (candidateAnswer && !looksLikeHash(candidateAnswer) && candidateAnswer !== 'True' && candidateAnswer !== 'False' && candidateAnswer !== questionId) {
                    initialContent = candidateAnswer;
                } else {
                    initialContent = question?.default_answer ?? "<p></p>";
                }
            } else if (!looksLikeHash(initialAnswer)) {
                // Use initialAnswer if it's provided and doesn't look like a hash
                // Double-check it's not the questionId
                if (initialAnswer !== questionId) {
                    initialContent = initialAnswer;
                } else {
                    console.error("❌ EssayQuestion: initialAnswer matches questionId after hash check, rejecting:", questionId);
                    initialContent = "<p></p>";
                }
            } else {
                // If initialAnswer is a hash, ignore it and check question fields
                const candidateAnswer = question?.candidate_answer_html ?? question?.candidate_answer;
                if (candidateAnswer && !looksLikeHash(candidateAnswer) && candidateAnswer !== 'True' && candidateAnswer !== 'False' && candidateAnswer !== questionId) {
                    initialContent = candidateAnswer;
                } else {
                    initialContent = question?.default_answer ?? "<p></p>";
                }
            }
        } else {
            // initialAnswer is null/undefined, check question fields but skip hashes and "True"/"False"
            const candidateAnswer = question?.candidate_answer_html ?? question?.candidate_answer;
            if (candidateAnswer && !looksLikeHash(candidateAnswer) && candidateAnswer !== 'True' && candidateAnswer !== 'False' && candidateAnswer !== questionId) {
                initialContent = candidateAnswer;
            } else {
                initialContent = question?.default_answer ?? "<p></p>";
            }
        }
        
        // FINAL VALIDATION: Ensure initialContent is not the questionId
        // This is a safety check before setting content in the editor
        let initialText = initialContent.replace(/<[^>]*>/g, '').trim();
        if (initialText === questionId) {
            console.error("❌ EssayQuestion: initialContent text matches questionId, resetting to empty:", questionId);
            initialContent = "<p></p>";
            initialText = ""; // Reset initialText as well
        }

        // Get current editor content to compare
        const currentEditorContent = editor.getHTML();
        const currentText = currentEditorContent.replace(/<[^>]*>/g, '').trim();
        // initialText is already defined above

        // CRITICAL: Final validation before setting content - ensure initialContent is not the questionId
        // Check both the HTML and the text content
        const initialTextCheck = initialContent.replace(/<[^>]*>/g, '').trim();
        if (initialTextCheck === questionId || initialContent === questionId) {
            console.error("❌ EssayQuestion: BLOCKED - initialContent is questionId, resetting to empty. QuestionId:", questionId);
            initialContent = "<p></p>";
            // Also clear the editor if it has the questionId
            if (editor && !editor.isEmpty) {
                const currentContent = editor.getHTML();
                const currentText = currentContent.replace(/<[^>]*>/g, '').trim();
                if (currentText === questionId) {
                    console.error("❌ EssayQuestion: Clearing editor content that contains questionId");
                    editor.commands.clearContent();
                }
            }
        }
        
        // Only apply content if:
        // 1. It's a new question (different question_id) - always load
        // 2. Editor hasn't been initialized yet and is empty - load initial content
        // 3. Editor is empty but we have saved content - load it
        // 4. Editor has different content than what's saved - update it (user came back to question)
        if (isNewQuestion) {
            // New question - always load the initial content
            lastQuestionIdRef.current = questionId;
            hasInitializedRef.current = true;
            userHasTypedRef.current = false;
            
            // Final check before setting content
            const finalText = initialContent.replace(/<[^>]*>/g, '').trim();
            if (finalText === questionId) {
                console.error("❌ EssayQuestion: Blocked setting questionId in new question, using empty content");
                editor.commands.setContent("<p></p>", false);
                lastAppliedContentRef.current = "<p></p>";
            } else if (initialText.length > 0) {
                editor.commands.setContent(initialContent, false);
                lastAppliedContentRef.current = initialContent;
            } else {
                editor.commands.setContent("<p></p>", false);
                lastAppliedContentRef.current = "<p></p>";
            }
            editor.commands.focus("end");
        } else if (!hasInitializedRef.current && editor.isEmpty) {
            // First time loading this question - load initial content
            hasInitializedRef.current = true;
            const finalText = initialContent.replace(/<[^>]*>/g, '').trim();
            if (finalText === questionId) {
                console.error("❌ EssayQuestion: Blocked setting questionId in initialization, using empty content");
                // Don't set content if it's the questionId
            } else if (initialText.length > 0) {
                editor.commands.setContent(initialContent, false);
                lastAppliedContentRef.current = initialContent;
            }
        } else if (editor.isEmpty && initialText.length > 0) {
            // Editor is empty but we have saved content - load it
            const finalText = initialContent.replace(/<[^>]*>/g, '').trim();
            if (finalText === questionId) {
                console.error("❌ EssayQuestion: Blocked setting questionId when editor is empty");
                // Don't set content if it's the questionId
            } else {
                editor.commands.setContent(initialContent, false);
                lastAppliedContentRef.current = initialContent;
            }
        } else if (currentText !== initialText && initialText.length > 0) {
            // User came back to question - editor has different content than saved
            // Load the saved content (what user actually typed and saved)
            const finalText = initialContent.replace(/<[^>]*>/g, '').trim();
            if (finalText === questionId) {
                console.error("❌ EssayQuestion: Blocked setting questionId when user returns to question");
                // Don't set content if it's the questionId
            } else {
                editor.commands.setContent(initialContent, false);
                lastAppliedContentRef.current = initialContent;
            }
        } else if (!isNewQuestion && initialText.length > 0 && lastAppliedContentRef.current !== initialContent) {
            // Same question but initialContent changed (e.g., answer was updated in state)
            // Load the new content
            const finalText = initialContent.replace(/<[^>]*>/g, '').trim();
            if (finalText === questionId) {
                console.error("❌ EssayQuestion: Blocked setting questionId when content changed");
                // Don't set content if it's the questionId
            } else {
                editor.commands.setContent(initialContent, false);
                lastAppliedContentRef.current = initialContent;
            }
        }
        // If editor content matches saved content, don't overwrite it
    }, [
        editor,
        question?.question_id,
        question?.id,
        initialAnswer,
        question?.candidate_answer,
        question?.candidate_answer_html,
        question?.default_answer,
    ]);

    // Track when user types to prevent overwriting
    useEffect(() => {
        if (!editor) return;
        
        const handleUpdate = () => {
            userHasTypedRef.current = true;
        };
        
        editor.on('update', handleUpdate);
        
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor]);

    const addImageFromFile = () => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) {
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                message.error("Image size should be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = (readEvent) => {
                const base64 = readEvent.target?.result as string;
                if (base64) {
                    editor.chain().focus().setImage({ src: base64 }).run();
                    message.success("Image inserted successfully");
                }
            };
            reader.onerror = () => {
                message.error("Failed to read image file");
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const addImageFromURL = () => {
        if (!editor) return;
        const url = window.prompt("Enter image URL:");
        if (!url) {
            return;
        }
        try {
            editor.chain().focus().setImage({ src: url }).run();
            message.success("Image inserted successfully");
        } catch (error) {
            console.error(error);
            message.error("Failed to insert image");
        }
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link")?.href || "";
        const url = window.prompt("Enter URL", previousUrl);
        if (url === null) {
            return;
        }
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    // Make character/word count reactive by tracking editor content changes
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        if (!editor) return;

        const updateCounts = () => {
            try {
                // Get counts from character count extension
                const words = editor.storage.characterCount?.words() ?? 0;
                const chars = editor.storage.characterCount?.characters() ?? 0;
                
                // Fallback: manually count if extension doesn't work
                let finalWords = words;
                let finalChars = chars;
                
                if (words === 0 && chars === 0) {
                    const html = editor.getHTML();
                    const text = html.replace(/<[^>]*>/g, '').trim();
                    finalChars = text.length;
                    // Simple word count: split by whitespace and filter empty strings
                    finalWords = text.split(/\s+/).filter(w => w.length > 0).length;
                }
                
                setWordCount(finalWords);
                setCharCount(finalChars);
            } catch (error) {
                console.error("Error updating counts:", error);
                // Fallback: try to get text directly
                try {
                    const html = editor.getHTML();
                    const text = html.replace(/<[^>]*>/g, '').trim();
                    setCharCount(text.length);
                    setWordCount(text.split(/\s+/).filter(w => w.length > 0).length);
                } catch (e) {
                    console.error("Fallback count failed:", e);
                }
            }
        };

        // Update counts initially
        updateCounts();

        // Update counts whenever editor content changes
        editor.on('update', updateCounts);
        editor.on('transaction', updateCounts);
        editor.on('selectionUpdate', updateCounts);
        editor.on('create', updateCounts);

        // Also update on content changes as a fallback
        const interval = setInterval(updateCounts, 200); // Update every 200ms as fallback

        return () => {
            editor.off('update', updateCounts);
            editor.off('transaction', updateCounts);
            editor.off('selectionUpdate', updateCounts);
            editor.off('create', updateCounts);
            clearInterval(interval);
        };
    }, [editor]);

    const EditorToolbar = () => {
        if (!editor) return null;

        const toggleMark = (mark: string) => {
            editor.chain().focus().toggleMark(mark).run();
        };

        const align = (alignment: "left" | "center" | "right" | "justify") => {
            editor.chain().focus().setTextAlign(alignment).run();
        };

        const clearFormatting = () => {
            editor.chain().focus().unsetAllMarks().clearNodes().run();
        };

        return (
            <div className="flex flex-wrap items-center gap-1 border-b border-[#21252d] bg-[#14161c] px-2 py-2">
                <Tooltip title="Undo (Ctrl+Z)">
                    <Button
                        type="text"
                        size="small"
                        icon={<UndoOutlined />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            editor.chain().focus().undo().run();
                        }}
                        disabled={!editor.can().undo()}
                        className="hover:!text-[#7C3AED] disabled:!opacity-30"
                    />
                </Tooltip>

                <Tooltip title="Redo (Ctrl+Y)">
                    <Button
                        type="text"
                        size="small"
                        icon={<RedoOutlined />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            editor.chain().focus().redo().run();
                        }}
                        disabled={!editor.can().redo()}
                        className="hover:!text-[#7C3AED] disabled:!opacity-30"
                    />
                </Tooltip>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                {([1, 2, 3] as const).map((level) => (
                    <Tooltip key={level} title={`Heading ${level}`}>
                        <Button
                            type="text"
                            size="small"
                            className={`hover:!text-[#7C3AED] ${
                                editor.isActive("heading", { level }) ? "!text-[#7C3AED]" : ""
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                                event.preventDefault();
                                editor.chain().focus().toggleHeading({ level }).run();
                            }}
                        >
                            {`H${level}`}
                        </Button>
                    </Tooltip>
                ))}

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Tooltip title="Bold (Ctrl+B)">
                    <Button
                        type="text"
                        size="small"
                        icon={<BoldOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("bold") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            toggleMark("bold");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Italic (Ctrl+I)">
                    <Button
                        type="text"
                        size="small"
                        icon={<ItalicOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("italic") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            toggleMark("italic");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Underline (Ctrl+U)">
                    <Button
                        type="text"
                        size="small"
                        icon={<UnderlineOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("underline") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            toggleMark("underline");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Strikethrough">
                    <Button
                        type="text"
                        size="small"
                        icon={<StrikethroughOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("strike") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            toggleMark("strike");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Highlight">
                    <Button
                        type="text"
                        size="small"
                        icon={<BgColorsOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("highlight") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            toggleMark("highlight");
                        }}
                    />
                </Tooltip>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Tooltip title="Numbered List">
                    <Button
                        type="text"
                        size="small"
                        icon={<OrderedListOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("orderedList") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            editor.chain().focus().toggleOrderedList().run();
                        }}
                    />
                </Tooltip>
                <Tooltip title="Bullet List">
                    <Button
                        type="text"
                        size="small"
                        icon={<UnorderedListOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("bulletList") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            editor.chain().focus().toggleBulletList().run();
                        }}
                    />
                </Tooltip>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Tooltip title="Align Left">
                    <Button
                        type="text"
                        size="small"
                        icon={<AlignLeftOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive({ textAlign: "left" }) ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            align("left");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Align Center">
                    <Button
                        type="text"
                        size="small"
                        icon={<AlignCenterOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive({ textAlign: "center" }) ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            align("center");
                        }}
                    />
                </Tooltip>
                <Tooltip title="Align Right">
                    <Button
                        type="text"
                        size="small"
                        icon={<AlignRightOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive({ textAlign: "right" }) ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            align("right");
                        }}
                    />
                </Tooltip>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Tooltip title="Insert / Edit Link">
                    <Button
                        type="text"
                        size="small"
                        icon={<LinkOutlined />}
                        className={`hover:!text-[#7C3AED] ${
                            editor.isActive("link") ? "!text-[#7C3AED]" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            setLink();
                        }}
                    />
                </Tooltip>
                <Tooltip title="Insert Image (Upload)">
                    <Button
                        type="text"
                        size="small"
                        icon={<PictureOutlined />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            addImageFromFile();
                        }}
                    />
                </Tooltip>
                <Tooltip title="Insert Image (URL)">
                    <Button
                        type="text"
                        size="small"
                        icon={<PictureOutlined rotate={180} />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            addImageFromURL();
                        }}
                    />
                </Tooltip>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Tooltip title="Clear Formatting">
                    <Button
                        type="text"
                        size="small"
                        icon={<ClearOutlined />}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.preventDefault();
                            clearFormatting();
                        }}
                    />
                </Tooltip>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Text className="!text-white font-semibold text-base">Your Answer:</Text>
                    <div className="flex gap-4">
                        <Text className="!text-gray-400 text-sm">
                            {wordCount} {wordCount === 1 ? "word" : "words"}
                        </Text>
                        <Text className="!text-gray-400 text-sm">
                            {charCount} {charCount === 1 ? "character" : "characters"}
                        </Text>
                    </div>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-[#21252d] bg-[#1f222a] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                    <EditorToolbar />
                    {editor ? (
                        <div
                            className="max-h-[360px] overflow-y-auto"
                            onClick={() => editor.chain().focus().run()}
                        >
                            <EditorContent editor={editor} />
                        </div>
                    ) : (
                        <div className="p-6 text-center text-sm text-white/60">
                            Loading editor...
                        </div>
                    )}
                </div>

                {wordCount > 500 && (
                    <Text className="!text-yellow-500 text-sm">
                        ⚠️ Your answer is quite long ({wordCount} words). Consider being more concise.
                    </Text>
                )}
            </div>
        </div>
    );
}

