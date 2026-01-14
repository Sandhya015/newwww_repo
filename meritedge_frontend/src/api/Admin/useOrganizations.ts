import { useState, useEffect, useCallback } from 'react';
import { adminGetAPI, adminPostAPIWithAuth, adminPutAPI, adminDeleteAPI } from './AdminAPI';
import toast from 'react-hot-toast';

export interface Organization {
    unique_id: string;
    name: string;
    slug: string;
    status: 'active' | 'inactive' | 'pending';
    billing_plan: 'free' | 'basic' | 'premium' | 'enterprise';
    contact_email: string;
    support_email: string;
    primary_color: string;
    logo_url: string;
    domain: string;
    language: string;
    timezone: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    consumed_credits: number;
    assigned_credits: number;
    credit_reset_day: number;
    reseller_id: string;
    usage_metrics: Record<string, any>;
    feature_flags: Record<string, any>;
}

export interface OrganizationsResponse {
    organizations: Organization[];
    last_evaluated_key: string | null;
}

export interface CreateOrganizationData {
    name: string;
    slug: string;
    domain: string;
    logo_url: string;
    primary_color: string;
    created_by: string;
    assigned_credits: number;
    consumed_credits: number;
    billing_plan: string;
    reseller_id: string;
    credit_reset_day: number;
    feature_flags: Record<string, any>;
    usage_metrics: Record<string, any>;
    timezone: string;
    language: string;
    contact_email: string;
    support_email: string;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
    status?: string;
}

export const useOrganizations = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Fetch organizations
    const fetchOrganizations = useCallback(async (limit: number = 10, lastKey?: string) => {
        try {
            setLoading(true);
            setError(null);

            let url = `admin-get-organizations?limit=${limit}`;
            if (lastKey) {
                url += `&last_evaluated_key=${lastKey}`;
            }

            const response = await adminGetAPI(url);

            if (response.success && response.data) {
                const data: OrganizationsResponse = response.data;
                
                if (lastKey) {
                    // Append to existing organizations for pagination
                    setOrganizations(prev => [...prev, ...data.organizations]);
                } else {
                    // Replace organizations for fresh load
                    setOrganizations(data.organizations);
                }
                
                setLastEvaluatedKey(data.last_evaluated_key);
                setHasMore(!!data.last_evaluated_key);
            } else {
                setError(response.data?.message || 'Failed to fetch organizations');
                toast.error(response.data?.message || 'Failed to fetch organizations');
            }
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('An error occurred while fetching organizations');
            toast.error('An error occurred while fetching organizations');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create organization
    const createOrganization = useCallback(async (formData: any) => {
        try {
            setLoading(true);
            setError(null);

            // Format data according to API requirements
            const apiData: CreateOrganizationData = {
                name: formData.name,
                slug: formData.slug,
                domain: formData.domain || '',
                logo_url: formData.logo_url || 'https://example.com/',
                primary_color: formData.primary_color || '#007bff',
                created_by: 'admin', // This should come from the logged-in admin user
                assigned_credits: formData.assigned_credits || 0,
                consumed_credits: 0, // Always starts at 0
                billing_plan: formData.billing_plan || 'free',
                reseller_id: formData.reseller_id || '',
                credit_reset_day: formData.credit_reset_day || 1,
                feature_flags: {},
                usage_metrics: {},
                timezone: formData.timezone || 'UTC',
                language: formData.language || 'en',
                contact_email: formData.contact_email,
                support_email: formData.support_email
            };

            const response = await adminPostAPIWithAuth('create-organization', apiData);

            if (response.success && response.data) {
                const newOrg = response.data;
                setOrganizations(prev => [newOrg, ...prev]);
                toast.success('Organization created successfully');
                return { success: true, data: newOrg };
            } else {
                setError(response.data?.message || 'Failed to create organization');
                toast.error(response.data?.message || 'Failed to create organization');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error creating organization:', err);
            setError('An error occurred while creating organization');
            toast.error('An error occurred while creating organization');
            return { success: false, error: 'An error occurred while creating organization' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update organization
    const updateOrganization = useCallback(async (organizationId: string, data: UpdateOrganizationData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminPutAPI(`edit-organization/${organizationId}`, data);

            if (response.success && response.data) {
                const updatedOrg = response.data;
                setOrganizations(prev => 
                    prev.map(org => 
                        org.unique_id === organizationId ? { ...org, ...updatedOrg } : org
                    )
                );
                toast.success('Organization updated successfully');
                return { success: true, data: updatedOrg };
            } else {
                setError(response.data?.message || 'Failed to update organization');
                toast.error(response.data?.message || 'Failed to update organization');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error updating organization:', err);
            setError('An error occurred while updating organization');
            toast.error('An error occurred while updating organization');
            return { success: false, error: 'An error occurred while updating organization' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete organization
    const deleteOrganization = useCallback(async (organizationId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminDeleteAPI(`delete-organization/${organizationId}`);

            if (response.success) {
                setOrganizations(prev => prev.filter(org => org.unique_id !== organizationId));
                toast.success('Organization deleted successfully');
                return { success: true };
            } else {
                setError(response.data?.message || 'Failed to delete organization');
                toast.error(response.data?.message || 'Failed to delete organization');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error deleting organization:', err);
            setError('An error occurred while deleting organization');
            toast.error('An error occurred while deleting organization');
            return { success: false, error: 'An error occurred while deleting organization' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Load more organizations (pagination)
    const loadMore = useCallback(() => {
        if (hasMore && !loading && lastEvaluatedKey) {
            fetchOrganizations(10, lastEvaluatedKey);
        }
    }, [hasMore, loading, lastEvaluatedKey, fetchOrganizations]);

    // Refresh organizations
    const refresh = useCallback(() => {
        fetchOrganizations(10);
    }, [fetchOrganizations]);

    // Initial load
    useEffect(() => {
        fetchOrganizations(10);
    }, [fetchOrganizations]);

    return {
        organizations,
        loading,
        error,
        hasMore,
        fetchOrganizations,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        loadMore,
        refresh,
        setError
    };
};
