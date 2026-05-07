
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

export const userService = {
    login: async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Login failed");

        localStorage.setItem('token', data.access_token);

        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    // --- PROFILE OPERATIONS ---
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch the profile');
        return data;
    },

    updateProfile: async (payload: any) => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to update the profile');
        return data;
    },

    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload avatar');
        return await response.json();
    }
};