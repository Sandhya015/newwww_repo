import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  SearchOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Input, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getCandidateReports, getAssessment, resendCandidateInvite, reinviteCandidate } from "../../lib/api";
import { showToast } from "../../utils/toast";

// Types for candidate data
interface CandidateData {
  key: string;
  email: string;
  invitedAt: string;
  creditReversedAt: string;
  status: "attempted" | "unattempted";
  candidateId: string;
  assessmentId?: string;
  fullName?: string;
  mobileNumber?: string;
  countryCode?: string;
  inviteId?: string;
  // Additional fields for attempted candidates
  completeAt?: string;
  violation?: string;
  timeTaken?: string;
  totalScore?: number;
  scorePercentage?: number;
  reports?: string;
}

type ApiCandidate = {
  candidate_id: string;
  status: string;
  assessment_id?: string;
  invite_id?: string;
  candidate_info?: {
    email?: string;
    invited_at?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
    country_code?: string;
    invite_id?: string;
  };
  invite_details?: {
    assessment_id?: string;
    full_name?: string;
    mobile_number?: string;
    country_code?: string;
    invite_id?: string;
  };
  assessment_evaluation?: {
    proctoring_analysis?: {
      violation_analysis?: {
        total_violations?: string | number;
      };
      summary?: {
        total_videos_analyzed?: string | number;
      };
    };
    assessment_performance?: {
      overall_metrics?: {
        total_time_spent_seconds?: string | number;
        score_percentage?: string | number;
      };
      assessment_completed_at?: string;
    };
  };
};

// Updated dummy data for the new design
const candidateData: CandidateData[] = [
  // Attempted candidates with full data
  {
    key: "1",
    email: "sophia.martinez789@gmail.com",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_1",
    completeAt: "27 Apr 2024, 03:22 PM",
    violation: "20/45",
    timeTaken: "00:00:52",
    totalScore: 68,
    scorePercentage: 68,
    reports: "View Candidate Report",
  },
  {
    key: "2",
    email: "michael.johnson987@gmail.com",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_2",
    completeAt: "28 Apr 2024, 11:15 AM",
    violation: "15/45",
    timeTaken: "00:45:30",
    totalScore: 85,
    scorePercentage: 85,
    reports: "View Candidate Report",
  },
  {
    key: "3",
    email: "linda.smith321@gmail.com",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_4",
    completeAt: "30 Apr 2024, 09:30 AM",
    violation: "10/45",
    timeTaken: "00:38:42",
    totalScore: 92,
    scorePercentage: 92,
    reports: "View Candidate Report",
  },
  {
    key: "4",
    email: "alex.rodriguez@devteam.net",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_5",
    completeAt: "01 May 2024, 04:20 PM",
    violation: "30/45",
    timeTaken: "01:25:08",
    totalScore: 20,
    scorePercentage: 20,
    reports: "View Candidate Report",
  },
  {
    key: "5",
    email: "david.wilson@codebase.com",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_7",
    completeAt: "03 May 2024, 01:45 PM",
    violation: "35/45",
    timeTaken: "01:45:22",
    totalScore: 15,
    scorePercentage: 15,
    reports: "View Candidate Report",
  },
  {
    key: "6",
    email: "priya.sharma@techsolutions.in",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_6",
    completeAt: "02 May 2024, 10:30 AM",
    violation: "5/45",
    timeTaken: "00:28:15",
    totalScore: 45,
    scorePercentage: 45,
    reports: "View Candidate Report",
  },
  {
    key: "7",
    email: "lisa.anderson@devhub.io",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_8",
    completeAt: "04 May 2024, 09:15 AM",
    violation: "12/45",
    timeTaken: "00:42:30",
    totalScore: 78,
    scorePercentage: 78,
    reports: "View Candidate Report",
  },
  {
    key: "8",
    email: "mike.chen@innovate.io",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "attempted",
    candidateId: "candidate_3",
    completeAt: "29 Apr 2024, 02:45 PM",
    violation: "25/45",
    timeTaken: "01:12:15",
    totalScore: 72,
    scorePercentage: 72,
    reports: "View Candidate Report",
  },
  // Unattempted candidates with basic data
  {
    key: "9",
    email: "james.brown456@gmail.com",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "unattempted",
    candidateId: "candidate_10",
  },
  {
    key: "10",
    email: "emma.taylor@startup.xyz",
    invitedAt: "03 September 2024, 02:15 PM",
    creditReversedAt: "14 September 2024, 02:15 PM",
    status: "unattempted",
    candidateId: "candidate_11",
  },
];

