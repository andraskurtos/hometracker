import React, { useState, useEffect, useRef, type JSX } from 'react';
import { ChevronDown, Plus, Upload, X, FileImage, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type UIReceipt } from '../services/receiptService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useReceipts, useUploadReceipt } from '../hooks/useReceipts';

const AVAILABLE_USERS: number[] = [1, 2, 3];

export default function ReceiptSplitter(): JSX.Element {
  const { t } = useTranslation();
  
  // --- QUERIES & MUTATIONS ---
  const { data: serverReceipts = [], isLoading: isLoadingReceipts } = useReceipts();
  const uploadMutation = useUploadReceipt();

  // --- LOCAL STATE FOR OPTIMISTIC UI / INTERACTION ---
  const [receipts, setReceipts] = useState<UIReceipt[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // --- NEW UPLOAD STATE ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local receipts state with server data
  useEffect(() => {
    if (serverReceipts.length > 0) {
      setReceipts(serverReceipts);
      
      // Automatically expand the newest receipt if none are expanded
      if (expandedIds.size === 0) {
        setExpandedIds(new Set([serverReceipts[0].id]));
      }
    }
  }, [serverReceipts]);

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
    // TODO: Persistence for recipients assignment in the future
  };

  // --- UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadMutation.mutateAsync(selectedFile);
      // Success! Close modal, clear file.
      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      alert(t('groceries.errors.uploadFailed'));
    }
  };

  if (isLoadingReceipts && receipts.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">{t('groceries.loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Floating Action Button for Upload */}
      <div className="fixed bottom-10 right-10 z-40">
        <Button 
          variant="emerald"
          className="w-16 h-16 rounded-full shadow-2xl !p-0 flex items-center justify-center"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 mb-24">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-900/20 rounded-3xl border border-dashed border-neutral-800">
            <Upload size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('groceries.noReceipts')}</p>
          </div>
        ) : (
          receipts.map(receipt => (
            <Card 
              key={receipt.id}
              className="overflow-hidden"
              padding="p-0"
            >
              {/* Accordion Header */}
              <div 
                onClick={() => toggleAccordion(receipt.id)}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/40 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <FileImage size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-100">{receipt.storeName}</h3>
                    <p className="text-sm text-neutral-500">{receipt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-400">{receipt.items.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString()}</p>
                  </div>
                  <ChevronDown 
                    className={`text-neutral-600 transition-transform duration-300 ${expandedIds.has(receipt.id) ? 'rotate-180' : ''}`} 
                    size={24} 
                  />
                </div>
              </div>

              {/* Accordion Content */}
              {expandedIds.has(receipt.id) && (
                <div className="border-t border-neutral-800/60 p-6 bg-neutral-950/30 animate-in slide-in-from-top-2 duration-300">
                  {receipt.items.length === 0 ? (
                    <p className="text-neutral-500 text-center py-4">{t('groceries.noItems')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs uppercase tracking-widest text-neutral-600 border-b border-neutral-800">
                            <th className="pb-4 font-bold">{t('groceries.headers.name')}</th>
                            <th className="pb-4 font-bold">{t('groceries.headers.qty')}</th>
                            <th className="pb-4 font-bold text-center">{t('groceries.headers.who')}</th>
                            <th className="pb-4 font-bold text-right">{t('groceries.headers.price')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/40">
                          {receipt.items.map(item => (
                            <tr key={item.id} className="group hover:bg-neutral-800/20 transition-colors">
                              <td className="py-4 font-medium text-neutral-300">{item.name}</td>
                              <td className="py-4 text-neutral-500">
                                {item.qty} <span className="text-[10px] opacity-60 ml-0.5">{item.size !== '-' ? item.size : ''}</span>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  {AVAILABLE_USERS.map(userId => (
                                    <button
                                      key={userId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRecipient(receipt.id, item.id, userId);
                                      }}
                                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border ${
                                        item.recipients.includes(userId)
                                          ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                          : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-500'
                                      }`}
                                    >
                                      U{userId}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 text-right font-bold text-neutral-200">
                                {item.price.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-neutral-100 mb-6">{t('groceries.modal.title')}</h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer mb-8 ${
                selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center text-emerald-400">
                  <FileImage size={40} className="mb-2" />
                  <p className="font-medium text-sm text-center px-4 line-clamp-1">{selectedFile.name}</p>
                </div>
              ) : (
                <>
                  <Upload size={40} className="text-neutral-700 mb-3" />
                  <p className="text-neutral-500 text-sm">{t('groceries.modal.uploadText')}</p>
                </>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="neutral"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="emerald"
                className="flex-1"
                onClick={handleUpload}
                isLoading={uploadMutation.isPending}
                disabled={!selectedFile}
              >
                {uploadMutation.isPending ? t('groceries.modal.analyzing') : t('groceries.modal.submit')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
