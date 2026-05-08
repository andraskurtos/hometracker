const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

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
    id: number;
    name: string;
    description: string | null;
    join_code: string;
    base_currency: string;
    role: string;
    joined_at: string;
}

export interface HouseholdMember {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    profile_pic_url: string | null;
    role: 'admin' | 'member';
    joined_at: string;
}

export interface HouseholdUpdate {
    name?: string;
    description?: string;
    base_currency?: string;
}

export const householdService = {
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

    getHouseholdMembers: async (householdId: number): Promise<HouseholdMember[]> => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/members`, {
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to fetch members");
        return data;
    },

    updateHousehold: async (householdId: number, payload: { name?: string, description?: string, base_currency?: string }) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to update household");
        return data;
    },

    regenerateJoinCode: async (householdId: number) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/regenerate-code`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to regenerate join code");
        return data.new_code;
    },

    promoteMember: async (householdId: number, userId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/promote/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to promote member");
        return data;
    },

    kickMember: async (householdId: number, userId: string) => {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}/deactivate/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to kick member");
        return data;
    }
};