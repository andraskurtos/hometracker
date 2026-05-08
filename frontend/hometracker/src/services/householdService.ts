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
    }
};