const Reports: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"attempted" | "unattempted">(
    "attempted"
  );
  const [candidates, setCandidates] = useState<CandidateData[]>(candidateData);
  const [loading, setLoading] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [reinvitingCandidateId, setReinvitingCandidateId] = useState<string | null>(null);
  const [assessmentInfo, setAssessmentInfo] = useState({
    title: "Loading...",
    created_by_email: "Loading...",
    created_at: "",
    total_invited: 0,
    total_completed: 0,
    total_pending: 0,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchCandidateReports = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      console.log("Fetching candidate reports for assessment:", assessmentId);

      // Fetch assessment details to get title and creator info
      const assessmentResponse = await getAssessment(assessmentId);
      console.log("Assessment Details API Response:", assessmentResponse);

      // Fetch candidate reports with pagination parameters
      const response = await getCandidateReports(
        assessmentId,
        1,
        100,
        "all",
        "invited_at",
        "desc"
      );
      console.log("Candidate Reports API Response:", response);

      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiData = response.data as any;

        console.log("API Data:", apiData);
        console.log("Summary:", apiData.summary);
        console.log("Candidates:", apiData.candidates);
        console.log("Invite Details:", apiData.invite_details);
        console.log("Pagination:", apiData.pagination);

        // Get assessment title and creator from assessment details API
        const assessmentTitle =
          assessmentResponse?.success && assessmentResponse?.data
            ? assessmentResponse.data.title
            : apiData.invite_details?.assessment_title || "Test Assessment";

        const createdByEmail =
          assessmentResponse?.success && assessmentResponse?.data
            ? assessmentResponse.data.created_by_email
            : "Admin";

        const createdAt =
          assessmentResponse?.success && assessmentResponse?.data
            ? assessmentResponse.data.created_at
            : apiData.invite_details?.created_at || new Date().toISOString();

        // Update assessment info
        setAssessmentInfo({
          title: assessmentTitle,
          created_by_email: createdByEmail,
          created_at: createdAt,
          total_invited: apiData.summary?.total_invited || 0,
          total_completed: apiData.summary?.total_completed || 0,
          total_pending: apiData.summary?.total_pending || 0,
        });

        console.log("Assessment Info Updated:", {
          title: assessmentTitle,
          created_by_email: createdByEmail,
          total_invited: apiData.summary?.total_invited,
          total_completed: apiData.summary?.total_completed,
          total_pending: apiData.summary?.total_pending,
        });

        // Transform candidates data
        const transformedCandidates: CandidateData[] =
          apiData.candidates?.map((candidate: ApiCandidate) => {
            const isCompleted = candidate.status === "completed";

            // Extract data from assessment_evaluation (nested object)
            const assessmentEval = candidate.assessment_evaluation;

            const candidateInfo = candidate.candidate_info || {};
            const inviteDetails = candidate.invite_details || {};
            const fullNameRaw =
              candidateInfo.full_name ||
              `${candidateInfo.first_name || ""} ${candidateInfo.last_name || ""}`.trim();
            const fullName = fullNameRaw || inviteDetails.full_name || "";
            const mobileNumber =
              candidateInfo.mobile_number || inviteDetails.mobile_number || "";
            const countryCode =
              candidateInfo.country_code || inviteDetails.country_code || "";
            const inviteId =
              candidateInfo.invite_id || inviteDetails.invite_id || candidate.invite_id;

            // Extract violation data from assessment_evaluation.proctoring_analysis
            const totalViolations = Number(
              assessmentEval?.proctoring_analysis?.violation_analysis
                ?.total_violations ?? 0
            );
            const totalVideos = Number(
              assessmentEval?.proctoring_analysis?.summary
                ?.total_videos_analyzed ?? 0
            );

            // Extract time data from assessment_evaluation.assessment_performance
            const timeSpentSeconds = Number(
              assessmentEval?.assessment_performance?.overall_metrics
                ?.total_time_spent_seconds ?? 0
            );

            // Extract score data from assessment_evaluation.assessment_performance
            const scorePercentage = Number(
              assessmentEval?.assessment_performance?.overall_metrics
                ?.score_percentage ?? 0
            );

            // Extract completion date
            const completedAt =
              assessmentEval?.assessment_performance?.assessment_completed_at;

            console.log(`Candidate ${candidate.candidate_id}:`, {
              status: candidate.status,
              isCompleted,
              completedAt,
              totalViolations,
              totalVideos,
              timeSpentSeconds,
              scorePercentage,
            });

            return {
              key: candidate.candidate_id,
              email: candidate.candidate_info?.email || "N/A",
              invitedAt: candidate.candidate_info?.invited_at
                ? new Date(
                    candidate.candidate_info.invited_at
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A",
              creditReversedAt: "N/A", // Not available in API
              status: isCompleted ? "attempted" : "unattempted",
              candidateId: candidate.candidate_id,
              assessmentId:
                candidate.assessment_id ||
                inviteDetails.assessment_id ||
                assessmentId,
              fullName,
              mobileNumber,
              countryCode,
              inviteId,
              // Attempted candidate fields
              ...(isCompleted && {
                completeAt: completedAt
                  ? new Date(completedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A",
                violation: `${totalViolations}/${totalVideos}`,
                timeTaken: formatTime(timeSpentSeconds),
                totalScore: scorePercentage,
                scorePercentage: scorePercentage,
                reports: "View Candidate Report",
              }),
            };
          }) || [];

        console.log("Transformed Candidates:", transformedCandidates);
        console.log(
          "Attempted Candidates:",
          transformedCandidates.filter((c) => c.status === "attempted")
        );
        console.log(
          "Unattempted Candidates:",
          transformedCandidates.filter((c) => c.status === "unattempted")
        );

        setCandidates(transformedCandidates);
      } else {
        message.error("Failed to fetch candidate reports");
        console.log("API Response Error:", response);
      }
    } catch (error) {
      console.error("Error fetching candidate reports:", error);
      message.error("Failed to fetch candidate reports");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch candidate reports from API
  useEffect(() => {
    const assessmentId = searchParams.get("assessment_id");

    if (assessmentId) {
      fetchCandidateReports(assessmentId);
    }
  }, [searchParams, fetchCandidateReports]);

  // Helper function to format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle resend invite action
  const handleResendInvite = async (candidateId: string) => {
    const candidateDetails = candidates.find(
      (candidate) => candidate.candidateId === candidateId
    );

    if (!candidateDetails) {
      showToast({
        type: "error",
        message: "Candidate not found",
        description: "Unable to locate candidate details for reminder.",
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      setResendingInviteId(candidateId);

      const result = await resendCandidateInvite(candidateId);

      if (result.success) {
        const responseData = result.data as {
          message?: string;
          email?: string;
          reinvite_count?: number;
        };
        const reminderEmail = responseData?.email || candidateDetails.email;
        const reminderAttempt = responseData?.reinvite_count;
        const reminderDescription = reminderEmail
          ? `Reminder sent to ${reminderEmail}${
              reminderAttempt ? ` (attempt #${reminderAttempt})` : ""
            }`
          : reminderAttempt
          ? `Reminder attempt #${reminderAttempt} recorded`
          : undefined;

        showToast({
          type: "success",
          message: "Reinvitation sent successfully",
          description: reminderDescription,
          position: "top-right",
          duration: 3000,
        });
      } else {
        const extractDetailMessage = (detail: unknown): string | null => {
          if (!detail) {
            return null;
          }

          if (typeof detail === "string") {
            return detail;
          }

          if (Array.isArray(detail)) {
            const messages = detail
              .map((entry) => {
                if (!entry) {
                  return null;
                }

                if (typeof entry === "string") {
                  return entry;
                }

                if (typeof entry === "object") {
                  const value = entry as {
                    msg?: string;
                    message?: string;
                    detail?: unknown;
                  };

                  return (
                    value.message ||
                    value.msg ||
                    (typeof value.detail === "string"
                      ? value.detail
                      : value.detail
                      ? JSON.stringify(value.detail)
                      : null)
                  );
                }

                return String(entry);
              })
              .filter((msg): msg is string => Boolean(msg));

            return messages.length ? messages.join(", ") : null;
          }

          if (typeof detail === "object") {
            const detailObj = detail as Record<string, unknown>;
            const messages = Object.values(detailObj)
              .map((value) => {
                if (typeof value === "string") {
                  return value;
                }

                if (Array.isArray(value)) {
                  return value
                    .map((entry) =>
                      typeof entry === "string" ? entry : JSON.stringify(entry)
                    )
                    .join(", ");
                }

                if (typeof value === "object" && value !== null) {
                  const nested = value as { msg?: string; message?: string };
                  return nested.msg || nested.message || JSON.stringify(value);
                }

                return value !== undefined ? String(value) : null;
              })
              .filter((msg): msg is string => Boolean(msg));

            return messages.length ? messages.join(", ") : null;
          }

          return String(detail);
        };

        const responseData = result.data as {
          message?: string;
          detail?: unknown;
        };

        const derivedMessage =
          responseData?.message || extractDetailMessage(responseData?.detail);

        const errorDescription =
          (typeof derivedMessage === "string" && derivedMessage.trim().length > 0
            ? derivedMessage
            : null) ||
          (typeof result.error === "string" && result.error.trim().length > 0
            ? result.error
            : null) ||
          `Please try again later${
            result.status_code ? ` (Error ${result.status_code})` : ""
          }`;

        showToast({
          type: "error",
          message: "Failed to send reminder",
          description: errorDescription,
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error resending invite:", error);
      showToast({
        type: "error",
        message: "Error sending reminder",
        description: "An error occurred while sending the reminder. Please try again.",
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setResendingInviteId(null);
    }
  };

  // Handle reinvite action (for Resend Invite button)
  const handleReinvite = async (candidateId: string) => {
    const candidateDetails = candidates.find(
      (candidate) => candidate.candidateId === candidateId
    );

    if (!candidateDetails) {
      showToast({
        type: "error",
        message: "Candidate not found",
        description: "Unable to locate candidate details for reinvite.",
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    // Get assessment_id from candidate details or URL params
    const assessmentId = candidateDetails.assessmentId || searchParams.get("assessment_id");

    if (!assessmentId) {
      showToast({
        type: "error",
        message: "Assessment ID not found",
        description: "Unable to locate assessment ID for reinvite.",
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      setReinvitingCandidateId(candidateId);

      const result = await reinviteCandidate(candidateId, assessmentId);

      if (result.success) {
        const responseData = result.data as {
          message?: string;
          email?: string;
        };
        const reinviteEmail = responseData?.email || candidateDetails.email;

        showToast({
          type: "success",
          message: "Reinvitation sent successfully",
          description: reinviteEmail ? `Reinvitation sent to ${reinviteEmail}` : "Reinvitation sent successfully",
          position: "top-right",
          duration: 3000,
        });
      } else {
        const extractDetailMessage = (detail: unknown): string | null => {
          if (!detail) {
            return null;
          }

          if (typeof detail === "string") {
            return detail;
          }

          if (Array.isArray(detail)) {
            const messages = detail
              .map((entry) => {
                if (!entry) {
                  return null;
                }

                if (typeof entry === "string") {
                  return entry;
                }

                if (typeof entry === "object") {
                  const value = entry as {
                    msg?: string;
                    message?: string;
                    detail?: unknown;
                  };

                  return (
                    value.message ||
                    value.msg ||
                    (typeof value.detail === "string"
                      ? value.detail
                      : value.detail
                      ? JSON.stringify(value.detail)
                      : null)
                  );
                }

                return String(entry);
              })
              .filter((msg): msg is string => Boolean(msg));

            return messages.length ? messages.join(", ") : null;
          }

          if (typeof detail === "object") {
            const detailObj = detail as Record<string, unknown>;
            const messages = Object.values(detailObj)
              .map((value) => {
                if (typeof value === "string") {
                  return value;
                }

                if (Array.isArray(value)) {
                  return value
                    .map((entry) =>
                      typeof entry === "string" ? entry : JSON.stringify(entry)
                    )
                    .join(", ");
                }

                if (typeof value === "object" && value !== null) {
                  const nested = value as { msg?: string; message?: string };
                  return nested.msg || nested.message || JSON.stringify(value);
                }

                return value !== undefined ? String(value) : null;
              })
              .filter((msg): msg is string => Boolean(msg));

            return messages.length ? messages.join(", ") : null;
          }

          return String(detail);
        };

        const responseData = result.data as {
          message?: string;
          detail?: unknown;
        };

        const derivedMessage =
          responseData?.message || extractDetailMessage(responseData?.detail);

        const errorDescription =
          (typeof derivedMessage === "string" && derivedMessage.trim().length > 0
            ? derivedMessage
            : null) ||
          (typeof result.error === "string" && result.error.trim().length > 0
            ? result.error
            : null) ||
          `Please try again later${
            result.status_code ? ` (Error ${result.status_code})` : ""
          }`;

        showToast({
          type: "error",
          message: "Failed to send reinvitation",
          description: errorDescription,
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error reinviting candidate:", error);
      showToast({
        type: "error",
        message: "Error sending reinvitation",
        description: "An error occurred while sending the reinvitation. Please try again.",
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setReinvitingCandidateId(null);
    }
  };

  // Handle shortlist/reject actions for attempted candidates
  const handleCandidateAction = (
    candidateId: string,
    action: "shortlist" | "reject"
  ) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.candidateId === candidateId
          ? {
              ...candidate,
              status: action === "shortlist" ? "attempted" : "attempted",
            }
          : candidate
      )
    );

    // Show toast notification
    const message =
      action === "shortlist"
        ? "Candidate shortlisted successfully!"
        : "Candidate rejected successfully!";
    console.log(message);
  };

  // Handle download (placeholder for future implementation)
  const handleDownload = () => {
    console.log("Download assessment report");
    // Download functionality can be implemented later
  };

  // Filter candidates based on status
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.status === statusFilter &&
      candidate.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // Columns for attempted candidates (old table with full functionality)
  const attemptedColumns: ColumnsType<CandidateData> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      render: (text) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {text}
        </span>
      ),
      sorter: true,
    },
    {
      title: "Completed at",
      dataIndex: "completeAt",
      key: "completeAt",
      width: 180,
      render: (text) => (
        <span style={{ color: "var(--text-secondary)" }}>{text}</span>
      ),
      sorter: true,
    },
    {
      title: "Violation",
      dataIndex: "violation",
      key: "violation",
      width: 120,
      render: (text) => (
        <span style={{ color: "var(--text-secondary)" }}>{text}</span>
      ),
      sorter: true,
    },
    {
      title: "Time Taken",
      dataIndex: "timeTaken",
      key: "timeTaken",
      width: 120,
      render: (text) => (
        <span style={{ color: "var(--text-secondary)" }}>{text}</span>
      ),
      sorter: true,
    },
    {
      title: "Total Score",
      dataIndex: "totalScore",
      key: "totalScore",
      width: 120,
      render: (value) => (
        <span
          className="font-medium px-2 py-1 rounded text-center"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {value}%
        </span>
      ),
      sorter: true,
    },
    {
      title: "Reports",
      dataIndex: "reports",
      key: "reports",
      width: 200,
      render: (text, record) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() =>
            navigate(
              `/reports/candidate/${
                record.candidateId
              }?assessment_id=${searchParams.get("assessment_id")}`
            )
          }
        >
          <UnorderedListOutlined style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-primary)" }}>{text}</span>
        </div>
      ),
      sorter: true,
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            size="small"
            onClick={() =>
              handleCandidateAction(record.candidateId, "shortlist")
            }
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
              color: "#ffffff",
              borderRadius: "20px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            className="hover:bg-green-700 hover:border-green-700 transition-all duration-200"
          >
            Shortlist
          </Button>
          <Button
            type="default"
            icon={<CloseCircleOutlined />}
            size="small"
            onClick={() => handleCandidateAction(record.candidateId, "reject")}
            style={{
              backgroundColor: "#dc2626",
              borderColor: "#dc2626",
              color: "#ffffff",
              borderRadius: "20px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            className="hover:bg-red-700 hover:border-red-700 transition-all duration-200"
          >
            Reject
          </Button>
          <Button
            type="default"
            icon={<SendOutlined />}
            size="small"
            onClick={() => handleReinvite(record.candidateId)}
            loading={reinvitingCandidateId === record.candidateId}
            disabled={reinvitingCandidateId !== null && reinvitingCandidateId !== record.candidateId}
            style={{
              backgroundColor: "#7C3AED",
              borderColor: "#7C3AED",
              color: "#ffffff",
              borderRadius: "20px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            className="hover:bg-purple-700 hover:border-purple-700 transition-all duration-200"
          >
            Resend Invite
          </Button>
        </div>
      ),
    },
  ];

  // Columns for unattempted candidates (simple table)
  const unattemptedColumns: ColumnsType<CandidateData> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 300,
      render: (text) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {text}
        </span>
      ),
      sorter: true,
    },
    {
      title: "Invited at",
      dataIndex: "invitedAt",
      key: "invitedAt",
      width: 200,
      render: (text) => (
        <span style={{ color: "var(--text-primary)" }}>{text}</span>
      ),
      sorter: true,
    },
    {
      title: "Credit Reversed At",
      dataIndex: "creditReversedAt",
      key: "creditReversedAt",
      width: 200,
      render: (text) => (
        <span style={{ color: "var(--text-primary)" }}>{text}</span>
      ),
      sorter: true,
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Button
          type="default"
          icon={<SendOutlined />}
          size="small"
          onClick={() => handleResendInvite(record.candidateId)}
          loading={resendingInviteId === record.candidateId}
          disabled={
            resendingInviteId !== null && resendingInviteId !== record.candidateId
          }
          style={{
            backgroundColor: "#7C3AED",
            borderColor: "#7C3AED",
            color: "#ffffff",
            borderRadius: "6px",
            fontWeight: "500",
            cursor: "pointer",
          }}
          className="hover:bg-purple-700 hover:border-purple-700 transition-all duration-200"
        >
          Send Reminder
        </Button>
      ),
    },
  ];

  // Choose columns based on status filter
  const columns =
    statusFilter === "attempted" ? attemptedColumns : unattemptedColumns;

  return (
    <div
      className="min-h-screen relative max-w-full overflow-x-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        zIndex: 1,
      }}
    >
      <style>{`
                .reports-table .ant-table-thead > tr > th {
                    background-color: var(--bg-secondary) !important;
                    color: var(--text-primary) !important;
                    font-weight: 600 !important;
                    border-bottom: 1px solid var(--border-primary) !important;
                }
                .reports-table .ant-table-tbody > tr > td {
                    background-color: var(--bg-primary) !important;
                    border-bottom: 1px solid var(--border-primary) !important;
                    color: var(--text-primary) !important;
                }
                .reports-table .ant-table-tbody > tr:hover > td {
                    background-color: var(--bg-tertiary) !important;
                }
                .reports-table .ant-table-container {
                    border: 1px solid var(--border-primary) !important;
                    background-color: var(--bg-primary) !important;
                }
                .reports-table .ant-pagination {
                    color: var(--text-primary) !important;
                }
                .reports-table .ant-pagination .ant-pagination-item {
                    background-color: var(--bg-secondary) !important;
                    border-color: var(--border-primary) !important;
                }
                .reports-table .ant-pagination .ant-pagination-item a {
                    color: var(--text-primary) !important;
                }
                .reports-table .ant-pagination .ant-pagination-item-active {
                    background-color: var(--accent-primary) !important;
                    border-color: var(--accent-primary) !important;
                }
                .reports-table .ant-pagination .ant-pagination-item-active a {
                    color: #ffffff !important;
                }
            `}</style>

      {/* Header Section */}
      <div
        className="p-6 border-b relative"
        style={{ borderColor: "var(--border-primary)", zIndex: 10 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/cognitive")}
              className="flex items-center cursor-pointer"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-primary)",
                zIndex: 11,
              }}
            />
            <div>
              <h1
                className="text-2xl font-bold relative"
                style={{ color: "var(--text-primary)", zIndex: 11 }}
              >
                {assessmentInfo.title}
              </h1>
              <p
                className="text-sm relative"
                style={{ color: "var(--text-secondary)", zIndex: 11 }}
              >
                Created by {assessmentInfo.created_by_email}
              </p>
            </div>
          </div>

          {/* Assessment Metrics */}
          <div
            className="flex items-center gap-6 p-4 rounded-lg relative"
            style={{ backgroundColor: "var(--bg-secondary)", zIndex: 10 }}
          >
            <div className="flex items-center gap-2">
              <UserOutlined style={{ color: "#f97316", fontSize: "18px" }} />
              <span style={{ color: "var(--text-primary)" }}>
                Invited: {assessmentInfo.total_invited}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleOutlined
                style={{ color: "#10b981", fontSize: "18px" }}
              />
              <span style={{ color: "var(--text-primary)" }}>
                Completed: {assessmentInfo.total_completed}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockCircleOutlined
                style={{ color: "#3b82f6", fontSize: "18px" }}
              />
              <span style={{ color: "var(--text-primary)" }}>
                Pending: {assessmentInfo.total_pending}
              </span>
            </div>
          </div>

          {/* Download Report Button */}
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            className="font-semibold relative"
            style={{
              backgroundColor: "transparent",
              borderColor: "var(--text-primary)",
              color: "var(--text-primary)",
              borderRadius: "25px",
              zIndex: 11,
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingTop: "8px",
              paddingBottom: "8px",
              height: "auto",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div
        className="p-6 border-b relative"
        style={{ borderColor: "var(--border-primary)", zIndex: 10 }}
      >
        <div className="flex items-center justify-between">
          {/* Status Toggle */}
          <div className="flex items-center gap-4">
            <span
              className="font-medium relative"
              style={{ color: "var(--text-secondary)", zIndex: 11 }}
            >
              Status:
            </span>
            <div
              className="flex rounded-lg p-1 relative"
              style={{ backgroundColor: "var(--bg-tertiary)", zIndex: 10 }}
            >
              <button
                onClick={() => setStatusFilter("attempted")}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all relative"
                style={{
                  backgroundColor:
                    statusFilter === "attempted"
                      ? "var(--text-primary)"
                      : "transparent",
                  color:
                    statusFilter === "attempted"
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  zIndex: 11,
                  cursor: "pointer",
                }}
              >
                Attempted
              </button>
              <button
                onClick={() => setStatusFilter("unattempted")}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all relative"
                style={{
                  backgroundColor:
                    statusFilter === "unattempted"
                      ? "var(--text-primary)"
                      : "transparent",
                  color:
                    statusFilter === "unattempted"
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  zIndex: 11,
                  cursor: "pointer",
                }}
              >
                Unattempt
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search Candidate..."
              prefix={
                <SearchOutlined style={{ color: "var(--text-tertiary)" }} />
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 relative" style={{ zIndex: 10 }}>
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          className="reports-table"
        />
      </div>
    </div>
  );
};

export default Reports;
