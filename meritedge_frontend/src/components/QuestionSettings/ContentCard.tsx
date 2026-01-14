/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Input,
  Row,
  Slider,
  Tabs,
  Typography,
  DatePicker,
  InputNumber,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AddCustomFieldModal from "./AddCustomFieldModal";
import { useSelector } from "react-redux";
import { selectCurrentAssessment } from "../../store/miscSlice";
import {
  getAssessment,
  getAssessmentLifecycle,
  updateAssessmentLifecycle,
  getSectionSettings,
  updateSectionSettings,
  // reorderSections,
  // reorderQuestions,
  getSectionQuestions,
} from "../../lib/api";
import { showToast } from "../../utils/toast";
// import OrderCard from "./Order";
import dayjs from "dayjs";
import React, { useState, useEffect, useCallback, useMemo } from "react";

// Section Settings Form Component - moved outside to prevent recreation
const SectionSettingsForm = React.memo(
  ({
    sectionId,
    settings,
    loading,
    saving,
    onSectionSettingsChange,
    onNestedSectionSettingsChange,
    onSave,
  }: {
    sectionId: string;
    settings: any;
    loading: boolean;
    saving: boolean;
    onSectionSettingsChange: (
      sectionId: string,
      field: string,
      value: any
    ) => void;
    onNestedSectionSettingsChange: (
      sectionId: string,
      parentField: string,
      childField: string,
      value: any
    ) => void;
    onSave: (sectionId: string) => void;
  }) => {
    if (!settings) {
      return (
        <div
          className="text-center py-8"
          style={{ color: "var(--text-primary)" }}
        >
          {loading ? "Loading section settings..." : "No settings available"}
        </div>
      );
    }

    return (
      <div className="space-y-6 min-h-[600px]">
        {/* Section Name */}
        <div>
          <label
            htmlFor={`section_name_${sectionId}`}
            className="text-sm font-medium block mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Section Name
          </label>
          <input
            id={`section_name_${sectionId}`}
            type="text"
            value={settings.section_name || ""}
            readOnly
            className="w-full px-3 py-2 rounded-lg"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              cursor: "not-allowed",
            }}
            placeholder="Section name"
          />
        </div>

        {/* Proctoring Settings */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Proctoring Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(settings.proctoring_settings || {})
              .filter(([key]) => 
                key !== 'screen_recording' && 
                key !== 'ai_assistance' && 
                key !== 'auto_calculate_duration'
              )
              .map(
              ([key, value]: [string, any]) => {
                const getIcon = (settingKey: string) => {
                  const icons: Record<string, string> = {
                    candidate_location:
                      "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
                    eyeball_detection:
                      "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
                    capture_screenshot:
                      "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
                    disable_copy_paste:
                      "M9 12l2 2 4-4 M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
                    ai_assistance:
                      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                    audio_analysis:
                      "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                    resume_test:
                      "M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    disable_screen_extension:
                      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                    screen_recording:
                      "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
                    face_analysis:
                      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                    shuffle_questions:
                      "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                    auto_calculate_duration:
                      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  };
                  return icons[settingKey] || "M9 12l2 2 4-4";
                };

                const getDescription = (settingKey: string) => {
                  const descriptions: Record<string, string> = {
                    candidate_location:
                      "Track candidate's physical location during the test",
                    eyeball_detection:
                      "Monitor eye movement and attention patterns",
                    capture_screenshot:
                      "Automatically capture screenshots at intervals",
                    disable_copy_paste:
                      "Prevent copying and pasting during the test",
                    ai_assistance:
                      "Enable AI-powered monitoring and assistance",
                    audio_analysis: "Analyze audio for suspicious activities",
                    resume_test: "Allow candidates to resume interrupted tests",
                    disable_screen_extension:
                      "Block browser extensions and add-ons",
                    screen_recording: "Record the entire test session",
                    face_analysis: "Analyze facial expressions and behavior",
                    shuffle_questions:
                      "Randomize question order for each candidate",
                    auto_calculate_duration:
                      "Automatically calculate test duration",
                  };
                  return (
                    descriptions[settingKey] ||
                    "Configure this proctoring setting"
                  );
                };

                return (
                  <div
                    key={key}
                    className="group relative rounded-xl p-4 transition-all duration-200"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={getIcon(key)}
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-medium text-sm mb-1 capitalize"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {key.replace(/_/g, " ")}
                          </h4>
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {getDescription(key)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-3">
                        <Checkbox
                          checked={value?.enable !== undefined ? value.enable : (key === 'disable_copy_paste' ? true : false)}
                          onChange={(e) =>
                            onNestedSectionSettingsChange(
                              sectionId,
                              "proctoring_settings",
                              key,
                              { ...value, enable: e.target.checked }
                            )
                          }
                          className="
                                        [&_.ant-checkbox-inner]:!bg-[var(--bg-secondary)]
                                        [&_.ant-checkbox-inner]:!border-[var(--border-primary)]
                                        [&_.ant-checkbox-inner]:!rounded-md
                                        [&_.ant-checkbox-inner]:!w-5
                                        [&_.ant-checkbox-inner]:!h-5
                                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[var(--accent-primary)]
                                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[var(--accent-primary)]
                                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!border-white
                                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!w-2
                                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!h-2"
                          style={{ color: "var(--text-primary)" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
            
            {/* Pooling Setting */}
            <div
              className="group relative rounded-xl p-4 transition-all duration-200"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-sm mb-1 capitalize"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Question Pooling
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Randomly select questions from a pool for each candidate
                    </p>
                  </div>
                </div>
                <div className="ml-3">
                  <Checkbox
                    checked={settings.pooling_enabled || false}
                    onChange={(e) =>
                      onSectionSettingsChange(
                        sectionId,
                        "pooling_enabled",
                        e.target.checked
                      )
                    }
                    className="
                                  [&_.ant-checkbox-inner]:!bg-[var(--bg-secondary)]
                                  [&_.ant-checkbox-inner]:!border-[var(--border-primary)]
                                  [&_.ant-checkbox-inner]:!rounded-md
                                  [&_.ant-checkbox-inner]:!w-5
                                  [&_.ant-checkbox-inner]:!h-5
                                  [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[var(--accent-primary)]
                                  [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[var(--accent-primary)]
                                  [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!border-white
                                  [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!w-2
                                  [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!h-2"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Configuration */}
        <div className="space-y-4">
          {/* Section Time */}
          <div
            className="rounded-2xl px-[30px] py-5"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }question-setting/stop-watch.svg`}
                    alt="Section Time"
                    className="w-5 h-5"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Section Time
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Section time is automatically calculated from the sum of all question times in this section.
                </p>
              </div>
              <div className="flex-none">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Duration:
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={String(
                        settings.section_config?.section_time?.hours || 0
                      ).padStart(2, "0")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const numericValue = Math.min(parseInt(value) || 0, 24);
                        onNestedSectionSettingsChange(
                          sectionId,
                          "section_config",
                          "section_time",
                          {
                            ...settings.section_config?.section_time,
                            hours: numericValue,
                          }
                        );
                      }}
                      style={{
                        width: "50px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hours
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={String(
                        settings.section_config?.section_time?.mins || 0
                      ).padStart(2, "0")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const numericValue = Math.min(parseInt(value) || 0, 59);
                        onNestedSectionSettingsChange(
                          sectionId,
                          "section_config",
                          "section_time",
                          {
                            ...settings.section_config?.section_time,
                            mins: numericValue,
                          }
                        );
                      }}
                      style={{
                        width: "50px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Break Time */}
          <div
            className="rounded-2xl px-[30px] py-5"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }question-setting/clock.svg`}
                    alt="Break Time"
                    className="w-5 h-5"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Section Break Time
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Add a short break after this section by setting a custom pause
                  duration—give candidates time to rest before moving on.
                </p>
              </div>
              <div className="flex-none">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Duration:
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={String(
                        settings.section_config?.section_break_time?.hours || 0
                      ).padStart(2, "0")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const numericValue = Math.min(parseInt(value) || 0, 24);
                        onNestedSectionSettingsChange(
                          sectionId,
                          "section_config",
                          "section_break_time",
                          {
                            ...settings.section_config?.section_break_time,
                            hours: numericValue,
                          }
                        );
                      }}
                      style={{
                        width: "50px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hours
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={String(
                        settings.section_config?.section_break_time?.mins || 0
                      ).padStart(2, "0")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const numericValue = Math.min(parseInt(value) || 0, 59);
                        onNestedSectionSettingsChange(
                          sectionId,
                          "section_config",
                          "section_break_time",
                          {
                            ...settings.section_config?.section_break_time,
                            mins: numericValue,
                          }
                        );
                      }}
                      style={{
                        width: "50px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cut Off Marks */}
          <div
            className="rounded-2xl px-[30px] py-5"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-none min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }question-setting/percentage.svg`}
                    alt="Cut Off Marks"
                    className="w-5 h-5"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Cut-off Marks
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Define the minimum percentage a candidate must score to
                  pass—set a clear benchmark to qualify.
                </p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 w-full max-w-md ps-2">
                  <Slider
                    min={0}
                    max={100}
                    value={
                      settings.section_config?.cut_off_marks?.percentage || 0
                    }
                    onChange={(value) =>
                      onNestedSectionSettingsChange(
                        sectionId,
                        "section_config",
                        "cut_off_marks",
                        {
                          ...settings.section_config?.cut_off_marks,
                          percentage: value,
                        }
                      )
                    }
                    className="
                                            flex-1
                                            [&_.ant-slider-rail]:!bg-[var(--border-primary)]
                                            [&_.ant-slider-track]:!bg-[var(--accent-primary)]
                                            [&_.ant-slider-handle]:!border-none
                                            [&_.ant-slider-handle::after]:!bg-[var(--accent-primary)]
                                            [&_.ant-slider-handle_.ant-slider-handle-dragging]:!bg-[var(--accent-primary)]
                                            [&_.ant-slider-handle]:!shadow-none
                                            [&_.ant-slider-handle]:!w-4
                                            [&_.ant-slider-handle]:!h-4
                                            !h-2
                                        "
                  />
                  <InputNumber
                    min={0}
                    max={100}
                    value={
                      settings.section_config?.cut_off_marks?.percentage || 0
                    }
                    onChange={(value) =>
                      onNestedSectionSettingsChange(
                        sectionId,
                        "section_config",
                        "cut_off_marks",
                        {
                          ...settings.section_config?.cut_off_marks,
                          percentage: value || 0,
                        }
                      )
                    }
                    controls={false}
                    className="!rounded-md !w-16 text-center"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={() => onSave(sectionId)}
            loading={saving}
            disabled={saving}
            className="!rounded-lg !h-10 !px-8"
            style={{
              backgroundColor: "var(--accent-primary)",
              borderColor: "var(--accent-primary)",
              color: "white",
            }}
          >
            {saving ? "Saving..." : "Save Section Settings"}
          </Button>
        </div>
        <div className="py-1" />
      </div>
    );
  }
);

const { Title, Paragraph } = Typography;

interface ContentCardProps {
  selectedMenuItem: string;
  generalSettings?: Record<string, unknown>;
  loading?: boolean;
  saving?: boolean;
  onFieldUpdate?: (
    fieldName: string,
    enabled: boolean,
    required: boolean
  ) => void;
  onCustomFieldUpdate?: (
    fieldId: string,
    enabled: boolean,
    required: boolean
  ) => void;
  onCreateCustomField?: (fieldData: Record<string, unknown>) => Promise<void>;
  onTotalDurationChange?: (totalDuration: string) => void;
}

function CustomField({
  field_name,
  field_description,
  enabled = false,
  required = false,
  fieldKey,
  onFieldUpdate,
  disabled = false,
}) {
  const handleEnabledChange = (checked: boolean) => {
    if (onFieldUpdate) {
      // When enabling a field, keep the current required state
      // When disabling a field, set required to false
      const newRequired = checked ? required : false;
      onFieldUpdate(fieldKey, checked, newRequired);
    }
  };

  const handleRequiredChange = (checked: boolean) => {
    if (onFieldUpdate) {
      onFieldUpdate(fieldKey, enabled, checked);
    }
  };

  return (
    <Row
      align="middle"
      justify="space-between"
      className="w-full p-3 rounded-xl"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
      gutter={[8, 8]}
    >
      <Col flex="1" className="min-w-0">
        <Row align="middle" gutter={20}>
          <Col>
            <Checkbox
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              disabled={disabled}
              className="text-xs sm:text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          </Col>

          <Col className="flex-1 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-xs sm:text-sm lg:text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {field_name}
                </span>
                {required && <span className="text-red-500 text-xs">*</span>}
              </div>
              <span
                className="mt-1 font-medium text-xs lg:text-xs leading-tight break-words line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {field_description}
              </span>
            </div>
          </Col>

          {enabled && (
            <Col>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <Checkbox
                  checked={required}
                  onChange={(e) => handleRequiredChange(e.target.checked)}
                  disabled={disabled}
                  className="text-xs"
                  style={{ color: "#F9A216" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "#F9A216" }}
                >
                  Required
                </span>
              </div>
            </Col>
          )}
        </Row>
      </Col>
    </Row>
  );
}

export default function ContentCard({
  selectedMenuItem,
  generalSettings,
  loading,
  saving,
  onFieldUpdate,
  onCustomFieldUpdate,
  onCreateCustomField,
  onTotalDurationChange,
}: ContentCardProps) {
  const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  // Lifecycle state management
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleSaving, setLifecycleSaving] = useState(false);
  const [lifecycleFormData, setLifecycleFormData] = useState({
    invite_start_date: null as dayjs.Dayjs | null,
    invite_end_date: null as dayjs.Dayjs | null,
    candidate_window: 0,
  });

  // Section settings state management
  const [sectionSettings, setSectionSettings] = useState<Record<string, any>>(
    {}
  );
  const [sectionSettingsLoading, setSectionSettingsLoading] = useState(false);
  const [sectionSettingsSaving, setSectionSettingsSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Section reordering state
  // const [reorderingSaving, setReorderingSaving] = useState(false);

  // Get current assessment from Redux store
  const currentAssessment = useSelector(selectCurrentAssessment);

  // Get the next order for custom fields (last standard field order + 1)
  const getNextCustomFieldOrder = () => {
    if (!generalSettings) return 10;

    const standardFields =
      (generalSettings as any)?.general_settings?.candidate_details
        ?.standard_fields || {};
    const orders = Object.values(standardFields).map(
      (field: any) => parseInt(field.order) || 0
    );
    const maxOrder = Math.max(...orders, 0);
    return maxOrder + 1;
  };

  // Handle custom field creation
  const handleCreateCustomField = async (
    fieldData: Record<string, unknown>
  ) => {
    if (onCreateCustomField) {
      await onCreateCustomField(fieldData);
    }
  };

  // Fetch assessment data function
  const fetchAssessmentData = useCallback(async () => {
      if (currentAssessment?.key) {
        setAssessmentLoading(true);
        try {
          const assessmentResponse = await getAssessment(currentAssessment.key);
          if (assessmentResponse.success) {
          const assessmentData = assessmentResponse.data;
          
          // Fetch questions for each section
          if (assessmentData.sections && assessmentData.sections.length > 0) {
            const sectionsWithQuestions = await Promise.all(
              assessmentData.sections.map(async (section: any) => {
                try {
                  const questionsResponse = await getSectionQuestions(
                    currentAssessment.key,
                    section.section_id
                  );
                  
                  if (questionsResponse.success && questionsResponse.data) {
                    let questions: any[] = [];
                    
                    // Check if we have section.questions (object with question type keys)
                    if (questionsResponse.data.section?.questions) {
                      const questionsObj = questionsResponse.data.section.questions;
                      
                      // Flatten all questions from all question types
                      Object.keys(questionsObj).forEach(typeKey => {
                        if (Array.isArray(questionsObj[typeKey])) {
                          questions = [...questions, ...questionsObj[typeKey]];
                        }
                      });
                    } 
                    // Or check if data.questions is directly an object with type keys
                    else if (questionsResponse.data.questions && typeof questionsResponse.data.questions === 'object' && !Array.isArray(questionsResponse.data.questions)) {
                      const questionsObj = questionsResponse.data.questions;
                      
                      Object.keys(questionsObj).forEach(typeKey => {
                        if (Array.isArray(questionsObj[typeKey])) {
                          questions = [...questions, ...questionsObj[typeKey]];
                        }
                      });
                    }
                    // Or if it's already an array
                    else if (Array.isArray(questionsResponse.data.questions)) {
                      questions = questionsResponse.data.questions;
                    }
                    
                    return {
                      ...section,
                      questions: questions,
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching questions for section ${section.section_id}:`, error);
                }
                return { ...section, questions: [] };
              })
            );
            
            assessmentData.sections = sectionsWithQuestions;
          }
          
          setAssessmentData(assessmentData);
          } else {
            console.error(
              "Failed to fetch assessment:",
              assessmentResponse.data
            );
          }
        } catch (error) {
          console.error("Error fetching assessment:", error);
        } finally {
          setAssessmentLoading(false);
        }
      }
  }, [currentAssessment?.key]);

  // Fetch assessment data when component mounts or currentAssessment changes
  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData]);

  // Fetch lifecycle data when component mounts or currentAssessment changes
  useEffect(() => {
    const fetchLifecycleData = async () => {
      if (currentAssessment?.key) {
        setLifecycleLoading(true);
        try {
          const lifecycleResponse = await getAssessmentLifecycle(
            currentAssessment.key
          );
          if (lifecycleResponse.success) {
            // Update form data with fetched values
            setLifecycleFormData({
              invite_start_date: lifecycleResponse.data.invite_start_date
                ? dayjs(lifecycleResponse.data.invite_start_date)
                : null,
              invite_end_date: lifecycleResponse.data.invite_end_date
                ? dayjs(lifecycleResponse.data.invite_end_date)
                : null,
              candidate_window: lifecycleResponse.data.candidate_window || 0,
            });
          } else {
            console.error(
              "Failed to fetch lifecycle data:",
              lifecycleResponse.data
            );
          }
        } catch (error) {
          console.error("Error fetching lifecycle data:", error);
        } finally {
          setLifecycleLoading(false);
        }
      }
    };

    fetchLifecycleData();
  }, [currentAssessment?.key]);

  // Fetch section settings for the first section when assessment data is loaded
  useEffect(() => {
    if (
      assessmentData?.sections &&
      assessmentData.sections.length > 0 &&
      !activeSectionId
    ) {
      const firstSection = assessmentData.sections[0];
      if (firstSection.section_id) {
        setActiveSectionId(firstSection.section_id);
        fetchSectionSettings(firstSection.section_id);
      }
    }
  }, [assessmentData?.sections, activeSectionId]);

  // Calculate total duration from all sections
  const calculateTotalDuration = useMemo(() => {
    if (!assessmentData?.sections || !sectionSettings) {
      return { totalHours: 0, totalMinutes: 0, totalSeconds: 0 };
    }

    let totalMinutes = 0;

    assessmentData.sections.forEach((section: any) => {
      const sectionId = section.section_id || `section-${assessmentData.sections.indexOf(section)}`;
      const settings = sectionSettings[sectionId];
      
      if (settings?.section_config?.section_time) {
        const sectionTime = settings.section_config.section_time;
        const hours = sectionTime.hours || 0;
        const mins = sectionTime.mins || 0;
        totalMinutes += hours * 60 + mins;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return { totalHours, totalMinutes: remainingMinutes, totalSeconds: 0 };
  }, [assessmentData?.sections, sectionSettings]);

  // Notify parent of total duration changes
  useEffect(() => {
    if (onTotalDurationChange) {
      const formattedDuration = `${String(calculateTotalDuration.totalHours).padStart(2, "0")}:${String(calculateTotalDuration.totalMinutes).padStart(2, "0")}:${String(calculateTotalDuration.totalSeconds).padStart(2, "0")}`;
      onTotalDurationChange(formattedDuration);
    }
  }, [calculateTotalDuration, onTotalDurationChange]);

  // Handle lifecycle form submission
  const handleLifecycleSubmit = async () => {
    if (!currentAssessment?.key) return;

    // Validation: invite start date must be before invite end date
    if (
      lifecycleFormData.invite_start_date &&
      lifecycleFormData.invite_end_date
    ) {
      if (
        lifecycleFormData.invite_start_date.isAfter(
          lifecycleFormData.invite_end_date
        )
      ) {
        message.error("Invite start date must be before invite end date");
        return;
      }
    }

    setLifecycleSaving(true);
    try {
      const payload = {
        invite_start_date:
          lifecycleFormData.invite_start_date?.toISOString() || "",
        invite_end_date: lifecycleFormData.invite_end_date?.toISOString() || "",
        candidate_window: lifecycleFormData.candidate_window,
      };

      const response = await updateAssessmentLifecycle(
        currentAssessment.key,
        payload
      );
      if (response.success) {
        showToast({
          message: "Lifecycle Settings Saved",
          description: "Lifecycle settings saved successfully!",
          position: "top-right",
          duration: 4000,
          type: "success"
        });
      } else {
        // Handle validation errors
        if (response.data?.detail) {
          showToast({
            message: "Error",
            description: response.data.detail,
            position: "top-right",
            duration: 5000,
            type: "error"
          });
        } else {
          showToast({
            message: "Error",
            description: "Failed to update lifecycle settings",
            position: "top-right",
            duration: 5000,
            type: "error"
          });
        }
      }
    } catch (error) {
      console.error("Error updating lifecycle:", error);
      showToast({
        message: "Error",
        description: "An error occurred while updating lifecycle settings",
        position: "top-right",
        duration: 5000,
        type: "error"
      });
    } finally {
      setLifecycleSaving(false);
    }
  };

  // Handle form field changes
  const handleLifecycleFieldChange = (field: string, value: any) => {
    setLifecycleFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate section time from question times
  const calculateSectionTimeFromQuestions = useCallback((sectionId: string) => {
    if (!assessmentData?.sections) return null;

    const section = assessmentData.sections.find(
      (s: any) => s.section_id === sectionId
    );

    if (!section || !section.questions || !Array.isArray(section.questions)) {
      return null;
    }

    // Sum all question time limits (in minutes)
    let totalMinutes = 0;
    section.questions.forEach((question: any) => {
      const timeLimit = question.time_limit 
        ? parseInt(question.time_limit, 10) 
        : (question.duration ? parseInt(question.duration, 10) : 0);
      if (!isNaN(timeLimit) && timeLimit > 0) {
        totalMinutes += timeLimit;
      }
    });

    if (totalMinutes === 0) return null;

    // Convert to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return { hours, mins };
  }, [assessmentData?.sections]);

  // Auto-update section time from questions when assessment data changes
  useEffect(() => {
    if (!assessmentData?.sections) return;

    // Update section time for each section based on question times
    assessmentData.sections.forEach((section: any) => {
      const sectionId = section.section_id;
      if (!sectionId) return;

      const calculatedTime = calculateSectionTimeFromQuestions(sectionId);
      if (calculatedTime) {
        setSectionSettings((prev) => {
          const currentSettings = prev[sectionId];
          const currentSectionTime = currentSettings?.section_config?.section_time;
          
          // Only update if the calculated time is different from current time
          const currentTotalMinutes = (currentSectionTime?.hours || 0) * 60 + (currentSectionTime?.mins || 0);
          const calculatedTotalMinutes = calculatedTime.hours * 60 + calculatedTime.mins;
          
          if (currentTotalMinutes !== calculatedTotalMinutes) {
            return {
              ...prev,
              [sectionId]: {
                ...currentSettings,
                section_config: {
                  ...currentSettings?.section_config,
                  section_time: calculatedTime,
                },
              },
            };
          }
          return prev;
        });
      }
    });
  }, [assessmentData?.sections, calculateSectionTimeFromQuestions]);

  // Fetch section settings when section changes
  const fetchSectionSettings = useCallback(
    async (sectionId: string) => {
      if (!currentAssessment?.key) return;

      setSectionSettingsLoading(true);
      try {
        const response = await getSectionSettings(
          currentAssessment.key,
          sectionId
        );
        if (response.success) {
          // Calculate section time from questions
          const calculatedTime = calculateSectionTimeFromQuestions(sectionId);
          
          setSectionSettings((prev) => {
            // Merge response data with calculated time (prioritize calculated time from questions)
            return {
              ...prev,
              [sectionId]: {
                ...response.data,
                section_config: {
                  ...response.data.section_config,
                  // Use calculated time from questions if available, otherwise use saved time
                  section_time: calculatedTime || response.data.section_config?.section_time || { hours: 0, mins: 0 },
                },
              },
            };
          });
        } else {
          console.error("Failed to fetch section settings:", response.data);
        }
      } catch (error) {
        console.error("Error fetching section settings:", error);
      } finally {
        setSectionSettingsLoading(false);
      }
    },
    [currentAssessment?.key, calculateSectionTimeFromQuestions]
  );

  // Handle section settings form submission
  const handleSectionSettingsSubmit = useCallback(
    async (sectionId: string) => {
      if (!currentAssessment?.key || !sectionSettings[sectionId]) return;

      setSectionSettingsSaving(true);
      try {
        const settingsData = sectionSettings[sectionId];
        const response = await updateSectionSettings(
          currentAssessment.key,
          sectionId,
          settingsData
        );
        if (response.success) {
          showToast({
            message: "Section Settings Updated Successfully",
            description: "Section settings have been saved successfully.",
            position: "top-right",
            duration: 4000,
            type: "success"
          });
          // Merge response data with existing state to preserve section_time
          setSectionSettings((prev) => {
            const currentSettings = prev[sectionId] || {};
            const responseData = response.data || {};
            
            // Preserve section_time from current state (what user just saved)
            const preservedSectionTime = currentSettings.section_config?.section_time;
            
            // Deep merge to preserve section_time and other nested configs
            return {
              ...prev,
              [sectionId]: {
                ...currentSettings,
                ...responseData,
                section_config: {
                  ...currentSettings.section_config,
                  ...responseData.section_config,
                  // Always preserve section_time from current state (what was just saved)
                  section_time: preservedSectionTime || responseData.section_config?.section_time,
                },
              },
            };
          });
        } else {
          message.error("Failed to update section settings");
        }
      } catch (error) {
        console.error("Error updating section settings:", error);
        message.error("An error occurred while updating section settings");
      } finally {
        setSectionSettingsSaving(false);
      }
    },
    [currentAssessment?.key, sectionSettings]
  );

  // Handle section settings field changes
  const handleSectionSettingsChange = useCallback(
    (sectionId: string, field: string, value: any) => {
      setSectionSettings((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [field]: value,
        },
      }));
    },
    []
  );

  // Handle nested section settings field changes (for proctoring_settings and section_config)
  const handleNestedSectionSettingsChange = useCallback(
    (
      sectionId: string,
      parentField: string,
      childField: string,
      value: any
    ) => {
      setSectionSettings((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [parentField]: {
            ...prev[sectionId]?.[parentField],
            [childField]: value,
          },
        },
      }));
    },
    []
  );

  // Handle tab change to fetch section settings
  const handleTabChange = useCallback(
    (activeKey: string) => {
      setActiveSectionId(activeKey);
      if (activeKey !== "loading" && assessmentData?.sections) {
        const section = assessmentData.sections.find(
          (s: any) =>
            (s.section_id ||
              `section-${assessmentData.sections.indexOf(s)}`) === activeKey
        );
        if (section) {
          fetchSectionSettings(section.section_id || activeKey);
        }
      }
    },
    [assessmentData?.sections, fetchSectionSettings]
  );

  // Generate tabs dynamically based on assessment data
  const generateTabs = useCallback(() => {
    if (!assessmentData?.sections || assessmentLoading) {
      return [
        {
          key: "loading",
          label: "Loading...",
          children: (
            <div
              className="text-center py-8"
              style={{ color: "var(--text-primary)" }}
            >
              Loading sections...
            </div>
          ),
        },
      ];
    }

    return assessmentData.sections.map((section: any, index: number) => ({
      key: section.section_id || `section-${index}`,
      label: section.section_name || `Section ${index + 1}`,
      children: (
        <SectionSettingsForm
          sectionId={section.section_id || `section-${index}`}
          settings={sectionSettings[section.section_id || `section-${index}`]}
          loading={sectionSettingsLoading}
          saving={sectionSettingsSaving}
          onSectionSettingsChange={handleSectionSettingsChange}
          onNestedSectionSettingsChange={handleNestedSectionSettingsChange}
          onSave={handleSectionSettingsSubmit}
        />
      ),
    }));
  }, [
    assessmentData?.sections,
    assessmentLoading,
    sectionSettings,
    sectionSettingsLoading,
    sectionSettingsSaving,
    handleSectionSettingsChange,
    handleNestedSectionSettingsChange,
    handleSectionSettingsSubmit,
  ]);

  // Handle section reordering
  // const handleSectionReorder = async (reorderedSections: any[]) => {
  //   if (!currentAssessment?.key) return;

  //   setReorderingSaving(true);
  //   try {
  //     // Create the payload with section_id and new order
  //     const sectionOrders = reorderedSections.map((section, index) => ({
  //       section_id: section.section_id,
  //       order: index,
  //     }));

  //     const response = await reorderSections(currentAssessment.key, sectionOrders);
      
  //     if (response.success) {
  //       // Refresh assessment data
  //       await fetchAssessmentData();
  //     } else {
  //       message.error(response.data || "Failed to update section order");
  //       throw new Error("Failed to update section order");
  //     }
  //   } catch (error) {
  //     console.error("Error reordering sections:", error);
  //     throw error;
  //   } finally {
  //     setReorderingSaving(false);
  //   }
  // };

  // Handle question reordering within a section
  // const handleQuestionReorder = async (sectionId: string, reorderedQuestions: any[]) => {
  //   if (!currentAssessment?.key) return;

  //   try {
  //     // Create the payload with question_id and new order
  //     const questionOrders = reorderedQuestions.map((question, index) => ({
  //       question_id: question.question_id,
  //       order: index,
  //     }));

  //     const response = await reorderQuestions(currentAssessment.key, sectionId, questionOrders);
      
  //     if (response.success) {
  //       // Refresh assessment data
  //       await fetchAssessmentData();
  //     } else {
  //       message.error(response.data || "Failed to update question order");
  //       throw new Error("Failed to update question order");
  //     }
  //   } catch (error) {
  //     console.error("Error reordering questions:", error);
  //     throw error;
  //   }
  // };

  const renderContent = () => {
    switch (selectedMenuItem) {
      case "general":
        return (
          <div
            className="w-full !border-none px-6 pt-3 !h-[70vh] !rounded-2xl !overflow-y-auto"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <Collapse
              className="!border-none !rounded-2xl
                                [&_.ant-collapse-header]:!border-[var(--border-primary)] [&_.ant-collapse-header]:!border-b
                                [&_.ant-collapse-header]:!bg-[var(--bg-primary)]
                                [&_.ant-collapse-header]:!border-b-2
                                [&_.ant-collapse-header]:!rounded-t-2xl
                                [&_.ant-collapse-header]:!rounded-b-none
                                [&_.ant-collapse-header]:!justify-center
                                [&_.ant-collapse-header]:!p-3
                                sm:[&_.ant-collapse-header]:!p-4
                                lg:[&_.ant-collapse-header]:!p-5
                                [&_.ant-collapse-content]:!bg-[var(--bg-primary)]
                                [&_.ant-collapse-content]:!border-t-[var(--border-primary)]
                                [&_.ant-collapse-content-box]:!text-[var(--text-primary)]
                                [&_.ant-collapse-content]:!rounded-2xl
                                [&_.ant-collapse-content-box]:!p-3
                                sm:[&_.ant-collapse-content-box]:!p-4
                                lg:[&_.ant-collapse-content-box]:!p-6
                                [&_.ant-collapse-expand-icon]:!text-[var(--text-primary)]"
              style={{
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
              defaultActiveKey={["1"]}
              // onChange={onChange}
              expandIconPosition="end"
              items={[
                {
                  key: "1",
                  label: (
                    <div
                      className="flex flex-row gap-2 sm:gap-3 font-medium items-center w-full text-sm sm:text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }question-setting/user-focus.svg`}
                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                        alt="Proctoring"
                      />
                      <span className="truncate">
                        Candidate Details Configuration
                      </span>
                    </div>
                  ),
                  children: (
                    <>
                      <Row className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <Col
                          className="flex-1 min-w-0"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Collect additional details based on your requirements
                          and create custom fields to capture the exact
                          candidate information you need.
                        </Col>
                        <Col className="flex-shrink-0">
                          <Button
                            onClick={() => setShowAddCustomFieldModal(true)}
                            className="!text-[#ffffff] !rounded-full !h-11 !w-auto"
                            style={{ backgroundColor: "var(--accent-primary)" }}
                          >
                            <PlusOutlined /> Add Custom Fields
                          </Button>
                        </Col>
                      </Row>

                      <Row
                        align="middle"
                        gutter={[
                          { xs: 8, sm: 16, md: 20, lg: 24 },
                          { xs: 16, sm: 20, md: 24, lg: 24 },
                        ]}
                        className="w-full"
                      >
                        {loading ? (
                          <Col
                            span={24}
                            className="text-center"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Loading...
                          </Col>
                        ) : saving ? (
                          <Col
                            span={24}
                            className="text-center"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Saving changes...
                          </Col>
                        ) : (
                          <>
                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Full Name"
                                field_description="For candidate identification and personalized communication."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.full_name?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.full_name?.required || false
                                }
                                fieldKey="full_name"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Email"
                                field_description="Primary contact for test invites, results, and updates."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields?.email
                                    ?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields?.email
                                    ?.required || false
                                }
                                fieldKey="email"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Mobile Number"
                                field_description="For SMS alerts and urgent communication backup."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.mobile_number?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.mobile_number?.required || false
                                }
                                fieldKey="mobile_number"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Passport"
                                field_description="Verifies global identity for international hiring."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.passport?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.passport?.required || false
                                }
                                fieldKey="passport"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Aadhar Number"
                                field_description="Validates Indian identity for secure candidate verification."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.aadhar_number?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.aadhar_number?.required || false
                                }
                                fieldKey="aadhar_number"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="PAN Number"
                                field_description="Validates Indian identity for secure candidate verification."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.pan_number?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.pan_number?.required || false
                                }
                                fieldKey="pan_number"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Date of Birth"
                                field_description="Confirms age eligibility and prevents duplicate entries."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.date_of_birth?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.date_of_birth?.required || false
                                }
                                fieldKey="date_of_birth"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="% or CGPA"
                                field_description="Assesses academic performance for eligibility filtering."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.percentage_cgpa?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.percentage_cgpa?.required || false
                                }
                                fieldKey="percentage_cgpa"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>

                            <Col
                              xs={24}
                              sm={24}
                              md={24}
                              lg={24}
                              xl={12}
                              xxl={8}
                            >
                              <CustomField
                                field_name="Notice Period"
                                field_description="Helps plan hiring timelines based on candidate availability."
                                enabled={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.notice_period?.enabled || false
                                }
                                required={
                                  (generalSettings as any)?.general_settings
                                    ?.candidate_details?.standard_fields
                                    ?.notice_period?.required || false
                                }
                                fieldKey="notice_period"
                                onFieldUpdate={onFieldUpdate}
                                disabled={saving}
                              />
                            </Col>
                          </>
                        )}
                      </Row>

                      {/* Custom Fields Section */}
                      {(generalSettings as any)?.general_settings
                        ?.candidate_details?.custom_fields?.length > 0 && (
                        <>
                          <div className="mt-8 mb-4">
                            <h4
                              className="text-lg font-medium mb-2"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Custom Fields
                            </h4>
                            <p
                              className="text-sm"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Additional fields created for this assessment
                            </p>
                          </div>

                          <Row
                            align="middle"
                            gutter={[
                              { xs: 8, sm: 16, md: 20, lg: 24 },
                              { xs: 16, sm: 20, md: 24, lg: 24 },
                            ]}
                            className="w-full"
                          >
                            {(
                              generalSettings as any
                            )?.general_settings?.candidate_details?.custom_fields?.map(
                              (field: any, index: number) => (
                                <Col
                                  xs={24}
                                  sm={24}
                                  md={24}
                                  lg={24}
                                  xl={12}
                                  xxl={8}
                                  key={field.id || index}
                                >
                                  <CustomField
                                    field_name={field.label}
                                    field_description={`Custom ${field.type} field`}
                                    enabled={field.enabled || false}
                                    required={field.required || false}
                                    fieldKey={field.id}
                                    onFieldUpdate={onCustomFieldUpdate}
                                    disabled={saving}
                                  />
                                </Col>
                              )
                            )}
                          </Row>
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />

            {/* Lifecycle Settings Card */}
            <Card
              className="w-full !border-none px-8 py-7 !h-auto !rounded-2xl !overflow-y-auto !mt-5"
              style={{
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            >
              <Row
                align="middle"
                justify="space-between"
                className="w-full mb-6"
              >
                <Col>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-lg font-semibold mt-[2px]">
                      📅
                    </span>
                    <div>
                      <p
                        className="font-medium text-base"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Assessment Lifecycle Settings
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Configure invite dates and assessment active till for your
                        assessment.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>

              {lifecycleLoading ? (
                <div
                  className="text-center py-8"
                  style={{ color: "var(--text-primary)" }}
                >
                  Loading lifecycle settings...
                </div>
              ) : (
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={24} md={12}>
                    <div className="space-y-2">
                      <label
                        htmlFor="invite_start_date"
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Invite Start Date
                      </label>
                      <DatePicker
                        id="invite_start_date"
                        value={lifecycleFormData.invite_start_date}
                        onChange={(date) =>
                          handleLifecycleFieldChange("invite_start_date", date)
                        }
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        className="w-full [&_.ant-picker-input]:!text-[var(--text-primary)] [&_.ant-picker-input]:!bg-[var(--bg-secondary)] [&_.ant-picker-input]:!placeholder-[var(--text-secondary)]"
                        placeholder="Select start date"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={24} md={12}>
                    <div className="space-y-2">
                      <label
                        htmlFor="invite_end_date"
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Invite End Date
                      </label>
                      <DatePicker
                        id="invite_end_date"
                        value={lifecycleFormData.invite_end_date}
                        onChange={(date) =>
                          handleLifecycleFieldChange("invite_end_date", date)
                        }
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        className="w-full [&_.ant-picker-input]:!text-[var(--text-primary)] [&_.ant-picker-input]:!bg-[var(--bg-secondary)] [&_.ant-picker-input]:!placeholder-[var(--text-secondary)]"
                        placeholder="Select end date"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={24} md={12}>
                    <div className="space-y-2">
                      <label
                        htmlFor="candidate_window"
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Assessment Active Till (days)
                      </label>
                      <InputNumber
                        id="candidate_window"
                        value={lifecycleFormData.candidate_window}
                        onChange={(value) =>
                          handleLifecycleFieldChange(
                            "candidate_window",
                            value || 0
                          )
                        }
                        min={0}
                        max={365}
                        className="w-full [&_.ant-input-number-input]:!text-[var(--text-primary)] [&_.ant-input-number-input]:!bg-[var(--bg-secondary)] [&_.ant-input-number-input]:!placeholder-[var(--text-secondary)]"
                        placeholder="Enter assessment active till in days"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </Col>

                  <Col xs={24}>
                    <div className="flex justify-end">
                      <Button
                        type="primary"
                        onClick={handleLifecycleSubmit}
                        loading={lifecycleSaving}
                        disabled={lifecycleSaving}
                        className="!rounded-lg !h-10 !px-8"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          borderColor: "var(--accent-primary)",
                          color: "white",
                        }}
                      >
                        {lifecycleSaving
                          ? "Saving..."
                          : "Save Lifecycle Settings"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
            </Card>
          </div>
        );
      case "section": {
        return (
          <div
            className="w-full !border-none px-6 pt-3 !h-[70vh] !rounded-2xl !overflow-y-auto"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <Tabs
              defaultActiveKey="0"
              items={generateTabs()}
              onChange={handleTabChange}
              className={`
                                text-lg h-full
                                [&_.ant-tabs-nav]:bg-[var(--bg-primary)]
                                [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                                [&_.ant-tabs-tab-btn]:!font-semibold
                                [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                                [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold
                                [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                                [&_.ant-tabs-ink-bar]:h-1.5
                                [&_.ant-tabs-nav]:border-b-0
                                [&_.ant-tabs-content-holder]:border-0
                                [&_.ant-tabs-content-holder]:h-full
                                [&_.ant-tabs-tabpane]:animate-[slideUpFadeIn_0.5s_ease-out_forwards]
                                [&_.ant-tabs-tabpane]:overflow-y-auto
                            `}
              style={{
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                height: "100%",
              }}
            />
          </div>
        );
      }
      // case 'orders':
      //   return (
      //     <div
      //       className="w-full !border-none px-6 pt-3 !h-[70vh] !rounded-2xl !overflow-y-auto"
      //       style={{ backgroundColor: "var(--bg-primary)" }}
      //     >
      //       {assessmentLoading ? (
      //         <div className="text-center py-8" style={{ color: 'var(--text-primary)' }}>
      //           Loading sections...
      //         </div>
      //       ) : assessmentData?.sections && assessmentData.sections.length > 0 ? (
      //         <OrderCard
      //           sections={assessmentData.sections}
      //           onSave={handleSectionReorder}
      //           onQuestionReorder={handleQuestionReorder}
      //           saving={reorderingSaving}
      //         />
      //       ) : (
      //         <div className="text-center py-8" style={{ color: 'var(--text-primary)' }}>
      //           No sections available. Please add sections first.
      //         </div>
      //       )}
      //     </div>
      //   );
      default:
        return (
          <div>
            <Title level={3} style={{ color: "var(--text-primary)" }}>
              Select a Menu Item
            </Title>
            <Paragraph style={{ color: "var(--text-primary)" }}>
              Choose an option from the menu to view its content.
            </Paragraph>
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}

      {/* Add Custom Field Modal */}
      <AddCustomFieldModal
        visible={showAddCustomFieldModal}
        onCancel={() => setShowAddCustomFieldModal(false)}
        onSuccess={() => setShowAddCustomFieldModal(false)}
        onCreateField={handleCreateCustomField}
        nextOrder={getNextCustomFieldOrder()}
      />
    </>
  );
}
