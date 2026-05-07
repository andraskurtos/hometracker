// src/services/receiptService.ts

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

// --- TYPES DECLARED IN BACKEND ---
export interface BackendItem {
  name: string;
  receipt_name: string;
  size: number | null;
  size_type: 'none' | 'volume' | 'weight' | 'pcs';
  quantity: number;
  price_paid: number;
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
export interface UIItem {
  id: string; // Using a string combo since the merge table doesn't have a single ID
  name: string;
  qty: number;
  size: string;
  price: number;
  recipients: number[];
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
    // If it's less than 1kg, show it in grams (e.g., 0.5kg -> 500g)
    if (size < 1) return `${(size * 1000).toFixed(0)}g`;
    return `${size}kg`;
  }
  
  if (type === 'volume') {
    // If it's less than 1L, show it in ml (e.g., 0.33L -> 330ml)
    if (size < 1) return `${(size * 1000).toFixed(0)}ml`;
    return `${size}L`;
  }
  
  if (type === 'pcs') {
    return `${size} pcs`;
  }
  
  return `${size}`;
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  // Formats to YYYY.MM.DD. (Hungarian standard)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
};

// --- API CALLS ---
export const fetchReceipts = async (): Promise<UIReceipt[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/receipts`);
    if (!response.ok) throw new Error('Failed to fetch receipts');
    
    const json = await response.json();
    const rawReceipts: BackendReceipt[] = json.data;

    // Transform backend data to match our gorgeous UI format
    return rawReceipts.map(receipt => ({
      id: receipt.id,
      storeName: receipt.store.name,
      date: formatDate(receipt.created_at),
      items: receipt.items.map((item, index) => ({
        // Generate a unique ID for the UI using the receipt ID and index
        id: `${receipt.id}-item-${index}`,
        name: item.name,
        qty: item.quantity,
        size: formatSize(item.size, item.size_type),
        price: Number(item.price_paid),
        recipients: [], // Default to nobody assigned yet
      }))
    }));
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return []; // Return empty array on failure so UI doesn't crash
  }

};

export const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  // 'file' here MUST match the parameter name in your FastAPI endpoint:
  // async def parse_receipt_endpoint(file: UploadFile = File(...))
  formData.append('file', file); 

  try {
    const response = await fetch(`${API_BASE_URL}/parse-receipt`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading receipt:", error);
    throw error;
  }
};