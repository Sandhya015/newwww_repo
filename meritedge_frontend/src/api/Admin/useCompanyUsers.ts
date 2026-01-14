import { useCallback, useEffect, useState } from "react";
import { adminGetAPI, adminPostAPIWithAuth, adminPutAPI } from "./AdminAPI";
import toast from "react-hot-toast";

export interface CompanyUser {
    company_id: string;
    password_changed_at: string;
    created_at: string;
    organization_id: string;
    can_manage_users: boolean;
    preferred_language: string;
    created_by: string;
    preferred_timezone: string;
    status: string;
    designation: string;
    full_name: string;
    email: string;
    hierarchy_level: number;
    email_verified: boolean;
    updated_at: string;
    phone_verified: boolean;
    password_hash: string;
    role: string;
    updated_by: string;
    max_sub_users: number;
    unique_id: string;
    country_code: string;
    phone: string;
    force_password_change: boolean;
}

export interface CompanyUsersResponse {
    users: CompanyUser[];
    last_evaluated_key: string | null;
}

export interface CreateCompanyUserData {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    company_id: string;
    designation: string;
    country_code: string;
}

export interface UpdateCompanyUserData extends Partial<CreateCompanyUserData> {
    status?: string;
}

export const useCompanyUsers = (organizationId?: string , companyId?: string) => {
    const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Fetch company users
    const fetchCompanyUsers = useCallback(async (limit: number = 10, lastKey?: string) => {
        try {
            setLoading(true);
            setError(null);

            let url = `admin-get-company-users/${companyId}?limit=${limit}`;
            if (lastKey) {
                url += `&last_evaluated_key=${lastKey}`;
            }

            const response = await adminGetAPI(url);

            if (response.success && response.data) {
                const data: CompanyUsersResponse = response.data;
                
                if (lastKey) {
                    // Append to existing company users for pagination
                    setCompanyUsers(prev => [...prev, ...data.users]);
                } else {
                    // Replace company users for fresh load
                    setCompanyUsers(data.users);
                }
                
                setLastEvaluatedKey(data.last_evaluated_key);
                setHasMore(!!data.last_evaluated_key);
            } else {
                setError(response.data?.message || 'Failed to fetch company users');
                toast.error(response.data?.message || 'Failed to fetch company users');
            }
        } catch (err) {
            console.error('Error fetching company users:', err);
            setError('An error occurred while fetching company users');
            toast.error('An error occurred while fetching company users');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create company user
    const createCompanyUser = useCallback(async (formData: any) => {
        try {
            setLoading(true);
            setError(null);

            // Format data according to API requirements
            const apiData: CreateCompanyUserData = {
                full_name: formData.full_name ?? '',
                email: formData.email ?? '',
                password: formData.password ?? '',
                phone: formData.phone ?? '',
                company_id: formData.company_id ?? '',
                designation: formData.designation ?? '',
                country_code: formData.country_code ?? ''
            };

            const response = await adminPostAPIWithAuth('create-company-user', apiData);

            if (response.success && response.data) {
                const newCompanyUser = response.data;
                fetchCompanyUsers();
                toast.success('Company user created successfully');
                return { success: true, data: newCompanyUser };
            } else {
                setError(response.data?.message || 'Failed to create company user');
                toast.error(response.data?.message || 'Failed to create company user');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error creating company user:', err);
            setError('An error occurred while creating company user');
            toast.error('An error occurred while creating company user');
            return { success: false, error: 'An error occurred while creating company user' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update company user
    const updateCompanyUser = useCallback(async (userId: string, data: UpdateCompanyUserData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminPutAPI(`edit-company-user/${userId}`, data);

            if (response.success && response.data) {
                const updatedCompanyUser = response.data;
                fetchCompanyUsers();
                toast.success('Company user updated successfully');
                return { success: true, data: updatedCompanyUser };
            } else {
                setError(response.data?.message || 'Failed to update company user');
                toast.error(response.data?.message || 'Failed to update company user');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error updating company user:', err);
            setError('An error occurred while updating company user');
            toast.error('An error occurred while updating company user');
            return { success: false, error: 'An error occurred while updating company user' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Load more company users (pagination)
    const loadMore = useCallback(() => {
        if (hasMore && !loading && lastEvaluatedKey) {
            fetchCompanyUsers(10, lastEvaluatedKey);
        }
    }, [hasMore, loading, lastEvaluatedKey, fetchCompanyUsers]);

    // Refresh company users
    const refresh = useCallback(() => {
        fetchCompanyUsers(10);
    }, [fetchCompanyUsers]);

    // Initial load
    useEffect(() => {
        fetchCompanyUsers(10);
    }, [fetchCompanyUsers]);

    return {
        companyUsers,
        loading,
        error,
        hasMore,
        fetchCompanyUsers,
        createCompanyUser,
        updateCompanyUser,
        loadMore,
        refresh,
        setError
    };
}