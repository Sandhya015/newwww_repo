/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Col, Input, Row } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import CustomSelect from "../ui/CustomSelect";
import CustomDatePicker from "../ui/CustomDatePicker";

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Draft", value: "draft" },
];

interface AssessmentFiltersProps {
  searchTerm: string;
  onSearch: (value: string) => void;
  loading?: boolean;
  filters: {
    status: string;
    createdBy: string;
    timeRange: string;
    date_from: string;
    date_to: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
  isCustomDateOpen: boolean;
  onCustomDateOpenChange: (open: boolean) => void;
  customFromDate: Dayjs | null;
  customToDate: Dayjs | null;
  onCustomFromDateChange: (date: Dayjs | null) => void;
  onCustomToDateChange: (date: Dayjs | null) => void;
  onCloseCustomDateDropdown: (options?: { resetSelection?: boolean }) => void;
  onApplyCustomDate: () => void;
  onResetCustomDate: () => void;
  selectedDateRangeLabel: string;
  customDateForceCloseRef: React.MutableRefObject<boolean>;
}

export default function AssessmentFilters({
  searchTerm,
  onSearch,
  loading = false,
  filters,
  onFilterChange,
  isCustomDateOpen,
  onCustomDateOpenChange,
  customFromDate,
  customToDate,
  onCustomFromDateChange,
  onCustomToDateChange,
  onCloseCustomDateDropdown,
  onApplyCustomDate,
  onResetCustomDate,
  selectedDateRangeLabel,
  customDateForceCloseRef,
}: AssessmentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Search Bar */}
      <div className="md:min-w-[330px]">
        <Input
          placeholder="Search by assessment name"
          className="!h-10 !rounded-xl w-full"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-primary)",
          }}
          onChange={(e) => onSearch(e.target.value)}
          value={searchTerm}
          onPressEnter={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.value.trim()) {
              console.log("Searching for:", target.value);
            }
          }}
          suffix={
            loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <SearchOutlined />
            )
          }
        />
      </div>

      {/* Custom Date Filter */}
      <div style={{ minWidth: "180px", flexShrink: 0 }}>
        <CustomSelect
          placeholder={"Custom Date"}
          prefix={
            <img
              src={`${import.meta.env.BASE_URL}cognitive/calendar-slash.svg`}
              style={{ filter: "var(--icon-filter)" }}
            />
          }
          options={statusOptions}
          open={isCustomDateOpen}
          onOpenChange={(open) => {
            onCustomDateOpenChange(open);
            if (!open) {
              customDateForceCloseRef.current = false;
            }
          }}
          popupRender={() => (
            <div
              style={{
                padding: "20px",
                background: "var(--bg-secondary)",
                borderRadius: "10px",
                position: "relative",
              }}
            >
              <Button
                type="text"
                aria-label="Close"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  onCloseCustomDateDropdown({ resetSelection: true });
                }}
                icon={
                  <CloseOutlined style={{ color: "var(--text-primary)" }} />
                }
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                }}
              />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    From
                  </div>
                  <CustomDatePicker
                    value={customFromDate as any}
                    onChange={onCustomFromDateChange}
                  />
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    To
                  </div>
                  <CustomDatePicker
                    value={customToDate as any}
                    onChange={onCustomToDateChange}
                  />
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
                <Col>
                  <Button
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    onClick={onResetCustomDate}
                  >
                    Reset
                  </Button>
                </Col>
                <Col>
                  <Button
                    style={{
                      backgroundColor: "#5B21B6",
                      color: "#ffffff",
                      borderColor: "#5B21B6",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#4C1D95";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#5B21B6";
                    }}
                    onClick={onApplyCustomDate}
                  >
                    Apply
                  </Button>
                </Col>
              </Row>
            </div>
          )}
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            width: "100%",
          }}
        />
        {selectedDateRangeLabel && (
          <div
            className="mt-1 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Selected: {selectedDateRangeLabel}
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div style={{ minWidth: "160px", flexShrink: 0 }}>
        <CustomSelect
          placeholder={"Status"}
          prefix={
            <img
              src={`${import.meta.env.BASE_URL}cognitive/calendar-slash.svg`}
              style={{ filter: "var(--icon-filter)" }}
            />
          }
          options={statusOptions}
          selectedBg="var(--bg-secondary)"
          onChange={(value) => {
            // When "All Statuses" is selected (value is ""), it means show all - keep empty string
            // When other options are selected, use their value
            onFilterChange("status", value || "");
          }}
          value={
            filters.status === "" ? undefined : filters.status || undefined
          }
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}
