import toast from "react-hot-toast";

// Helper function to handle 403 errors consistently
const handle403Error = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  // Redirect to home page instead of login
  window.location.href = "/";
};

// Helper function to handle admin 403 errors (currently unused but kept for future use)
// const handleAdmin403Error = (): void => {
//     localStorage.removeItem('admin_access_token');
//     // Redirect to admin login page
//     window.location.href = '/admin/login';
// };

// Helper function to handle 401 errors consistently
const handle401Error = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  // Redirect to home page instead of login
  window.location.href = "/";
};

export const postAPI = async (api_url: string, data: unknown) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    const normalizedUrl = api_url.startsWith('/') ? api_url : `/${api_url}`;
    const response = await fetch(`${baseUrl}${normalizedUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: response,
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();

        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();

    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

export const forgotPassword = async (email: string) => {
  const endpoint =
    "https://i528nplii7.execute-api.ap-south-1.amazonaws.com/api/v1/auth/forgot-password";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        status_code: response.status,
        data: responseData,
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("Forgot password API error:", error);
    return {
      success: false,
      error,
    };
  }
};

// Upload and parse JD file
export const uploadAndParseJD = async (file: File) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    const endpoint = `${baseUrl}/jd/upload-parse`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json().catch(() => ({
          message: "Failed to parse JD file",
        }));

        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const jsonEncodeResponse = await response.json();

    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("JD Upload Error: ", error);
    return { success: false, error };
  }
};

// Get Method
export const getAPI = async <T>(api_url: string): Promise<T | null> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    // Handle 403 error before parsing response
    if (response.status === 403) {
      handle403Error();
      return null;
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();

    // Handle API Error
    if (response?.status !== 200) {
      // Show Toast Message - API can return error in 'message' or 'detail' field
      // Check both fields to ensure error is displayed to user
      const errorMessage =
        jsonEncodeResponse?.message || jsonEncodeResponse?.detail;
      if (errorMessage) {
        toast.error(errorMessage);
      }

      return null;
    }

    return (await jsonEncodeResponse) as T;
  } catch (error) {
    console.error("API Error: ", error);
    return null;
  }
};

export const patchAPI = async (api_url: string, data: unknown) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: response,
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();

        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();

    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return null;
  }
};

// PUT Method
export const putAPI = async (api_url: string, data: unknown) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: response,
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();

        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();

    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return null;
  }
};

// Delete Method
export const deleteAPI = async (api_url: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // For DELETE requests, we might not get a response body
    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      // If no response body, that's fine for DELETE
      responseData = { message: "Assessment deleted successfully" };
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Create Section API
export const createSection = async (
  assessmentId: string,
  sectionData: { section_name: string; description: string }
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/sections`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          section_name: sectionData.section_name,
          description: sectionData.description,
          timing_settings: {
            timing_mode: "section_level",
            manual_duration: null,
            question_timing_enabled: false,
            auto_calculate_duration: true,
            strict_timing: false,
            allow_early_submission: true,
            time_gap_after: null,
          },
          manual_duration: null,
          advanced_settings: {
            shuffle_questions: false,
            shuffle_questions_per_invite: false,
            question_navigation: "sequential",
            allow_review_answers: true,
            allow_change_answers: true,
            question_type_weightages: [],
            enable_custom_weightages: false,
            is_required: true,
            prerequisites: [],
            skip_if_failed: false,
            max_attempts: 1,
            show_progress: true,
            show_timer: true,
            show_question_numbers: true,
            instructions_before_start: null,
            instructions_during_section: null,
          },
          shuffle_questions: false,
          passing_score: null,
          is_required: true,
          instructions: sectionData.description,
          section_order: 0,
          prerequisites: [],
          skip_if_failed: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: response,
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Get Assessment API
export const getAssessment = async (assessmentId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Update Assessment Title API
export const updateAssessmentTitle = async (
  assessmentId: string,
  title: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/title`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Update Section API
export const updateSection = async (
  assessmentId: string,
  sectionId: string,
  sectionData: { section_name: string; description: string }
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          section_name: sectionData.section_name,
          description: sectionData.description,
          timing_settings: {
            timing_mode: "section_level",
            manual_duration: 0,
            question_timing_enabled: false,
            auto_calculate_duration: true,
            strict_timing: false,
            allow_early_submission: true,
            time_gap_after: 0,
          },
          manual_duration: 0,
          advanced_settings: {
            shuffle_questions: false,
            shuffle_questions_per_invite: false,
            question_navigation: "sequential",
            allow_review_answers: true,
            allow_change_answers: true,
            question_type_weightages: [],
            enable_custom_weightages: false,
            is_required: true,
            prerequisites: [],
            skip_if_failed: false,
            max_attempts: 1,
            show_progress: true,
            show_timer: true,
            show_question_numbers: true,
            instructions_before_start: "string",
            instructions_during_section: "string",
          },
          shuffle_questions: true,
          passing_score: 0,
          is_required: true,
          instructions: sectionData.description,
          section_order: 0,
          prerequisites: [],
          skip_if_failed: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Get Question Types API
export const getQuestionTypes = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}masterdata/?entity_type=question_type`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Question types not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Admin API function for admin login (no authentication required)
export const adminPostAPI = async (api_url: string, data: unknown) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: response,
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("Admin API Error: ", error);
    return { success: false, error };
  }
};

export const getScopedQuestions = async (
  library: string = "company",
  limit: number = 20,
  lastEvaluatedKey?: Record<string, unknown> | string | null,
  skill?: string,
  domain?: string,
  difficultyLevel?: string,
  categoryId?: string,
  questionTypeId?: string,
  status?: string,
  tags?: string,
  concept?: string
) => {
  try {
    let url = `${
      import.meta.env.VITE_API_URL
    }questions/scoped?library=${library}&limit=${limit}`;

    if (lastEvaluatedKey) {
      // If it's an object, JSON stringify and URL encode it
      const keyValue =
        typeof lastEvaluatedKey === "object"
          ? encodeURIComponent(JSON.stringify(lastEvaluatedKey))
          : encodeURIComponent(lastEvaluatedKey);
      url += `&last_evaluated_key=${keyValue}`;
    }

    if (skill) {
      url += `&skill=${encodeURIComponent(skill)}`;
    }

    if (domain) {
      url += `&domain=${encodeURIComponent(domain)}`;
    }

    if (difficultyLevel) {
      url += `&difficulty_level=${encodeURIComponent(difficultyLevel)}`;
    }

    if (categoryId) {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    if (questionTypeId) {
      url += `&question_type_id=${encodeURIComponent(questionTypeId)}`;
    }

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    if (tags) {
      url += `&tags=${encodeURIComponent(tags)}`;
    }

    if (concept) {
      url += `&concept=${encodeURIComponent(concept)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    // Handle 403 error before parsing response
    if (response.status === 403) {
      handle403Error();
      return null;
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();

    // Handle API Error
    if (response?.status !== 200) {
      // Show Toast Message
      toast.error(jsonEncodeResponse?.message || "Failed to fetch questions");

      return null;
    }

    // Return the response with items and last_evaluated_key
    return {
      data: jsonEncodeResponse.items || [],
      last_evaluated_key: jsonEncodeResponse.last_evaluated_key || null,
    };
  } catch (error) {
    console.error("API Error: ", error);
    toast.error("Failed to fetch questions");
    return null;
  }
};

// Get Section Settings API
export const getSectionSettings = async (
  assessmentId: string,
  sectionId: string
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }sections/${assessmentId}/${sectionId}/settings`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Update Section Settings API
export const updateSectionSettings = async (
  assessmentId: string,
  sectionId: string,
  settingsData: {
    section_name: string;
    proctoring_settings: {
      candidate_location: { enable: boolean; order: number };
      eyeball_detection: { enable: boolean; order: number };
      capture_screenshot: { enable: boolean; order: number };
      disable_copy_paste: { enable: boolean; order: number };
      ai_assistance: { enable: boolean; order: number };
      audio_analysis: { enable: boolean; order: number };
      resume_test: { enable: boolean; order: number };
      disable_screen_extension: { enable: boolean; order: number };
      screen_recording: { enable: boolean; order: number };
      face_analysis: { enable: boolean; order: number };
      shuffle_questions: { enable: boolean; order: number };
      auto_calculate_duration: { enable: boolean; order: number };
    };
    section_config: {
      section_time: { hours: number; mins: number };
      section_break_time: { hours: number; mins: number };
      cut_off_marks: { percentage: number };
      question_type_weightage: Record<string, unknown>;
    };
  }
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }sections/${assessmentId}/${sectionId}/settings`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(settingsData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Get Section Questions API
export const getSectionQuestions = async (
  assessmentId: string,
  sectionId: string
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}/questions`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Create Questions API
export const createQuestions = async (
  assessmentId: string,
  sectionId: string,
  questionsData: {
    questions: Record<string, unknown>[];
    add_to_library: boolean;
  }
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}/questions/create`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(questionsData),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Create Single Question API
export const createQuestion = async (questionData: Record<string, unknown>) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}questions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 400) {
        const errorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: errorResponse,
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        // JSON Encode Error Response
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    // JSON Encode Response
    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error };
  }
};

// Get General Settings API
export const getGeneralSettings = async (assessmentId: string) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/config/general-settings`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Update General Settings API
export const updateGeneralSettings = async (
  assessmentId: string,
  settingsData: Record<string, unknown>
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/config/general-settings`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(settingsData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Create Custom Field API
export const createCustomField = async (
  assessmentId: string,
  fieldData: Record<string, unknown>
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/config/general-settings/custom-fields`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(fieldData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Add Questions to Section API
export const addQuestionsToSection = async (
  assessmentId: string,
  sectionId: string,
  questionIds: string[]
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}/questions`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          question_ids: questionIds,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();

    // Check if the response indicates questions already exist
    if (
      responseData.detail &&
      responseData.detail.includes(
        "All questions already exist in this assessment"
      )
    ) {
      return { success: false, status_code: 400, data: responseData.detail };
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Remove Questions from Section API
export const removeQuestionsFromSection = async (
  assessmentId: string,
  sectionId: string,
  questionIds: string[]
) => {
  try {
    console.log("removeQuestionsFromSection API called with:", {
      assessmentId,
      sectionId,
      questionIds,
      url: `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}/questions`,
    });

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}/questions`,
      {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          question_ids: questionIds,
        }),
      }
    );

    console.log("API response status:", response.status);
    console.log("API response ok:", response.ok);

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Get Assessment Lifecycle API
export const getAssessmentLifecycle = async (assessmentId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/lifecycle`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Update Assessment Lifecycle API
export const updateAssessmentLifecycle = async (
  assessmentId: string,
  lifecycleData: {
    invite_start_date: string;
    invite_end_date: string;
    candidate_window: number;
  }
) => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/life-cycle-settings`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(lifecycleData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Publish Assessment API
export const publishAssessment = async (
  assessmentId: string,
  publishData: {
    publish_immediately: boolean;
    scheduled_publish_date: string;
    send_notifications: boolean;
    auto_archive_date: string;
    archive_after_days: number;
  }
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/publish`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(publishData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Clone Assessment API
export const cloneAssessment = async (
  assessmentId: string,
  title: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/clone`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Invite Candidate API
export const inviteCandidate = async (inviteData: {
  assessment_id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  country_code: string;
  send_email_notification: boolean;
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}invites/candidate`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(inviteData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Invite Multiple Candidates API (Bulk Invite)
export const inviteCandidates = async (invitesData: {
  candidates: Array<{
    assessment_id: string;
    full_name: string;
    email: string;
    mobile_number: string;
    country_code: string;
    send_email_notification: boolean;
  }>;
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}invites/candidates`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(invitesData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Resend Invite to Candidate API
export const resendCandidateInvite = async (
  candidateId: string,
  customMessage?: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}candidates/${candidateId}/invite-reminder`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          custom_message: customMessage || "",
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Candidate not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json().catch(() => null);
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Reinvite Candidate API
export const reinviteCandidate = async (candidateId: string, assessmentId: string) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    const apiPath = `/candidates/${candidateId}/reinvite`;
    const response = await fetch(
      `${baseUrl}${apiPath}`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          assessment_id: assessmentId,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Candidate not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json().catch(() => null);
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Delete Section API
export const deleteSection = async (
  assessmentId: string,
  sectionId: string
) => {
  try {
    console.log("deleteSection API called with:", {
      assessmentId,
      sectionId,
      url: `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}`,
    });

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }assessments/${assessmentId}/sections/${sectionId}`,
      {
        method: "DELETE",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );

    console.log("API response status:", response.status);
    console.log("API response ok:", response.ok);

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment or section not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Get Candidate Reports API (for all candidates in an assessment)
export const getCandidateReports = async (
  assessmentId: string,
  page: number = 1,
  limit: number = 20,
  status: string = "all",
  sortBy: string = "invited_at",
  sortOrder: string = "desc"
) => {
  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }${assessmentId}/candidate-reports?page=${page}&limit=${limit}&status=${status}&sort_by=${sortBy}&sort_order=${sortOrder}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Get Individual Candidate Evaluation API (detailed evaluation data)
export const getCandidateEvaluation = async (candidateId: string) => {
  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }candidates/${candidateId}/assessment-evaluation`;
    console.log("Fetching candidate evaluation from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Authentication failed",
        };
      } else if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Candidate evaluation not found",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Get Individual Candidate Report API (from candidate-reports endpoint)
export const getIndividualCandidateReport = async (
  assessmentId: string,
  candidateId: string
) => {
  try {
    console.log(
      "API URL being called:",
      `${import.meta.env.VITE_API_URL}${assessmentId}/candidate-reports`
    );
    console.log("Assessment ID:", assessmentId);
    console.log("Candidate ID:", candidateId);

    const response = await getCandidateReports(assessmentId, 1, 100, "all");

    if (response.success && response.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response.data as any;

      // Find the specific candidate from the candidates array
      if (responseData.candidates && Array.isArray(responseData.candidates)) {
        const candidateData = responseData.candidates.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => c.candidate_id === candidateId
        );

        if (candidateData) {
          return { success: true, data: candidateData };
        } else {
          return {
            success: false,
            status_code: 404,
            data: "Candidate not found in assessment",
          };
        }
      }

      return { success: false, status_code: 404, data: "No candidates found" };
    }

    return response;
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Reorder Sections API
export const reorderSections = async (
  assessmentId: string,
  sectionOrders: { section_id: string; new_order: number }[]
) => {
  try {
    console.log({
      message: "Reordering sections",
      url: `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/sections/reorder`,
      payload: { section_orders: sectionOrders },
    });

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/sections/reorder`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          section_orders: sectionOrders,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Assessment not found",
        };
      } else if (response.status === 400) {
        const errorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: errorResponse.detail || "Bad request",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};

// Reorder Questions within a Section API
export const reorderQuestions = async (
  assessmentId: string,
  sectionId: string,
  questionOrders: { question_id: string; order: number }[]
) => {
  try {
    console.log({
      message: "Reordering questions",
      url: `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/sections/${sectionId}/questions/reorder`,
      payload: { question_orders: questionOrders },
    });

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}assessments/${assessmentId}/sections/${sectionId}/questions/reorder`,
      {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          question_orders: questionOrders,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        handle403Error();
        return {
          success: false,
          status_code: response?.status,
          data: "Access denied",
        };
      } else if (response.status === 404) {
        return {
          success: false,
          status_code: response?.status,
          data: "Section or questions not found",
        };
      } else if (response.status === 400) {
        const errorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: errorResponse.detail || "Bad request",
        };
      } else if (response.status === 500) {
        return {
          success: false,
          status_code: response?.status,
          data: "Server error",
        };
      } else {
        const jsonEncodeErrorResponse = await response.json();
        return {
          success: false,
          status_code: response?.status,
          data: jsonEncodeErrorResponse,
        };
      }
    }

    const jsonEncodeResponse = await response.json();
    return { success: true, data: jsonEncodeResponse };
  } catch (error) {
    console.error("API Error: ", error);
    return { success: false, error: "Network error occurred" };
  }
};
