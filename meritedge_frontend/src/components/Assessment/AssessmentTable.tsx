/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Dropdown,
  Table,
  TableColumnsType,
  Tooltip,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  CopyOutlined,
  DeleteOutlined,
  UserAddOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { TestDataType, ApiResponse } from "./types";

interface AssessmentTableProps {
  columns: TableColumnsType<TestDataType>;
  assessments: TestDataType[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalAssessments: number;
  retryCount: number;
  maxRetries: number;
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  onPageChange: (page: number, newSize?: number) => void;
  onRetry: () => void;
  onCloseCustomDateDropdown: () => void;
  fetchAssessments: (page: number, size: number, resetData: boolean) => void;
  isDesktopView: boolean;
}

export default function AssessmentTable({
  columns,
  assessments,
  loading,
  currentPage,
  pageSize,
  totalAssessments,
  retryCount,
  maxRetries,
  onTableChange,
  onPageChange,
  onRetry,
  onCloseCustomDateDropdown,
  fetchAssessments,
  isDesktopView,
}: AssessmentTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [tableScrollHeight, setTableScrollHeight] = useState<string | undefined>(undefined);
  const animationFrameRef = useRef<number | null>(null);
  const lastCalculatedHeight = useRef<number | null>(null);

  const updateScrollHeight = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (tableContainerRef.current && tableWrapperRef.current) {
        // Use viewport height to ensure table fits the screen
        const viewportHeight = window.innerHeight;
        
        // Get container height, but prefer viewport-based calculation for better fit
        const containerHeight = tableContainerRef.current.clientHeight;
        
        // Calculate available height based on viewport
        // Account for header, filters, and other UI elements (approximately 250-300px)
        const topOffset = 250; // Approximate space for header, title, filters
        const bottomOffset = 100; // Space for pagination and padding
        
        // Measure pagination height
        const paginationElement = tableWrapperRef.current.querySelector(".ant-pagination");
        let paginationHeight = 80;
        if (paginationElement) {
          const paginationRect = paginationElement.getBoundingClientRect();
          const paginationStyle = window.getComputedStyle(paginationElement);
          const marginTop = parseInt(paginationStyle.marginTop, 10) || 12;
          const marginBottom = parseInt(paginationStyle.marginBottom, 10) || 8;
          const paddingBottom = parseInt(paginationStyle.paddingBottom, 10) || 8;
          paginationHeight = paginationRect.height + marginTop + marginBottom + paddingBottom + 10;
        } else {
          paginationHeight = window.innerWidth < 640 ? 85 : 95;
        }

        // Measure header height
        const headerElement = tableWrapperRef.current.querySelector(".ant-table-header") || tableWrapperRef.current.querySelector(".ant-table-thead");
        let headerHeight = 64;
        if (headerElement) {
          const headerRect = headerElement.getBoundingClientRect();
          const headerStyle = window.getComputedStyle(headerElement);
          const headerMarginTop = parseInt(headerStyle.marginTop, 10) || 0;
          const headerMarginBottom = parseInt(headerStyle.marginBottom, 10) || 0;
          headerHeight = headerRect.height + headerMarginTop + headerMarginBottom + 8;
        } else {
          headerHeight = window.innerWidth < 640 ? 72 : 64;
        }

        // Calculate height based on viewport for better screen fit
        const viewportBasedHeight = viewportHeight - topOffset - bottomOffset;
        
        // Also calculate based on container
        const reservedHeight = paginationHeight + headerHeight + 12;
        const containerBasedHeight = containerHeight - reservedHeight;
        
        // Use the larger of the two, but ensure it's reasonable
        const calculatedHeight = Math.max(viewportBasedHeight, containerBasedHeight);
        
        // Ensure minimum height for good UX, but allow it to fill screen
        const minHeight = 400;
        const maxHeight = viewportHeight - topOffset - bottomOffset; // Don't exceed viewport
        const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
        
        if (finalHeight !== lastCalculatedHeight.current) {
          setTableScrollHeight(`${finalHeight}px`);
          lastCalculatedHeight.current = finalHeight;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (isDesktopView) {
      updateScrollHeight();

      const resizeObserver = new ResizeObserver(() => {
        updateScrollHeight();
      });

      if (tableContainerRef.current) {
        resizeObserver.observe(tableContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setTableScrollHeight(undefined);
    }
  }, [isDesktopView, updateScrollHeight]);

  // Recalculate height when assessments or pageSize changes to ensure proper fit
  useEffect(() => {
    if (isDesktopView) {
      // Delay to ensure pagination is rendered
      const timeout = setTimeout(() => {
        updateScrollHeight();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [assessments, pageSize, totalAssessments, currentPage, isDesktopView, updateScrollHeight]);

  // Prevent typing in page size selector
  useEffect(() => {
    const makeInputsReadOnly = () => {
      // Find all inputs in pagination options and make them readOnly
      const paginationOptions = document.querySelector('.ant-pagination-options');
      if (paginationOptions) {
        const inputs = paginationOptions.querySelectorAll('input');
        inputs.forEach((input) => {
          input.setAttribute('readonly', 'true');
          input.setAttribute('readOnly', 'true');
          (input as HTMLInputElement).readOnly = true;
        });
      }
    };

    // Run immediately
    makeInputsReadOnly();

    // Watch for new inputs being added (when dropdown opens)
    const observer = new MutationObserver(() => {
      makeInputsReadOnly();
    });

    // Observe the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const preventTyping = (e: KeyboardEvent | Event) => {
      const target = e.target as HTMLElement;
      // Check if the input is specifically the page size selector in pagination
      const paginationOptions = target.closest('.ant-pagination-options');
      if (paginationOptions) {
        const select = paginationOptions.querySelector('.ant-select');
        if (select && target.closest('.ant-select')) {
          const input = target as HTMLInputElement;
          // Check if it's the page size selector (not search or other inputs)
          if (input.tagName === 'INPUT' || input.isContentEditable) {
            // Allow Escape to close dropdown, Arrow keys for navigation, Enter to select
            const key = (e as KeyboardEvent).key;
            const allowedKeys = ['Escape', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'];
            if (!allowedKeys.includes(key)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          }
        }
      }
    };

    // Prevent typing on keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      preventTyping(e);
    };

    // Prevent paste
    const handlePaste = (e: ClipboardEvent) => {
      preventTyping(e);
    };

    // Prevent input events
    const handleInput = (e: Event) => {
      preventTyping(e);
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('input', handleInput, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('input', handleInput, true);
    };
  }, []);

  return (
    <>
      <style>{`
        .ant-pagination-options .ant-select-selector input {
          pointer-events: none !important;
          cursor: default !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          caret-color: transparent !important;
        }
        .ant-pagination-options .ant-select-selector {
          cursor: pointer !important;
        }
        .ant-pagination-options .ant-select-selection-search-input {
          pointer-events: none !important;
          cursor: default !important;
          caret-color: transparent !important;
        }
        .ant-pagination-options .ant-select-selection-item {
          pointer-events: none !important;
        }
        .ant-pagination-options .ant-select-selection-search {
          pointer-events: none !important;
        }
      `}</style>
      <div
        ref={tableContainerRef}
        className="-mx-3 sm:mx-0"
        style={{
          marginLeft: "0",
          marginRight: "0",
          height: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          position: "relative",
          ...(pageSize <= 15 ? {
            width: "100%",
          } : {}),
        }}
      >
      <div
        ref={tableWrapperRef}
        style={{
          flex: 1,
          overflow: "visible",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
            maxHeight: "100%",
          }}
        >
          <Table
            columns={columns}
            dataSource={assessments}
            loading={loading}
            onChange={onTableChange}
            locale={{
              emptyText: (
                <div className="text-center py-6 sm:py-8">
                  <p
                    className="text-base sm:text-lg mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No assessments found
                  </p>
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Try adjusting your search or filters
                  </p>
                  {retryCount > 0 && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={onRetry}
                      className="mt-3 sm:mt-4"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ),
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalAssessments,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "30", "50"],
              showTotal: (total, range) =>
                window.innerWidth >= 640
                  ? `${range[0]}-${range[1]} of ${total} items`
                  : `${range[0]}-${range[1]}`,
              onChange: (page, newSize) => {
                onCloseCustomDateDropdown();
                onPageChange(page, newSize);
              },
              onShowSizeChange: () => {
                // Allow size changes only from dropdown selection
                // This prevents manual input
              },
              itemRender: (page, type, originalElement) => {
                if (type === "prev") {
                  const newPage = currentPage > 1 ? currentPage - 1 : 1;
                  return (
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (newPage !== currentPage) {
                          onPageChange(newPage);
                        }
                      }}
                      style={{
                        cursor: newPage !== currentPage ? "pointer" : "not-allowed",
                        pointerEvents: "auto",
                      }}
                    >
                      {originalElement}
                    </a>
                  );
                }
                if (type === "next") {
                  const totalPages = Math.ceil(totalAssessments / pageSize);
                  const newPage =
                    currentPage < totalPages ? currentPage + 1 : currentPage;
                  return (
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (newPage !== currentPage && newPage <= totalPages) {
                          onPageChange(newPage);
                        }
                      }}
                      style={{
                        cursor: newPage !== currentPage && newPage <= totalPages ? "pointer" : "not-allowed",
                        pointerEvents: "auto",
                      }}
                    >
                      {originalElement}
                    </a>
                  );
                }
                return originalElement;
              },
              showLessItems: true,
              showQuickJumper: false,
              disabled: false,
              hideOnSinglePage: false,
              style: {
                marginTop: "12px",
                marginBottom: "8px",
                textAlign: "center",
                paddingBottom: "8px",
              },
              className: "flex-wrap",
              simple: window.innerWidth < 640,
            }}
            scroll={
              isDesktopView && tableScrollHeight
                ? { x: pageSize <= 15 ? "max-content" : 1200, y: tableScrollHeight }
                : { x: pageSize <= 15 ? "max-content" : 1200, y: tableScrollHeight || undefined }
            }
            size="small"
            className="dark-table"
            style={{
              backgroundColor: "var(--bg-secondary)",
              width: "100%",
              margin: "0",
              padding: "0",
              ...(pageSize <= 15 ? {
                maxWidth: "100%",
              } : {}),
            }}
            onRow={(record) => ({
              onClick: () => {
                console.log("Row clicked:", record);
              },
              style: { cursor: "pointer" },
            })}
          />
        </div>
      </div>
    </div>
    </>
  );
}

export function createTableColumns(
  currentPage: number,
  pageSize: number,
  apiData: ApiResponse | null,
  navigate: any,
  openInviteCandidateModal: (assessmentId: string) => void,
  handleCloneAssessment: (record: TestDataType) => void,
  handleDeleteAssessment: (record: TestDataType) => void,
  handleAddCollaborators: (record: TestDataType) => void,
  handleEditAssessment: (record: TestDataType) => void,
  handleViewAssessment: (record: TestDataType) => void,
  handleExtendAssessment: (record: TestDataType) => void,
  sortedInfo?: any,
  isDesktopView: boolean = true
): TableColumnsType<TestDataType> {
  return [
    {
      title: "#",
      key: "serialNumber",
      width: 80,
      fixed: isDesktopView ? ("left" as const) : undefined,
      render: (_: any, __: any, index: number) => {
        const serialNumber = (currentPage - 1) * pageSize + index + 1;
        return (
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            {serialNumber}
          </span>
        );
      },
    },
    {
      title: "Assessment Name",
      dataIndex: "name",
      key: "name",
      width: 280,
      sorter: true,
      sortOrder:
        sortedInfo?.columnKey === "name" || sortedInfo?.field === "name"
          ? sortedInfo?.order
          : null,
      render: (text, record) => (
        <span
          style={{
            color: "var(--text-primary)",
            fontSize: "16px",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/assessment-dashboard/${record.key}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Section",
      dataIndex: "sections",
      key: "sections",
      width: 110,
      align: "center" as const,
      render: (text) => (
        <span
          style={{
            color: "var(--text-primary)",
            fontSize: "16px",
            display: "block",
            textAlign: "center",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Experience",
      key: "experience",
      width: 120,
      align: "center" as const,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        const experience = assessment?.target_experience || "--";
        return (
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "16px",
              display: "block",
              textAlign: "center",
            }}
          >
            {experience}
          </span>
        );
      },
    },
    {
      title: "Invite Stats",
      key: "invitedVsAttempted",
      width: 150,
      align: "center" as const,
      render: (_, record) => (
        <Tooltip title="Invited vs Attempted">
          <span
            style={{
              color: "var(--accent-primary)",
              fontSize: "16px",
              cursor: "pointer",
              textDecoration: "underline",
              display: "block",
              textAlign: "center",
            }}
            onClick={() => navigate(`/reports?assessment_id=${record.key}`)}
          >
            {record.invited || 0} / {record.taken || 0}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Published on",
      key: "inviteStart",
      width: 150,
      sorter: true,
      sortOrder:
        sortedInfo?.columnKey === "inviteStart" ||
        sortedInfo?.field === "inviteStart"
          ? sortedInfo?.order
          : null,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        const isDraft = record.status === "Draft";
        return (
          <span style={{ color: "var(--text-primary)", fontSize: "16px" }}>
            {assessment?.settings?.invite_start_date
              ? new Date(
                  assessment.settings.invite_start_date
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : isDraft ? "NA" : "--"}
          </span>
        );
      },
    },
    {
      title: "Expires on",
      key: "inviteEnd",
      width: 150,
      sorter: true,
      sortOrder:
        sortedInfo?.columnKey === "inviteEnd" ||
        sortedInfo?.field === "inviteEnd"
          ? sortedInfo?.order
          : null,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        const isDraft = record.status === "Draft";
        return (
          <span style={{ color: "var(--text-primary)", fontSize: "16px" }}>
            {assessment?.settings?.invite_end_date
              ? new Date(
                  assessment.settings.invite_end_date
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : isDraft ? "NA" : "--"}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        let color = "";
        switch (status) {
          case "Draft":
            color = "#fdba74";
            break;
          case "Active":
            color = "#4ade80";
            break;
          case "Inactive":
            color = "#9ca3af";
            break;
          default:
            color = "var(--text-primary)";
        }
        return (
          <Badge
            color={`${color}`}
            text={<span style={{ fontSize: "16px" }}>{status}</span>}
          />
        );
      },
    },
    {
      title: "Invitation",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Button
          type="primary"
          icon={
            <img
              src={`${import.meta.env.BASE_URL}cognitive/user-plus.svg`}
              className="w-[14px]"
              alt="Invite"
            />
          }
          size="small"
          disabled={record.status !== "Active"}
          style={{
            backgroundColor: record.status === "Active" ? "#5B21B6" : "#6B7280",
            borderRadius: "6px",
            fontSize: "12px",
            height: "28px",
            opacity: record.status === "Active" ? 1 : 0.5,
            borderColor: record.status === "Active" ? "#5B21B6" : "#6B7280",
            color: "#ffffff",
          }}
          onMouseEnter={(e) => {
            if (record.status === "Active") {
              e.currentTarget.style.backgroundColor = "#4C1D95";
            }
          }}
          onMouseLeave={(e) => {
            if (record.status === "Active") {
              e.currentTarget.style.backgroundColor = "#5B21B6";
            }
          }}
          onClick={() => openInviteCandidateModal(record.key as string)}
        >
          Invite
        </Button>
      ),
    },
    {
      title: "Action",
      key: "more",
      width: 80,
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "clone",
            icon: <CopyOutlined />,
            label: "Clone",
            onClick: () => handleCloneAssessment(record),
            disabled: false,
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete",
            onClick: () => handleDeleteAssessment(record),
            disabled: record.status === "Active",
          },
          {
            key: "add_collaborators",
            icon: <UserAddOutlined />,
            label: "Add Collaborators",
            onClick: () => handleAddCollaborators(record),
            disabled: true,
          },
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => handleEditAssessment(record),
            disabled: record.status === "Active",
          },
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "View",
            onClick: () => handleViewAssessment(record),
          },
          {
            key: "extend",
            icon: <CalendarOutlined />,
            label: "Extend",
            onClick: () => handleExtendAssessment(record),
            disabled: true,
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ color: "var(--text-primary)", minWidth: "32px" }}
              className="hover:!text-[#7C3AED]"
            />
          </Dropdown>
        );
      },
    },
  ];
}
