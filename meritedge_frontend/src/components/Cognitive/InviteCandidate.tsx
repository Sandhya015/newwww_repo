import { useState, useEffect, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import {
  Button,
  Col,
  Divider,
  Input,
  Row,
  Segmented,
  Table,
  TableColumnsType,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  UserOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { inviteCandidates } from "../../lib/api";
import { showToast } from "../../utils/toast";
import * as XLSX from "xlsx";

const { Text } = Typography;
const { Dragger } = Upload;

const headerCellRenderer = (
  props: HTMLAttributes<HTMLTableCellElement>
) => {
  const { style, ...restProps } = props;
  const mergedStyle: CSSProperties = {
    ...(((style as CSSProperties) ?? {}) as CSSProperties),
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    borderColor: "var(--border-primary)",
  };

  return <th {...restProps} style={mergedStyle} />;
};

const bodyCellRenderer = (
  props: HTMLAttributes<HTMLTableCellElement>
) => {
  const { style, ...restProps } = props;
  const mergedStyle: CSSProperties = {
    ...(((style as CSSProperties) ?? {}) as CSSProperties),
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    borderColor: "var(--border-primary)",
  };

  return <td {...restProps} style={mergedStyle} />;
};

const bodyRowRenderer = (
  props: HTMLAttributes<HTMLTableRowElement>
) => {
  const { style, ...restProps } = props;
  const mergedStyle: CSSProperties = {
    ...(((style as CSSProperties) ?? {}) as CSSProperties),
    backgroundColor: "var(--bg-primary)",
  };

  return <tr {...restProps} style={mergedStyle} />;
};

interface TestDataType {
  key: React.Key;
  name: string;
  email_id: string;
  phone_number: string;
  country_code: string;
  status: string;
}

interface InviteResult {
  full_name: string;
  email: string;
  mobile_number: string;
  status: string;
  invite_id: string | null;
  candidate_jwt: string | null;
  error_message: string | null;
  error_code: string | null;
  email_sent: boolean;
  email_error: string | null;
}

interface InviteSummary {
  assessment_id: string;
  total_requested: number;
  successful_invites: number;
  created_no_email: number;
  failed_validation: number;
  failed_duplicate: number;
  failed_assessment: number;
  failed_email: number;
  failed_system: number;
  total_created: number;
  total_failed: number;
  processing_time_ms: number;
}

interface BulkInviteResponse {
  summary: InviteSummary;
  results: InviteResult[];
}

interface InviteCandidateProps {
  readonly handleInviteCandidateOk: () => void;
  readonly clearAllInviteCandidateSelection: () => void;
  readonly selectedRowKeys: React.Key[];
  readonly rowSelection: Record<string, unknown>;
  readonly assessmentId: string;
  readonly onCandidateAdded?: (key: React.Key) => void;
  readonly resetCandidateList?: boolean;
  readonly onCandidateRemoved?: (key: React.Key) => void;
}

export default function InviteCandidate({
  handleInviteCandidateOk,
  clearAllInviteCandidateSelection,
  selectedRowKeys,
  rowSelection,
  assessmentId,
  onCandidateAdded,
  resetCandidateList,
  onCandidateRemoved,
}: Readonly<InviteCandidateProps>) {
  const [inviteMode, setSelectedInviteMode] = useState<string>("Manual");
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    country_code: "",
    send_email_notification: true,
  });
  const [candidateList, setCandidateList] = useState<TestDataType[]>([]);
  const [isParsingUpload, setIsParsingUpload] = useState(false);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    country_code: "",
  });

  // Clear candidate list when modal is closed and reopened
  useEffect(() => {
    if (resetCandidateList) {
      setCandidateList([]);
      clearAllInviteCandidateSelection();
    }
  }, [resetCandidateList, clearAllInviteCandidateSelection]);

  // Log the assessmentId to verify it's being passed correctly
  console.log("InviteCandidate - assessmentId:", assessmentId);

  // Function to reset form data
  const resetFormData = () => {
    setFormData({
      full_name: "",
      email: "",
      mobile_number: "",
      country_code: "",
      send_email_notification: true,
    });
    setValidationErrors({
      full_name: "",
      email: "",
      mobile_number: "",
      country_code: "",
    });
  };

  const previousAssessmentIdRef = useRef<string | null>(null);

  useEffect(() => {
  if (!assessmentId) {
    return;
  }

  if (
    previousAssessmentIdRef.current &&
    previousAssessmentIdRef.current !== assessmentId
  ) {
    setCandidateList([]);
    clearAllInviteCandidateSelection();
    resetFormData();
  }

  previousAssessmentIdRef.current = assessmentId;
  }, [assessmentId, clearAllInviteCandidateSelection]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (field in validationErrors) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const generateCandidateKey = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const parseBulkUploadFile = (file: File) => {
    setIsParsingUpload(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(
          worksheet,
          { defval: "" }
        );

        if (!rows.length) {
          message.error("Uploaded file is empty.");
          return;
        }

        const existingEmails = new Set(
          candidateList.map((candidate) => candidate.email_id.toLowerCase())
        );

        const newCandidates: TestDataType[] = [];
        const skippedRows: string[] = [];
        const duplicateEmails: string[] = [];

        rows.forEach((row, index) => {
          const fullName = String(
            row["full_name"] ?? row["Full Name"] ?? row["name"] ?? ""
          ).trim();
          const email = String(
            row["email"] ?? row["Email"] ?? row["email_id"] ?? ""
          ).trim();
          const mobileNumber = String(
            row["mobile_number"] ??
              row["Mobile Number"] ??
              row["phone"] ??
              row["Phone"] ??
              ""
          ).trim();
          const countryCode = String(
            row["country_code"] ?? row["Country Code"] ?? row["code"] ?? ""
          ).trim();

          if (!email) {
            skippedRows.push(`#${index + 2}`);
            return;
          }

          if (existingEmails.has(email.toLowerCase())) {
            duplicateEmails.push(email);
            return;
          }

          existingEmails.add(email.toLowerCase());

          newCandidates.push({
            key: generateCandidateKey(),
            name: fullName || "",
            email_id: email,
            phone_number: mobileNumber,
            country_code: countryCode,
            status: "Pending Invite",
          });
        });

        if (newCandidates.length) {
          setCandidateList((prev) => [...prev, ...newCandidates]);
          newCandidates.forEach((candidate) => {
            onCandidateAdded?.(candidate.key);
          });
          message.success(
            `Added ${newCandidates.length} candidate${
              newCandidates.length === 1 ? "" : "s"
            } from file.`
          );
        }

        if (duplicateEmails.length) {
          message.warning(
            `Skipped ${duplicateEmails.length} duplicate email${
              duplicateEmails.length === 1 ? "" : "s"
            }.`
          );
        }

        if (skippedRows.length) {
          message.warning(
            `Skipped ${skippedRows.length} row${
              skippedRows.length === 1 ? "" : "s"
            } without email.`
          );
        }
      } catch (error) {
        console.error("Bulk upload parsing error:", error);
        message.error("Failed to parse the uploaded file. Please try again.");
      } finally {
        setIsParsingUpload(false);
      }
    };

    reader.onerror = () => {
      setIsParsingUpload(false);
      message.error("Failed to read the uploaded file. Please try again.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkUploadBeforeUpload: UploadProps["beforeUpload"] = (file) => {
    const allowedExtensions = ["csv", "xls", "xlsx"];
    const name = file.name || "";
    const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
    const allowedTypes = new Set([
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);

    if (!ext || !allowedExtensions.includes(ext) || (file.type && !allowedTypes.has(file.type))) {
      showToast({
        message: "Only CSV or Excel files are allowed",
        description: ".csv, .xls, .xlsx",
        type: "error",
        duration: 4000,
        position: "top-right",
      });
      return Upload.LIST_IGNORE;
    }

    parseBulkUploadFile(file as File);
    return Upload.LIST_IGNORE;
  };

  // Download sample templates for Bulk Upload
  const downloadSampleCSV = () => {
    const csvHeader = "full_name,email,mobile_number,country_code\n";
    const csvSampleRows = [
      '"John Doe","john.doe@example.com","9876543210","+91"',
      '"Jane","jane@example.com","",""',
    ];
    const csvContent = csvHeader + csvSampleRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidate-bulk-upload-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = () => {
    // Provide CSV content but download with .xlsx extension for user convenience
    const csvHeader = "full_name,email,mobile_number,country_code\n";
    const csvSampleRows = [
      '"John Doe","john.doe@example.com","9876543210","+91"',
      '"Jane","jane@example.com","",""',
    ];
    const csvContent = csvHeader + csvSampleRows.join("\n");
    const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidate-bulk-upload-sample.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle form submission - add to table
  const handleAddToTable = () => {
    // Reset validation errors
    const errors = {
      full_name: "",
      email: "",
      mobile_number: "",
      country_code: "",
    };

    // Validate optional fields
    let hasError = false;

    // Optional: Validate phone number format if provided
    if (formData.mobile_number.trim()) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.mobile_number.trim())) {
        errors.mobile_number =
          "Please enter a valid phone number (10-15 digits)";
        hasError = true;
      }
    }

    // Optional: Validate country code format if provided
    if (formData.country_code.trim()) {
      const countryCodeRegex = /^\+[0-9]{1,4}$/;
      if (!countryCodeRegex.test(formData.country_code.trim())) {
        errors.country_code = "Please enter a valid country code (e.g., +91)";
        hasError = true;
      }
    }

    // Validate required fields - only email is mandatory
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      hasError = true;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
        hasError = true;
      }
    }

    // Update validation errors state
    setValidationErrors(errors);

    // If there are errors, don't proceed
    if (hasError) {
      return;
    }

    // Check if email already exists
    const emailExists = candidateList.some(
      (candidate) => candidate.email_id === formData.email.trim()
    );
    if (emailExists) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "A candidate with this email already exists",
      }));
      return;
    }

    // Add new candidate to the list
    const newCandidate: TestDataType = {
      key: Date.now().toString(), // Simple unique key
      name: formData.full_name.trim(),
      email_id: formData.email.trim(),
      phone_number: formData.mobile_number.trim(),
      country_code: formData.country_code.trim(),
      status: "Pending Invite",
    };

    setCandidateList((prev) => [...prev, newCandidate]);
    message.success("Candidate added to list!");

    // Auto-select the newly added candidate
    if (onCandidateAdded) {
      onCandidateAdded(newCandidate.key);
    }

    // Reset form
    resetFormData();
  };

  // Remove a candidate from the list
  const handleRemoveCandidate = (key: React.Key) => {
    const updatedList = candidateList.filter((candidate) => candidate.key !== key);
    setCandidateList(updatedList);
    onCandidateRemoved?.(key);
  };

  // Handle sending invites for selected candidates
  const handleSendInvites = async () => {
    if (!assessmentId) {
      message.error("Assessment ID is required");
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.error("Please select candidates to invite");
      return;
    }

    setIsSendingInvites(true);

    try {
      // Get selected candidates
      const selectedCandidates = candidateList.filter((candidate) =>
        selectedRowKeys.includes(candidate.key)
      );

      // Prepare candidates array for bulk invite API
      const candidatesData = selectedCandidates.map((candidate) => ({
        assessment_id: assessmentId,
        full_name: candidate.name,
        email: candidate.email_id,
        mobile_number: candidate.phone_number,
        country_code: candidate.country_code,
        send_email_notification: formData.send_email_notification,
      }));

      // Call bulk invite API
      const response = await inviteCandidates({ candidates: candidatesData });

      console.log("=== BULK INVITE RESPONSE START ===");
      console.log("Full Response:", JSON.stringify(response, null, 2));
      console.log("=== BULK INVITE RESPONSE END ===");

      if (!response.success) {
        // API call itself failed
        showToast({
          message: "Error",
          description: "Failed to send invites. Please try again.",
          position: "top-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      // Process the response
      const { summary, results } = response.data as BulkInviteResponse;

      console.log("Summary:", summary);
      console.log("Results:", results);

      // Process results to categorize invites
      const successfulEmails: string[] = [];
      const failedResults = results.filter((result: InviteResult) => {
        if (
          result.status === "success" ||
          result.status === "created_no_email"
        ) {
          successfulEmails.push(result.email);
          return false;
        }
        return true;
      });

      const duplicateResults = results.filter(
        (result: InviteResult) => result.status === "failed_duplicate"
      );

      console.log("Successful invites:", summary.successful_invites);
      console.log("Failed invites:", summary.total_failed);
      console.log("Duplicate invites:", summary.failed_duplicate);

      // Show duplicate errors
      if (duplicateResults.length > 0) {
        duplicateResults.forEach((result: InviteResult) => {
          showToast({
            message: "Already Invited",
            description: `${result.full_name} (${result.email}) has already been invited to take this test.`,
            position: "top-right",
            duration: 6000,
            type: "error",
          });
        });
      }

      // Show other failures
      const otherFailures = failedResults.filter(
        (result: InviteResult) => result.status !== "failed_duplicate"
      );

      if (otherFailures.length > 0) {
        otherFailures.forEach((result: InviteResult) => {
          showToast({
            message: "Invitation Failed",
            description: `Failed to invite ${result.full_name} (${
              result.email
            }). ${result.error_message || "Please try again."}`,
            position: "top-right",
            duration: 5000,
            type: "error",
          });
        });
      }

      // Show success message if any succeeded
      if (summary.successful_invites > 0 || summary.created_no_email > 0) {
        const totalSuccess =
          summary.successful_invites + summary.created_no_email;
        showToast({
          message: "Invitations Sent Successfully",
          description: `Successfully sent ${totalSuccess} invite(s)!`,
          position: "top-right",
          duration: 3000,
          type: "success",
        });
      }

      // Handle post-invite actions
      if (summary.total_failed === 0 && summary.total_created > 0) {
        // All invites were successful, clear the list and close modal
        console.log("All invites successful - clearing list and closing modal");
        setCandidateList([]);
        clearAllInviteCandidateSelection();
        // Clear form fields
        resetFormData();
        handleInviteCandidateOk();
      } else if (summary.total_created > 0 && summary.total_failed > 0) {
        // Some succeeded, some failed - remove only successful ones
        console.log("Mixed results - removing successful candidates from list");
        setCandidateList((prev) =>
          prev.filter((c) => !successfulEmails.includes(c.email_id))
        );
        clearAllInviteCandidateSelection();
        // Clear form fields when some invites succeed
        resetFormData();
      } else if (summary.total_failed > 0 && summary.total_created === 0) {
        // All failed - just clear selection, keep the candidates for retry
        console.log("All invites failed - keeping candidates in list");
        clearAllInviteCandidateSelection();
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      showToast({
        message: "Error",
        description: "Failed to send invites. Please try again.",
        position: "top-right",
        duration: 5000,
        type: "error",
      });
    } finally {
      setIsSendingInvites(false);
    }
  };

  const columns: TableColumnsType<TestDataType> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 280,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Email ID",
      dataIndex: "email_id",
      key: "email_id",
      width: 280,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Phone number",
      dataIndex: "phone_number",
      key: "phone_number",
      width: 200,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Country Code",
      dataIndex: "country_code",
      key: "country_code",
      width: 120,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "",
      key: "remove",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          aria-label="Remove candidate"
          className="!text-[#F87171]"
          icon={<CloseOutlined />}
          onClick={() => handleRemoveCandidate(record.key)}
        />
      ),
    },
    // {
    //     title: 'Status',
    //     dataIndex: 'status',
    //     key: 'status',
    //     width: 115,
    //     sorter: true,
    //     render: (status) => {
    //         let color = '';
    //         let backgroundColor = '';
    //         let icon = null;
    //         switch (status) {
    //             case 'Pending Invite':
    //                 color = '#ffffff';
    //                 backgroundColor = '#2C1E15';
    //                 icon = <img src={`${import.meta.env.BASE_URL}cognitive/smiley-sad.svg`} />;
    //                 break;
    //             case 'Invite Sent':
    //                 color = '#ffffff';
    //                 backgroundColor = '#11331F  ';
    //                 icon = <img src={`${import.meta.env.BASE_URL}cognitive/check-fat.svg`} />;
    //                 break;
    //             default:
    //                 color = '#fff';
    //                 backgroundColor = '#1f1f1f';
    //                 icon = <img src={`${import.meta.env.BASE_URL}cognitive/smiley-sad.svg`} />;
    //         }
    //         return (
    //             <span
    //                 className="!flex !items-center !justify-center gap-2 !w-auto !rounded-full"
    //                 style={{
    //                     color,
    //                     backgroundColor,
    //                     padding: '4px 8px',
    //                     borderRadius: '4px',
    //                     fontSize: '12px',
    //                     fontWeight: '500',
    //                 }}
    //             >
    //                 {icon} {status}
    //             </span>
    //         );
    //     },
    // },
  ];

  return (
    <>
      <Row align="middle" gutter={[8, 8]} className="p-2 sm:p-3">
        <Col xs={24} sm={12} md={8}>
          <Segmented
            options={["Manual", "Bulk Upload"]}
            value={inviteMode}
            onChange={(val) => setSelectedInviteMode(val as string)}
            className={`
                        !mb-3 sm:!mb-5
                        !bg-[var(--bg-secondary)]
                        !border !border-[var(--border-primary)]
                        !rounded-full !h-10 sm:!h-12/2 !px-1 !py-1 
                        !text-[var(--text-primary)] !font-medium
                        !text-xs sm:!text-sm

                        [&_.ant-segmented-item]:!bg-transparent
                        [&_.ant-segmented-item]:!text-[var(--text-primary)]
                        [&_.ant-segmented-item]:!rounded-full
                        [&_.ant-segmented-item]:!h-8 sm:[&_.ant-segmented-item]:!h-9
                        [&_.ant-segmented-item]:!px-3 sm:[&_.ant-segmented-item]:!px-4
                        [&_.ant-segmented-item]:!py-3 sm:[&_.ant-segmented-item]:!py-4
                        [&_.ant-segmented-item]:!flex
                        [&_.ant-segmented-item]:!items-center
                        [&_.ant-segmented-item]:!justify-center

                        [&_.ant-segmented-item-selected]:!bg-[var(--bg-tertiary)]
                        [&_.ant-segmented-item-selected]:!text-[var(--text-primary)]
                        [&_.ant-segmented-item-selected]:!rounded-full

                        [&_.ant-segmented-thumb]:!bg-[var(--bg-tertiary)]
                        [&_.ant-segmented-thumb]:!rounded-full
                        [&_.ant-segmented-thumb]:!h-8 sm:[&_.ant-segmented-thumb]:!h-9
                        [&_.ant-segmented-thumb]:!flex
                        [&_.ant-segmented-thumb]:!items-center
                    `}
          />
        </Col>

        {inviteMode === "Bulk Upload" && (
          <Col
            xs={24}
            sm={12}
            md={16}
            className="text-xs sm:text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            To get started use our sample template{" "}
            <a
              href="/candidate-bulk-upload-sample.csv"
              download="candidate-bulk-upload-sample.csv"
              onClick={(e) => {
                e.preventDefault();
                downloadSampleCSV();
              }}
              className="text-[#C4B5FD] underline font-semibold cursor-pointer"
            >
              CSV
            </a>{" "}
            or{" "}
            <a
              href="/candidate-bulk-upload-sample.xlsx"
              download="candidate-bulk-upload-sample.xlsx"
              onClick={(e) => {
                e.preventDefault();
                downloadSampleExcel();
              }}
              className="text-[#C4B5FD] underline font-semibold cursor-pointer"
            >
              Excel
            </a>
          </Col>
        )}
      </Row>

      {inviteMode === "Manual" && (
        <div style={{ width: "100%", position: "relative" }}>
          <Row
            align="middle"
            gutter={[8, 16]}
            className="px-2 sm:px-3 md:px-[10px]"
          >
            <Col xs={24} sm={12} md={6} lg={5}>
              <label
                htmlFor="full_name"
                className="font-semibold text-xs sm:text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Name
              </label>
              <Input
                id="full_name"
                placeholder="Enter name"
                prefix={<UserOutlined />}
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="!h-9 sm:!h-10 md:!h-12 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base !text-[var(--text-primary)] !bg-[var(--bg-secondary)] !placeholder-[var(--text-secondary)] [&>input::placeholder]:!text-[var(--text-secondary)]"
                style={{
                  borderColor: validationErrors.full_name
                    ? "#ff4d4f"
                    : "var(--border-primary)",
                }}
              />
              {validationErrors.full_name && (
                <Text
                  className="!text-xs sm:!text-sm !mt-1 block"
                  style={{ color: "#ff4d4f" }}
                >
                  {validationErrors.full_name}
                </Text>
              )}
            </Col>
            <Col xs={24} sm={12} md={6} lg={5}>
              <label
                htmlFor="email"
                className="font-semibold text-xs sm:text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Email ID <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <Input
                id="email"
                placeholder="Enter Email"
                prefix={<MailOutlined />}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="!h-9 sm:!h-10 md:!h-12 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base !text-[var(--text-primary)] !bg-[var(--bg-secondary)] !placeholder-[var(--text-secondary)] [&>input::placeholder]:!text-[var(--text-secondary)]"
                style={{
                  borderColor: validationErrors.email
                    ? "#ff4d4f"
                    : "var(--border-primary)",
                }}
              />
              {validationErrors.email && (
                <Text
                  className="!text-xs sm:!text-sm !mt-1 block"
                  style={{ color: "#ff4d4f" }}
                >
                  {validationErrors.email}
                </Text>
              )}
            </Col>
            <Col xs={12} sm={12} md={5} lg={4}>
              <label
                htmlFor="mobile_number"
                className="font-semibold text-xs sm:text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Phone{" "}
                <span
                  className="hidden md:inline"
                  style={{ color: "var(--text-secondary)" }}
                >
                  (Optional)
                </span>
              </label>
              <Input
                id="mobile_number"
                placeholder="Phone"
                prefix={<PhoneOutlined className="rotate-90" />}
                value={formData.mobile_number}
                onChange={(e) =>
                  handleInputChange("mobile_number", e.target.value)
                }
                className="!h-9 sm:!h-10 md:!h-12 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base !text-[var(--text-primary)] !bg-[var(--bg-secondary)] !placeholder-[var(--text-secondary)] [&>input::placeholder]:!text-[var(--text-secondary)]"
                style={{
                  borderColor: validationErrors.mobile_number
                    ? "#ff4d4f"
                    : "var(--border-primary)",
                }}
              />
              {validationErrors.mobile_number && (
                <Text
                  className="!text-xs sm:!text-sm !mt-1 block"
                  style={{ color: "#ff4d4f" }}
                >
                  {validationErrors.mobile_number}
                </Text>
              )}
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              <label
                htmlFor="country_code"
                className="font-semibold text-xs sm:text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Code{" "}
                <span
                  className="hidden md:inline"
                  style={{ color: "var(--text-secondary)" }}
                >
                  (Optional)
                </span>
              </label>
              <Input
                id="country_code"
                placeholder="+91"
                value={formData.country_code}
                onChange={(e) =>
                  handleInputChange("country_code", e.target.value)
                }
                className="!h-9 sm:!h-10 md:!h-12 !pl-2 sm:!pl-3 !mt-2 !rounded-xl !text-sm sm:!text-base !text-[var(--text-primary)] !bg-[var(--bg-secondary)] !placeholder-[var(--text-secondary)] [&>input::placeholder]:!text-[var(--text-secondary)]"
                style={{
                  borderColor: validationErrors.country_code
                    ? "#ff4d4f"
                    : "var(--border-primary)",
                }}
              />
              {validationErrors.country_code && (
                <Text
                  className="!text-xs sm:!text-sm !mt-1 block"
                  style={{ color: "#ff4d4f" }}
                >
                  {validationErrors.country_code}
                </Text>
              )}
            </Col>
            <Col xs={24} sm={4} md={3} lg={2}>
              <Button
                onClick={handleAddToTable}
                className="!rounded-full !h-9 sm:!h-10 md:!h-11 !w-full sm:!w-20 md:!w-28 !mt-2 sm:!mt-7 !text-xs sm:!text-sm"
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
              >
                Add
              </Button>
            </Col>
          </Row>

          <Divider
            type="horizontal"
            size="small"
            className="!h-[1px] !mt-6 sm:!mt-8 !mb-4 sm:!mb-6"
            style={{ backgroundColor: "var(--border-primary)" }}
          />

          <Row
            align="middle"
            justify="space-between"
            className="mb-2 sm:mb-3 px-2 sm:px-3 md:px-[10px] text-xs sm:text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            <Col className="font-semibold">
              Candidate list ({candidateList?.length})
            </Col>
            <Col className="font-semibold">
              Selected: {selectedRowKeys?.length}
            </Col>
          </Row>

          <Row className="px-2 sm:px-3 md:px-[10px]">
            <Col span={24}>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={candidateList}
                pagination={{
                  // current: currentPage,
                  // pageSize: pageSize,
                  // total: candidateList.length,
                  showSizeChanger: true,
                  pageSizeOptions: ["17", "30", "50"],
                  showQuickJumper: window.innerWidth >= 768,
                  showTotal: (total, range) =>
                    window.innerWidth >= 640
                      ? `${range[0]}-${range[1]} of ${total} items`
                      : `${range[0]}-${range[1]}`,
                  // onChange: (page, size) => {
                  //     setCurrentPage(page);
                  //     setPageSize(size || 17);
                  // },
                  style: {
                    marginTop: "12px",
                    textAlign: "center",
                    color: "var(--text-primary)",
                  },
                  simple: window.innerWidth < 640,
                }}
                scroll={{ x: 800 }}
                size="small"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  width: "100%",
                  overflowX: "auto",
                }}
                className="theme-aware-table"
                components={{
                  header: {
                    cell: headerCellRenderer,
                  },
                  body: {
                    cell: bodyCellRenderer,
                    row: bodyRowRenderer,
                  },
                }}
              />
            </Col>
          </Row>

          <Row
            gutter={[8, 8]}
            align="middle"
            justify="end"
            className="p-2 sm:p-3 md:px-[30px] md:py-[10px] flex-wrap"
          >
            <Col xs={12} sm={6} md={4}>
              <div className="group !relative !w-full !rounded-full !overflow-hidden">
                <div
                  className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 90deg at 50% 50%, #1E1E1E 90deg, #C401F7 165deg, #4700EA 179deg, #00A6E8 190deg, #1E1E1E 270deg)",
                  }}
                />

                <Button
                  className="!backdrop-blur-[10px] !rounded-full !border-none flex items-center justify-center !px-3 sm:!px-4 md:!px-5 !py-2 sm:!py-3 !m-[1.5px] !text-xs sm:!text-sm !w-full !h-9 sm:!h-10 md:!h-11"
                  style={{ backgroundColor: "#5B21B6", color: "#ffffff" }}
                  onClick={handleSendInvites}
                  loading={isSendingInvites}
                  disabled={isSendingInvites || selectedRowKeys.length === 0}
                  onMouseEnter={(e) => {
                    if (!isSendingInvites && selectedRowKeys.length > 0) {
                      e.currentTarget.style.backgroundColor = "#4C1D95";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSendingInvites && selectedRowKeys.length > 0) {
                      e.currentTarget.style.backgroundColor = "#5B21B6";
                    }
                  }}
                >
                  {!isSendingInvites && (
                    <img
                      src={`${
                        import.meta.env.BASE_URL
                      }cognitive/paper-plane-tilt.svg`}
                      className="h-3 sm:h-4"
                      alt="Send"
                    />
                  )}
                  <span className={isSendingInvites ? "" : "ml-2"}>
                    {isSendingInvites ? "Sending..." : "Send Invite"}
                  </span>
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {inviteMode === "Bulk Upload" && (
        <div style={{ width: "100%", position: "relative" }}>
          {/* <Row align="middle" gutter={10}>
                        <Col flex="auto">
                            <Row
                                align="middle"
                                style={{
                                    backgroundColor: "#0f1014",
                                    borderRadius: "10px",
                                    border: "1px solid #23263c",
                                    padding: "10px 20px",
                                }}
                            >
                                <Col>
                                    <UploadOutlined style={{ fontSize: "15px", color: "#657283" }} />
                                </Col>
                                <Col>
                                    <p
                                        style={{
                                            fontFamily: "'Roboto-Regular', Helvetica",
                                            fontSize: "14px",
                                            color: "#657283",
                                            margin: 0,
                                        }}
                                    >
                                        Choose a file to upload .xlsx or .csv to invite multiple
                                        candidates.
                                    </p>
                                </Col>
                            </Row>
                        </Col>
                    </Row> */}

          <Row align="middle" gutter={10} className="px-2">
            <Col flex="auto">
              <Text
                strong
                className="block mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Upload file
              </Text>
              <Dragger
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-primary)",
                }}
                className="!rounded-xl"
                accept={".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"}
                beforeUpload={handleBulkUploadBeforeUpload}
                disabled={isParsingUpload}
              >
                <Row align="middle" gutter={12} justify="start">
                  <Col>
                    <UploadOutlined
                      style={{
                        fontSize: "16px",
                        color: "var(--text-secondary)",
                      }}
                    />
                  </Col>
                  <Col>
                    <p
                      style={{
                        fontFamily: "'Roboto-Regular', Helvetica",
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                        margin: 0,
                      }}
                    >
                      Choose a file to upload .xlsx or .csv to invite multiple
                      candidates.
                    </p>
                  </Col>
                </Row>
              </Dragger>
            </Col>
          </Row>

          <Divider
            type="horizontal"
            size="small"
            className="!h-[1px] !mt-8 !mb-6"
            style={{ backgroundColor: "var(--border-primary)" }}
          />

          <Row
            align="middle"
            justify="space-between"
            className="mb-3"
            style={{ padding: "0 10px", color: "var(--text-primary)" }}
          >
            <Col className="font-semibold">
              Candidate list ({candidateList?.length})
            </Col>
            <Col className="font-semibold">
              Selected Candidate: {selectedRowKeys?.length}
            </Col>
          </Row>

          <Row style={{ padding: "0 10px" }}>
            <Col span={24}>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={candidateList}
                pagination={{
                  // current: currentPage,
                  // pageSize: pageSize,
                  // total: candidateList.length,
                  showSizeChanger: true,
                  pageSizeOptions: ["17", "30", "50"],
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  // onChange: (page, size) => {
                  //     setCurrentPage(page);
                  //     setPageSize(size || 17);
                  // },
                  style: {
                    marginTop: "16px",
                    textAlign: "center",
                    color: "var(--text-primary)",
                  },
                }}
                scroll={{ x: true }}
                size="middle"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  width: "100%",
                  overflowX: "auto",
                }}
                className="theme-aware-table"
                components={{
                  header: {
                    cell: headerCellRenderer,
                  },
                  body: {
                    cell: bodyCellRenderer,
                    row: bodyRowRenderer,
                  },
                }}
              />
            </Col>
          </Row>

          <Row
            gutter={10}
            align="middle"
            justify="end"
            style={{ padding: "10px 30px" }}
          >
            <Col>
              <div className="group !relative !w-full !rounded-full !overflow-hidden">
                <div
                  className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 90deg at 50% 50%, #1E1E1E 90deg, #C401F7 165deg, #4700EA 179deg, #00A6E8 190deg, #1E1E1E 270deg)",
                  }}
                />

                <Button
                  className={`!backdrop-blur-[10px] !rounded-full !border-none flex items-center justify-center !px-4 sm:!px-5 md:!px-6 !py-2 sm:!py-3 !m-[1.5px] !text-xs sm:!text-sm !w-52 !h-11`}
                  style={{ backgroundColor: "#5B21B6", color: "#ffffff" }}
                  onClick={handleSendInvites}
                  loading={isSendingInvites}
                  disabled={isSendingInvites || selectedRowKeys.length === 0}
                  onMouseEnter={(e) => {
                    if (!isSendingInvites && selectedRowKeys.length > 0) {
                      e.currentTarget.style.backgroundColor = "#4C1D95";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSendingInvites && selectedRowKeys.length > 0) {
                      e.currentTarget.style.backgroundColor = "#5B21B6";
                    }
                  }}
                >
                  {!isSendingInvites && (
                    <img
                      src={`${
                        import.meta.env.BASE_URL
                      }cognitive/paper-plane-tilt.svg`}
                      className="h-3 sm:h-4"
                      alt="Send"
                    />
                  )}
                  <span className={isSendingInvites ? "" : "ml-2"}>
                    {isSendingInvites ? "Sending..." : "Send Invite"}
                  </span>
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </>
  );
}
