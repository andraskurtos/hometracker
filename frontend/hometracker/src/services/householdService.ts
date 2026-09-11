import { type SettledStatus } from './receiptService';
import { API_BASE_URL } from '@/config/api';

const getHeaders = (includeAuth = true) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

export interface Household {
    id: string;
    name: string;
    description: string | null;
    join_code: string;
    base_currency: string;
    role: string;
    joined_at: string;
    created_by: string;
}

export interface HouseholdMember {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    profile_pic_url: string | null;
    revolut_username: string | null;
    role: 'admin' | 'member';
    joined_at: string;
}

export interface HouseholdUpdate {
    name?: string;
    description?: string;
    base_currency?: string;
}

export interface GrossDebt {
    other_user_id: string;
    amount: number;
    status: SettledStatus;
}

export interface FinancialSummary {
    debts: GrossDebt[];
    credits: GrossDebt[];
}

export const householdService = {
    fetchFinancialSummary: async (householdId: string): Promise<FinancialSummary> => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/summary`, {
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to fetch summary");
        return data.data;
    },
    settleBulkDebts: async (householdId: string, debtorId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/settle-bulk/${debtorId}`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to settle debts");
        return data;
    },
    markDebtAsPending: async (householdId: string, payeeId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/mark-pending/${payeeId}`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to mark as pending");
        return data;
    },
    rejectBulkSettlement: async (householdId: string, debtorId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/reject-settlement/${debtorId}`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to reject settlement");
        return data;
    },
    fetchGrossDebts: async (householdId: string, userId: string): Promise<GrossDebt[]> => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/debts/${userId}`, {
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to fetch debts");
        // The API returns {status: "success", data: [...]} or a list directly depending on implementation
        return data.data || data;
    },
    createHousehold: async (name: string, description?: string, baseCurrency: string = "HUF") => {
        const response = await fetch(`${API_BASE_URL}/household/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
                name, 
                description, 
                base_currency: baseCurrency 
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to create household");
        return data;
    },

    joinHousehold: async (joinCode: string) => {
        const response = await fetch(`${API_BASE_URL}/household/join`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ join_code: joinCode }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to join household");
        return data;
    },

    getMyHouseholds: async (): Promise<Household[]> => {
        const response = await fetch(`${API_BASE_URL}/household/me`, {
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to fetch households");
        return data;
    },

    getHouseholdMembers: async (householdId: string): Promise<HouseholdMember[]> => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/members`, {
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to fetch members");
        return data;
    },

    updateHousehold: async (householdId: string, payload: { name?: string, description?: string, base_currency?: string }) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to update household");
        return data;
    },

    regenerateJoinCode: async (householdId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/regenerate-code`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to regenerate join code");
        return data.new_code;
    },

    promoteMember: async (householdId: string, userId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/promote/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to promote member");
        return data;
    },

    kickMember: async (householdId: string, userId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/deactivate/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to kick member");
        return data;
    },

    deactivateHousehold: async (householdId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/deactivate`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to deactivate household");
        return data;
    }
};