// src/services/receiptService.ts

const API_BASE_URL = `http://${window.location.hostname}:8000/api/receipts`;

const getHeaders = () => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// --- TYPES DECLARED IN BACKEND ---
export interface BackendOwner {
  id: string;
  percentage: number;
}

export interface BackendItem {
  id: number;
  name: string;
  receipt_name: string;
  size: number | null;
  size_type: 'none' | 'volume' | 'weight' | 'pcs';
  quantity: number;
  price_paid: number;
  owners: BackendOwner[];
}

export interface BackendReceipt {
  id: number;
  store: { name: string };
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: BackendItem[];
}

// --- TYPES EXPECTED BY UI ---
export interface UIOwner {
  userId: string;
  percentage: number;
}

export interface UIItem {
  id: number;
  name: string;
  qty: number;
  size: string;
  price: number;
  owners: UIOwner[]; 
}

export interface UIReceipt {
  id: number;
  storeName: string;
  date: string;
  items: UIItem[];
}

// --- TRANSFORMATION LOGIC ---
const formatSize = (size: number | null, type: string): string => {
  if (size === null || type === 'none') return '-';
  
  if (type === 'weight') {
    if (size < 1) return `${(size * 1000).toFixed(0)}g`;
    return `${size}kg`;
  }
  
  if (type === 'volume') {
    if (size < 1) return `${(size * 1000).toFixed(0)}ml`;
    return `${size}L`;
  }
  
  if (type === 'pcs') return `${size} pcs`;
  
  return `${size}`;
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
};

// --- API CALLS ---
export const receiptService = {
  fetchReceipts: async (householdId: string): Promise<UIReceipt[]> => {
    const response = await fetch(`${API_BASE_URL}/${householdId}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) throw new Error('Failed to fetch receipts');
    
    const json = await response.json();
    const rawReceipts: BackendReceipt[] = json.data;

    return rawReceipts.map(receipt => ({
      id: receipt.id,
      storeName: receipt.store.name,
      date: formatDate(receipt.created_at),
      items: receipt.items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.quantity,
        size: formatSize(item.size, item.size_type),
        price: Number(item.price_paid),
        owners: item.owners.map(o => ({
          userId: o.id,
          percentage: Number(o.percentage)
        })),
      }))
    }));
  },

  uploadReceipt: async (householdId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/parse?household_id=${householdId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Upload failed');
    }

    return await response.json();
  }
};
