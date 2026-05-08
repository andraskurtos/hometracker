import React, { useState, useEffect, useRef, type JSX } from 'react';
import { ChevronDown, Plus, Loader2, Upload, X, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchReceipts, uploadReceipt, type UIReceipt } from '../services/receiptService';

const AVAILABLE_USERS: number[] = [1, 2, 3];

export default function ReceiptSplitter(): JSX.Element {
  const { t } = useTranslation();
  // --- EXISTING STATE ---
  const [receipts, setReceipts] = useState<UIReceipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // --- NEW UPLOAD STATE ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA LOADING ---
  // Extracted into a standalone function so we can call it after an upload!
  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchReceipts();
    setReceipts(data);
    
    // Automatically expand the newest receipt
    if (data.length > 0) {
      setExpandedIds(new Set([data[0].id]));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- UI INTERACTION LOGIC ---
  const toggleAccordion = (id: number): void => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleRecipient = (receiptId: number, itemId: string, userId: number): void => {
    setReceipts(prevReceipts => 
      prevReceipts.map(receipt => {
        if (receipt.id !== receiptId) return receipt;
        return {
          ...receipt,
          items: receipt.items.map(item => {
            if (item.id !== itemId) return item;
            const hasUser = item.recipients.includes(userId);
            const newRecipients = hasUser
              ? item.recipients.filter(id => id !== userId) 
              : [...item.recipients, userId];               
            return { ...item, recipients: newRecipients };
          })
        };
      })
    );
  };

  // --- UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      await uploadReceipt(selectedFile);
      // Success! Close modal, clear file, refresh data.
      setIsModalOpen(false);
      setSelectedFile(null);
      await loadData(); 
    } catch (error) {
      alert(t('groceries.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && receipts.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">{t('groceries.loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="w-full flex-1 bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm md:rounded-2xl shadow-2xl overflow-y-auto no-scrollbar">
        
        {receipts.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">{t('groceries.noReceipts')}</div>
        ) : (
          receipts.map((receipt) => {
            const isExpanded = expandedIds.has(receipt.id);
            return (
              <div key={receipt.id} className="border-b border-neutral-800/60 last:border-b-0">
                <button 
                  onClick={() => toggleAccordion(receipt.id)} 
                  className="w-full flex justify-between items-center p-6 md:p-8 hover:bg-neutral-800/40 transition-colors active:bg-neutral-800"
                >
                  <div className="flex flex-col items-start md:flex-row md:items-baseline md:space-x-6">
                    <h2 className="text-3xl font-extrabold text-neutral-200 tracking-wide">{receipt.storeName}</h2>
                    <span className="text-lg text-neutral-500 mt-1 md:mt-0">{receipt.date}</span>
                  </div>
                  <ChevronDown 
                    className={`w-8 h-8 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    strokeWidth={2.5}
                  />
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 md:px-8 md:pb-8">
                    {receipt.items.length === 0 ? (
                      <p className="text-neutral-500 italic text-lg py-4">{t('groceries.noItems')}</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 gap-4 text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800/60 pb-4">
                          <div className="col-span-4 lg:col-span-5">{t('groceries.headers.name')}</div>
                          <div className="col-span-1 text-center">{t('groceries.headers.qty')}</div>
                          <div className="col-span-1 lg:col-span-2 text-center hidden sm:block">{t('groceries.headers.size')}</div>
                          <div className="col-span-4 lg:col-span-2 text-center">{t('groceries.headers.who')}</div>
                          <div className="col-span-3 lg:col-span-2 text-right">{t('groceries.headers.price')}</div>
                        </div>

                        {receipt.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-5 border-b border-neutral-800/40 last:border-0 hover:bg-neutral-800/20 transition-colors rounded-xl px-4 -mx-4">
                            <div className="col-span-4 lg:col-span-5 text-lg font-semibold leading-tight text-neutral-300 pr-2 truncate">
                              {item.name}
                            </div>
                            <div className="col-span-1 text-xl text-center text-neutral-400 font-medium">
                              {item.qty}
                            </div>
                            <div className="col-span-1 lg:col-span-2 text-base text-center text-neutral-500 hidden sm:block">
                              {item.size}
                            </div>
                            
                            <div className="col-span-4 lg:col-span-2 flex justify-center space-x-3">
                              {AVAILABLE_USERS.map(userId => {
                                const isSelected = item.recipients.includes(userId);
                                return (
                                  <button
                                    key={userId}
                                    onClick={() => toggleRecipient(receipt.id, item.id, userId)}
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold cursor-pointer transition-all duration-200 flex-shrink-0 ${
                                      isSelected 
                                        ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' 
                                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-neutral-200'
                                    }`}
                                  >
                                    {userId}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="col-span-3 lg:col-span-2 text-xl text-right font-bold text-neutral-200">
                              {item.price}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Primary Action Button (Opens Modal) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-emerald-500 text-neutral-950 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 z-40"
      >
        <Plus size={40} strokeWidth={2.5} />
      </button>

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6 relative flex flex-col">
            
            <button 
              onClick={() => { setIsModalOpen(false); setSelectedFile(null); }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300"
              disabled={isUploading}
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-neutral-200 mb-6">{t('groceries.modal.title')}</h3>

            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Custom styled file picker area */}
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                selectedFile 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-600'
              }`}
            >
              {selectedFile ? (
                <>
                  <FileImage className="w-10 h-10 text-emerald-500 mb-2" />
                  <span className="text-emerald-400 font-medium text-center px-4 truncate w-full">{selectedFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-neutral-500 mb-2" />
                  <span className="text-neutral-400 font-medium">{t('groceries.modal.uploadText')}</span>
                </>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`mt-6 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                !selectedFile || isUploading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  {t('groceries.modal.analyzing')}
                </>
              ) : (
                t('groceries.modal.submit')
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}