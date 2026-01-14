/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminGetAPI, adminPostAPIWithAuth, adminPutAPI } from "./AdminAPI";

export interface Company {
    organization_name: string;
    data_retention_days: number,
    employee_count: number,
    industry: string,
    consumed_credits: number,
    created_by: string,
    status: 'active' | 'inactive' | 'pending',
    billing_plan: string,
    auto_archive_days: number,
    contact_email: string,
    usage_metrics: Record<string, any>,
    name: string,
    language: string,
    code: string,
    company_logo: "https://staging.otomeytai.com/board/OtomeytLogo_WhiteVer.png",
    expiry_date: string,
    default_candidate_tags: string[],
    allowed_domains: string[],
    unique_id: string,
    assigned_credits: number,
    inbound_api_details: Record<string, any>,
    branding_overrides: Record<string, any>,
    created_at: string,
    enable_candidate_pool: boolean,
    organization_id: string,
    default_timezone: string,
    address: Record<string, any>,
    cooling_period: number,
    reseller_id: string,
    updated_at: string,
    support_email: string,
    timezone: string,
    outbound_api_details: Record<string, any>,
    feature_flags: Record<string, any>,
    credit_reset_day: number
}

export interface CompaniesResponse {
    companies: Company[];
    last_evaluated_key: string | null;
}

export interface CreateCompanyData {
    name: string;
    organization_id: string;
    code: string;
    company_logo: string;
    contact_email: string;
    support_email: string;
    inbound_api_details: Record<string, any>;
    outbound_api_details: Record<string, any>;
    feature_flags: Record<string, any>;
    billing_plan: string;
    usage_metrics: Record<string, any>;
    expiry_date: string;
    timezone: string;
    language: string;
    credit_reset_day: number;
    reseller_id: string;
    address: Record<string, any>;
    cooling_period: number;
    industry: string;
    employee_count: number;
    enable_candidate_pool: boolean;
    default_candidate_tags: string[];
    branding_overrides: Record<string, any>;
    allowed_domains: string[];
    default_timezone: string;
    data_retention_days: number;
    auto_archive_days: number;
    assigned_credits: number;
    consumed_credits: number;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
    status?: string;
}

export const useCompanies = (organizationId?: string) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Fetch companies
    const fetchCompanies = useCallback(async (limit: number = 10, lastKey?: string) => {
        try {
            setLoading(true);
            setError(null);

            let url = `admin-get-companies/${organizationId}?limit=${limit}`;
            if (lastKey) {
                url += `&last_evaluated_key=${lastKey}`;
            }

            const response = await adminGetAPI(url);

            if (response.success && response.data) {
                const data: CompaniesResponse = response.data;
                
                if (lastKey) {
                    // Append to existing companies for pagination
                    setCompanies(prev => [...prev, ...data.companies]);
                } else {
                    // Replace companies for fresh load
                    setCompanies(data.companies);
                }
                
                setLastEvaluatedKey(data.last_evaluated_key);
                setHasMore(!!data.last_evaluated_key);
            } else {
                setError(response.data?.message || 'Failed to fetch companies');
                toast.error(response.data?.message || 'Failed to fetch companies');
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('An error occurred while fetching companies');
            toast.error('An error occurred while fetching companies');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create company
    const createCompany = useCallback(async (formData: any) => {
        try {
            setLoading(true);
            setError(null);

            // Format data according to API requirements
            const apiData: CreateCompanyData = {
                name: formData.name ?? '',
                organization_id: formData.organization_id ?? '',
                code: formData.code ?? '',
                company_logo: formData.company_logo ?? '',
                contact_email: formData.contact_email ?? '',
                support_email: formData.support_email ?? '',
                inbound_api_details: formData.inbound_api_details ?? {},
                outbound_api_details: formData.outbound_api_details ?? {},
                feature_flags: formData.feature_flags ?? {},
                billing_plan: formData.billing_plan ?? '',
                usage_metrics: formData.usage_metrics ?? {},
                expiry_date: formData.expiry_date ?? '',
                timezone: formData.timezone ?? '',
                language: formData.language ?? '',
                credit_reset_day: formData.credit_reset_day ?? 0,
                reseller_id: formData.reseller_id ?? '',
                address: formData.address ?? {},
                cooling_period: formData.cooling_period ?? 0,
                industry: formData.industry ?? '',
                employee_count: formData.employee_count ?? 0,
                enable_candidate_pool: formData.enable_candidate_pool ?? false,
                default_candidate_tags: formData.default_candidate_tags ?? [],
                branding_overrides: formData.branding_overrides ?? {},
                allowed_domains: formData.allowed_domains ?? [],
                default_timezone: formData.default_timezone ?? '',
                data_retention_days: formData.data_retention_days ?? 0,
                auto_archive_days: formData.auto_archive_days ?? 0,
                assigned_credits: formData.assigned_credits ?? 0,
                consumed_credits: formData.consumed_credits ?? 0
            };

            const response = await adminPostAPIWithAuth('create-company', apiData);

            if (response.success && response.data) {
                const newCompany = response.data;
                setCompanies(prev => [newCompany, ...prev]);
                toast.success('Company created successfully');
                return { success: true, data: newCompany };
            } else {
                setError(response.data?.message || 'Failed to create company');
                toast.error(response.data?.message || 'Failed to create company');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error creating company:', err);
            setError('An error occurred while creating company');
            toast.error('An error occurred while creating company');
            return { success: false, error: 'An error occurred while creating company' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update company
    const updateCompany = useCallback(async (companyId: string, data: UpdateCompanyData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminPutAPI(`edit-company/${companyId}`, data);

            if (response.success && response.data) {
                const updatedCompany = response.data;
                setCompanies(prev => 
                    prev.map(company => 
                        company.unique_id === companyId ? { ...company, ...updatedCompany } : company
                    )
                );
                toast.success('Company updated successfully');
                return { success: true, data: updatedCompany };
            } else {
                setError(response.data?.message || 'Failed to update company');
                toast.error(response.data?.message || 'Failed to update company');
                return { success: false, error: response.data?.message };
            }
        } catch (err) {
            console.error('Error updating company:', err);
            setError('An error occurred while updating company');
            toast.error('An error occurred while updating company');
            return { success: false, error: 'An error occurred while updating company' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Load more companies (pagination)
    const loadMore = useCallback(() => {
        if (hasMore && !loading && lastEvaluatedKey) {
            fetchCompanies(10, lastEvaluatedKey);
        }
    }, [hasMore, loading, lastEvaluatedKey, fetchCompanies]);

    // Refresh companies
    const refresh = useCallback(() => {
        fetchCompanies(10);
    }, [fetchCompanies]);

    // Initial load
    useEffect(() => {
        fetchCompanies(10);
    }, [fetchCompanies]);

    return {
        companies,
        loading,
        error,
        hasMore,
        fetchCompanies,
        createCompany,
        updateCompany,
        loadMore,
        refresh,
        setError
    };
}