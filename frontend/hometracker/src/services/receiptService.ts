import { storageService } from './storageService';
import { API_BASE_URL as API_ROOT } from '@/config/api';

const API_BASE_URL = `${API_ROOT}/receipts`;

const getHeaders = () => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = storageService.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// --- TYPES DECLARED IN BACKEND ---
export type SettledStatus = 'unsettled' | 'pending' | 'settled';

export interface BackendOwner {
  id: string;
  amount: number; 
  settled: SettledStatus;
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
  payee: string;
  items: BackendItem[];
}

export interface BackendDebtor {
  debtor: string;
  debtor_share: number;
  status: SettledStatus;
}

export interface BackendDebts {
  payee: string;
  payee_share: number;
  debtors: BackendDebtor[];
}

// --- TYPES EXPECTED BY UI ---
export interface UIOwner {
  userId: string;
  amount: number; 
  settled: SettledStatus;
}

export interface UIItem {
  id: number;
  name: string;
  qty: number;
  size: string;
  rawSize: number | null;
  price: number;
  owners: UIOwner[]; 
}

export interface UIReceipt {
  id: number;
  storeName: string;
  date: string;
  totalAmount: number;
  payee: string;
  settled: boolean; // Derived from items
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

    return rawReceipts.map(receipt => {
      const items = receipt.items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.quantity,
        size: formatSize(item.size, item.size_type),
        rawSize: item.size,
        price: Number(item.price_paid),
        owners: item.owners.map(o => ({
          userId: o.id,
          amount: Number(o.amount),
          settled: o.settled
        })),
      }));

      // A receipt is settled if all non-payee owners are settled across ALL items
      // Check every owner of every item: if user != payee, they must be settled.
      const allOwnersSettled = items.every(item => 
        item.owners.every(o => o.userId === receipt.payee || o.settled === 'settled')
      );

      return {
        id: receipt.id,
        storeName: receipt.store.name,
        date: formatDate(receipt.created_at),
        totalAmount: Number(receipt.total_amount),
        payee: receipt.payee,
        settled: allOwnersSettled,
        items
      };
    });
  },

  fetchReceiptDebts: async (receiptId: number): Promise<BackendDebts> => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}/debts`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch debts');
    return await response.json();
  },

  uploadReceipt: async (householdId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = storageService.getToken();
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
  },

  updateItemOwners: async (receiptId: number, itemId: number, owners: UIOwner[]) => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        owners: owners.map(o => ({
          id: o.userId,
          amount: o.amount
        }))
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update owners');
    }

    return await response.json();
  },

  deleteReceipt: async (receiptId: number) => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete receipt');
    }

    return await response.json();
  },

  updateReceiptItem: async (receiptId: number, itemId: number, payload: { name?: string, size?: number, quantity?: number, price_paid?: number }) => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}/items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update receipt item');
    }

    return await response.json();
  },

  markReceiptAsPending: async (receiptId: number) => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}/settle`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to mark as pending');
    }

    return await response.json();
  },

  confirmReceiptSettlement: async (receiptId: number, targetUserId: string) => {
    const response = await fetch(`${API_BASE_URL}/${receiptId}/settle-confirm/${targetUserId}`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to confirm settlement');
    }

    return await response.json();
  }
};
