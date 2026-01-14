/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { getAPI, postAPI } from "../../lib/api";
import toast from "react-hot-toast";

// Types
export interface HierarchyUser {
  user_id: string;
  full_name: string;
  role: string;
  designation: string;
  hierarchy_level: number;
  status: string;
  children: HierarchyUser[];
  created_at: string;
}

export interface HierarchyResponse {
  hierarchy: HierarchyUser;
  max_depth: number;
  total_users: number;
  include_deleted: boolean;
}

export interface PermissionsResponse {
  can_create: boolean;
  current_hierarchy: string;
  target_hierarchy: string;
  current_sub_users: number;
  max_sub_users: string;
  remaining_slots: string;
}

export interface SubUser {
  unique_id: string;
  email: string;
  full_name: string;
  role: string;
  designation: string;
  status: string;
  hierarchy_level: number;
  created_at: string;
  last_login: string | null;
  force_password_change: boolean;
}

export interface SubUsersResponse {
  sub_users: SubUser[];
  count: number;
  last_evaluated_key: string | null;
  has_more: boolean;
  include_deleted: boolean;
}

export interface CreateSubUserPayload {
  email: string;
  full_name: string;
  role: string;
  designation: string;
  phone: string;
  country_code: string;
  permissions?: any[];
  feature_flags?: any;
  notification_settings?: any;
  interviewer_tags?: string[];
  assessment_templates?: string[];
  alternate_email?: string;
  linkedin_url?: string;
  contact_preference?: string;
  whatsapp_optin?: boolean;
  password: string;
}

export interface CreateSubUserResponse {
  message: string;
  unique_id: string;
  email: string;
  status: string;
  force_password_change: boolean;
  hierarchy_level: string;
  manager_id: string;
}

// Hook: Get User Hierarchy
export const useGetUserHierarchy = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HierarchyResponse | null>(null);

  const getUserHierarchy = async (
    maxDepth: number = 3,
    includeDeleted: boolean = false
  ): Promise<HierarchyResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getAPI<HierarchyResponse>(
        `users/me/hierarchy?max_depth=${maxDepth}&include_deleted=${includeDeleted}`
      );

      if (response) {
        setData(response);
        return response;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch user hierarchy";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { getUserHierarchy, data, isLoading, error };
};

// Hook: Get User Permissions
export const useGetUserPermissions = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PermissionsResponse | null>(null);

  const getUserPermissions = async (): Promise<PermissionsResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getAPI<PermissionsResponse>("users/me/permissions");

      if (response) {
        setData(response);
        return response;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch user permissions";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { getUserPermissions, data, isLoading, error };
};

// Hook: Get Sub-users
export const useGetSubUsers = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubUsersResponse | null>(null);

  const getSubUsers = async (
    userId: string,
    limit: number = 50,
    includeDeleted: boolean = false
  ): Promise<SubUsersResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getAPI<SubUsersResponse>(
        `users/${userId}/sub-users?limit=${limit}&include_deleted=${includeDeleted}`
      );

      if (response) {
        setData(response);
        return response;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch sub-users";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { getSubUsers, data, isLoading, error };
};

// Hook: Create Sub-user
export const useCreateSubUser = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createSubUser = async (
    payload: CreateSubUserPayload
  ): Promise<CreateSubUserResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await postAPI("users/sub-users", payload);

      if (response?.success && response?.data) {
        toast.success(response.data.message || "Sub-user created successfully");
        return response.data as CreateSubUserResponse;
      } else {
        const errorMessage =
          response?.data?.detail || "Failed to create sub-user";
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create sub-user";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createSubUser, isLoading, error };
};

