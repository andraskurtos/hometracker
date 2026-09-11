import { storageService } from './storageService';
import { API_BASE_URL } from '@/config/api';

const getHeaders = (includeAuth = true) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = storageService.getToken();
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

        storageService.setToken(data.access_token);

        return data;
    },

    register: async (email: string, password: string, firstName: string, lastName: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ 
                email, 
                password, 
                first_name: firstName, 
                last_name: lastName 
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Registration failed");

        return data;
    },

    logout: () => {
        storageService.clearToken();
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

        const token = storageService.getToken();
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
