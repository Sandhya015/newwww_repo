import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { Col, Layout, Row } from "antd";
import { selectCurrentAssessment } from "../../store/miscSlice";
import {
  getGeneralSettings,
  updateGeneralSettings,
  createCustomField,
} from "../../lib/api";

const { Content } = Layout;

// Components
import QuestionSettingsHeader from "../../components/QuestionSettings/QuestionSettingsHeader";
import CardHeader from "../../components/QuestionSettings/CardHeader";
import CardMenu from "../../components/QuestionSettings/CardMenu";
import ContentCard from "../../components/QuestionSettings/ContentCard";

export default function QuestionSettings() {
  const [selectedMenuItem, setSelectedMenuItem] = useState("general");
  const [generalSettings, setGeneralSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalDuration, setTotalDuration] = useState("00:00:00");
  const currentAssessment = useSelector(selectCurrentAssessment);

  console.log(JSON.stringify(currentAssessment), "currentAssessment");

  const handleMenuChange = (key: string) => {
    setSelectedMenuItem(key);
  };

  // Fetch general settings when component mounts
  useEffect(() => {
    const fetchGeneralSettings = async () => {
      if (currentAssessment?.key) {
        setLoading(true);
        try {
          const response = await getGeneralSettings(currentAssessment.key);
          if (response.success) {
            setGeneralSettings(response.data);
            console.log("General Settings:", response.data);
          } else {
            console.error("Failed to fetch general settings:", response.data);
          }
        } catch (error) {
          console.error("Error fetching general settings:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGeneralSettings();
  }, [currentAssessment?.key]);

  // Function to handle standard field updates
  const handleFieldUpdate = async (
    fieldName: string,
    enabled: boolean,
    required: boolean
  ) => {
    if (!currentAssessment?.key || !generalSettings) return;

    setSaving(true);
    try {
      // Create the updated settings payload
      const updatedSettings = {
        candidate_details: {
          standard_fields: {
            full_name: {
              enabled:
                fieldName === "full_name"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.full_name
                      ?.enabled || false,
              required:
                fieldName === "full_name"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.full_name
                      ?.required || false,
              order: 1,
              type: "text",
              options: [],
            },
            email: {
              enabled:
                fieldName === "email"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.email?.enabled ||
                    false,
              required:
                fieldName === "email"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.email?.required ||
                    false,
              order: 2,
              type: "email",
              options: [],
            },
            mobile_number: {
              enabled:
                fieldName === "mobile_number"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.mobile_number
                      ?.enabled || false,
              required:
                fieldName === "mobile_number"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.mobile_number
                      ?.required || false,
              order: 3,
              type: "phone",
              options: [],
            },
            date_of_birth: {
              enabled:
                fieldName === "date_of_birth"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.date_of_birth
                      ?.enabled || false,
              required:
                fieldName === "date_of_birth"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.date_of_birth
                      ?.required || false,
              order: 4,
              type: "date",
              options: [],
            },
            passport: {
              enabled:
                fieldName === "passport"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.passport?.enabled ||
                    false,
              required:
                fieldName === "passport"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.passport
                      ?.required || false,
              order: 5,
              type: "text",
              options: [],
            },
            aadhar_number: {
              enabled:
                fieldName === "aadhar_number"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.aadhar_number
                      ?.enabled || false,
              required:
                fieldName === "aadhar_number"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.aadhar_number
                      ?.required || false,
              order: 6,
              type: "text",
              options: [],
            },
            pan_number: {
              enabled:
                fieldName === "pan_number"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.pan_number
                      ?.enabled || false,
              required:
                fieldName === "pan_number"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.pan_number
                      ?.required || false,
              order: 7,
              type: "text",
              options: [],
            },
            percentage_cgpa: {
              enabled:
                fieldName === "percentage_cgpa"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.percentage_cgpa
                      ?.enabled || false,
              required:
                fieldName === "percentage_cgpa"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.percentage_cgpa
                      ?.required || false,
              order: 8,
              type: "number",
              options: [],
            },
            notice_period: {
              enabled:
                fieldName === "notice_period"
                  ? enabled
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.notice_period
                      ?.enabled || false,
              required:
                fieldName === "notice_period"
                  ? required
                  : (generalSettings as any)?.general_settings
                      ?.candidate_details?.standard_fields?.notice_period
                      ?.required || false,
              order: 9,
              type: "number",
              options: [],
            },
          },
          custom_fields:
            (generalSettings as any)?.general_settings?.candidate_details
              ?.custom_fields || [],
        },
        cut_off_marks: {
          percentage:
            (generalSettings as any)?.general_settings?.cut_off_marks
              ?.percentage || 70,
        },
      };

      const response = await updateGeneralSettings(
        currentAssessment.key,
        updatedSettings
      );
      if (response.success) {
        // Refetch the settings to get updated data
        const fetchResponse = await getGeneralSettings(currentAssessment.key);
        if (fetchResponse.success) {
          setGeneralSettings(fetchResponse.data);
        }
        console.log("Field updated successfully");
      } else {
        console.error("Failed to update field:", response.data);
      }
    } catch (error) {
      console.error("Error updating field:", error);
    } finally {
      setSaving(false);
    }
  };

  // Function to handle custom field updates
  const handleCustomFieldUpdate = async (
    fieldId: string,
    enabled: boolean,
    required: boolean
  ) => {
    if (!currentAssessment?.key || !generalSettings) return;

    setSaving(true);
    try {
      // Get current custom fields
      const currentCustomFields =
        (generalSettings as any)?.general_settings?.candidate_details
          ?.custom_fields || [];

      // Update the specific custom field
      const updatedCustomFields = currentCustomFields.map((field: any) => {
        if (field.id === fieldId) {
          return {
            ...field,
            enabled,
            required,
          };
        }
        return field;
      });

      // Create the updated settings payload
      const updatedSettings = {
        candidate_details: {
          standard_fields:
            (generalSettings as any)?.general_settings?.candidate_details
              ?.standard_fields || {},
          custom_fields: updatedCustomFields,
        },
        cut_off_marks: {
          percentage:
            (generalSettings as any)?.general_settings?.cut_off_marks
              ?.percentage || 70,
        },
      };

      const response = await updateGeneralSettings(
        currentAssessment.key,
        updatedSettings
      );
      if (response.success) {
        // Refetch the settings to get updated data
        const fetchResponse = await getGeneralSettings(currentAssessment.key);
        if (fetchResponse.success) {
          setGeneralSettings(fetchResponse.data);
        }
        console.log("Custom field updated successfully");
      } else {
        console.error("Failed to update custom field:", response.data);
      }
    } catch (error) {
      console.error("Error updating custom field:", error);
    } finally {
      setSaving(false);
    }
  };

  // Function to handle custom field creation
  const handleCreateCustomField = async (
    fieldData: Record<string, unknown>
  ) => {
    if (!currentAssessment?.key) return;

    try {
      // Process options if provided
      const processedFieldData = {
        ...fieldData,
        options:
          fieldData.options && typeof fieldData.options === "string"
            ? fieldData.options
                .split(",")
                .map((opt) => opt.trim())
                .filter((opt) => opt)
            : fieldData.options || [],
      };

      const response = await createCustomField(
        currentAssessment.key,
        processedFieldData
      );
      if (response.success) {
        // Refetch the settings to get updated data
        const fetchResponse = await getGeneralSettings(currentAssessment.key);
        if (fetchResponse.success) {
          setGeneralSettings(fetchResponse.data);
        }
        console.log("Custom field created successfully");
      } else {
        console.error("Failed to create custom field:", response.data);
        throw new Error("Failed to create custom field");
      }
    } catch (error) {
      console.error("Error creating custom field:", error);
      throw error;
    }
  };

  return (
    <>
      {/* Question Settings Header */}
      <QuestionSettingsHeader
        currentAssessment={
          currentAssessment as unknown as Record<string, unknown>
        }
        totalDuration={totalDuration}
      />

      <Row align="top" justify="center" className="mt-3 sm:mt-4 md:mt-5">
        <Col
          className="w-full mb-6 sm:mb-8 md:mb-9 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <Layout className="!min-h-screen">
            {/* Card Header */}
            <CardHeader 
              selectedMenuItem={selectedMenuItem}
              onMenuChange={handleMenuChange}
            />

            <Layout>
              {/* Card Menu */}
              <CardMenu
                onMenuChange={handleMenuChange}
                selectedKey={selectedMenuItem}
              />

              <Layout style={{ backgroundColor: "var(--bg-primary)" }}>
                {/* Content Card */}
                <Content
                  className="pl-3 sm:pl-6 md:pl-8 pt-4 sm:pt-6 md:pt-8"
                  style={{ color: "var(--text-primary)" }}
                >
                  {/* <ContentCard /> */}
                  <ContentCard
                    selectedMenuItem={selectedMenuItem}
                    generalSettings={generalSettings}
                    loading={loading}
                    saving={saving}
                    onFieldUpdate={handleFieldUpdate}
                    onCustomFieldUpdate={handleCustomFieldUpdate}
                    onCreateCustomField={handleCreateCustomField}
                    onTotalDurationChange={setTotalDuration}
                  />
                </Content>
              </Layout>
            </Layout>
          </Layout>
        </Col>
      </Row>
    </>
  );
}
