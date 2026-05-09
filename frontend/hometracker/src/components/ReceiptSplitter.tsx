import React, { useState, useEffect, useRef, type JSX } from 'react';
import { ChevronDown, Plus, Upload, X, FileImage, Loader2, Percent, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type UIReceipt, type UIItem, type UIOwner } from '../services/receiptService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { useReceipts, useUploadReceipt } from '../hooks/useReceipts';
import { useHouseholdMembers } from '../hooks/useHouseholds';
import { getAssetUrl } from '../utils/assetUtils';

interface ReceiptSplitterProps {
  householdId: string | null;
}

type SplitMode = 'percent' | 'pcs';

export default function ReceiptSplitter({ householdId }: ReceiptSplitterProps): JSX.Element {
  const { t } = useTranslation();
  
  // --- QUERIES & MUTATIONS ---
  const { data: serverReceipts, isLoading: isLoadingReceipts } = useReceipts(householdId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const uploadMutation = useUploadReceipt(householdId);

  // --- LOCAL STATE ---
  const [receipts, setReceipts] = useState<UIReceipt[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [activeSplit, setActiveSplit] = useState<{ receiptId: number, item: UIItem } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('percent');
  const [tempShares, setTempShares] = useState<Record<string, number>>({});

  // --- NEW UPLOAD STATE ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync local receipts state with server data
  useEffect(() => {
    if (serverReceipts) {
      setReceipts(serverReceipts);
      if (expandedIds.size === 0 && serverReceipts.length > 0) {
        setExpandedIds(new Set([serverReceipts[0].id]));
      }
    }
  }, [serverReceipts]);

  const closeSplitMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveSplit(null);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  // Handle click outside for split dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeSplitMenu();
      }
    };
    if (activeSplit && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSplit, isClosing]);

  // --- UI INTERACTION LOGIC ---
  const toggleAccordion = (id: number): void => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openSplitMenu = (receiptId: number, item: UIItem) => {
    setActiveSplit({ receiptId, item });
    setIsClosing(false);
    setSplitMode('percent'); // Reset to percent by default
    
    // Initialize temp shares from item owners
    const initialShares: Record<string, number> = {};
    item.owners.forEach(o => {
      initialShares[o.userId] = o.percentage;
    });
    setTempShares(initialShares);
  };

  const calculateEvenSplit = (selectedUserIds: string[]) => {
    if (selectedUserIds.length === 0) return {};
    
    const count = selectedUserIds.length;
    const baseShare = Math.floor((100 / count) * 100) / 100;
    const remainder = Math.round((100 - (baseShare * count)) * 100) / 100;
    
    const newShares: Record<string, number> = {};
    selectedUserIds.forEach((uid, idx) => {
      newShares[uid] = idx === 0 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare;
    });
    return newShares;
  };

  const toggleUserInSplit = (userId: string) => {
    const currentUsers = Object.keys(tempShares).filter(uid => tempShares[uid] > 0);
    const isAlreadyIn = tempShares[userId] > 0;
    
    let nextUsers: string[];
    if (isAlreadyIn) {
      nextUsers = currentUsers.filter(uid => uid !== userId);
    } else {
      nextUsers = [...currentUsers, userId];
    }
    
    const newShares = calculateEvenSplit(nextUsers);
    setTempShares(newShares);
  };

  const handleShareChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    if (splitMode === 'percent') {
      setTempShares(prev => ({ ...prev, [userId]: numValue }));
    } else {
      // Convert pcs to percentage
      const totalQty = activeSplit?.item.qty || 1;
      const percentage = (numValue / totalQty) * 100;
      setTempShares(prev => ({ ...prev, [userId]: Math.round(percentage * 100) / 100 }));
    }
  };

  const saveSplit = () => {
    if (!activeSplit) return;

    // TODO: Call API to save split
    const updatedOwners: UIOwner[] = Object.entries(tempShares)
      .filter(([_, pct]) => pct > 0)
      .map(([uid, pct]) => ({ userId: uid, percentage: pct }));

    setReceipts(prev => prev.map(r => {
      if (r.id !== activeSplit.receiptId) return r;
      return {
        ...r,
        items: r.items.map(i => {
          if (i.id !== activeSplit.item.id) return i;
          return { ...i, owners: updatedOwners };
        })
      };
    }));

    closeSplitMenu();
  };

  // --- UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !householdId) return;
    try {
      await uploadMutation.mutateAsync(selectedFile);
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
      <div className="fixed bottom-10 right-10 z-40">
        <Button 
          variant="emerald"
          className="w-16 h-16 rounded-full shadow-2xl !p-0 flex items-center justify-center"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={24} />}
        />
      </div>

      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 mb-24">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-900/20 rounded-3xl border border-dashed border-neutral-800">
            <Upload size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('groceries.noReceipts')}</p>
          </div>
        ) : (
          receipts.map(receipt => (
            <Card key={receipt.id} className="overflow-hidden" padding="p-0">
              <div onClick={() => toggleAccordion(receipt.id)} className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/40 transition-colors group">
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
                  <p className="text-xl font-black text-emerald-400">{receipt.items.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString()}</p>
                  <ChevronDown className={`text-neutral-600 transition-transform duration-300 ${expandedIds.has(receipt.id) ? 'rotate-180' : ''}`} size={24} />
                </div>
              </div>

              {expandedIds.has(receipt.id) && (
                <div className="border-t border-neutral-800/60 p-6 bg-neutral-950/30 animate-in slide-in-from-top-2 duration-300">
                  <div className="overflow-x-auto overflow-visible">
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
                            <td className="py-4 relative">
                              <div 
                                onClick={() => openSplitMenu(receipt.id, item)}
                                className="flex items-center justify-center -space-x-3 group/stack cursor-pointer"
                              >
                                {members.filter(m => item.owners.some(o => o.userId === m.id)).slice(0, 3).map((member, idx) => (
                                  <div key={member.id} className="relative w-8 h-8 rounded-full border-2 border-neutral-900 overflow-hidden bg-neutral-800 transition-transform group-hover/stack:translate-x-1" style={{ zIndex: 10 - idx }}>
                                    {member.profile_pic_url ? (
                                      <img src={getAssetUrl(member.profile_pic_url)!} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">
                                        {member.first_name[0]}{member.last_name[0]}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {item.owners.length > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400 relative z-0 transition-transform group-hover/stack:translate-x-1">
                                    +{item.owners.length - 3}
                                  </div>
                                )}
                                {item.owners.length === 0 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center text-neutral-600">
                                    <Plus size={14} />
                                  </div>
                                )}
                              </div>

                              {/* Split Dropdown */}
                              {activeSplit?.item.id === item.id && (
                                <div 
                                  ref={dropdownRef} 
                                  className={`absolute top-full right-0 mt-4 w-96 bg-neutral-900 border-2 border-neutral-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] z-[100] p-6 backdrop-blur-2xl
                                             ${isClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
                                >
                                  <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-0 scrollbar-hide">
                                    {members.map(member => {
                                      const isSelected = tempShares[member.id] > 0;
                                      const displayValue = splitMode === 'percent' 
                                        ? (tempShares[member.id] || 0)
                                        : (Math.round(((tempShares[member.id] || 0) / 100) * item.qty * 100) / 100);

                                      return (
                                        <Card 
                                          key={member.id} 
                                          padding="p-4" 
                                          hoverable
                                          className={`flex items-center gap-4 border-2 transition-all duration-300 ${isSelected ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-neutral-950/60 border-neutral-800/50'}`}
                                          onClick={() => toggleUserInSplit(member.id)}
                                        >
                                          <Checkbox 
                                            checked={isSelected} 
                                            onChange={() => toggleUserInSplit(member.id)} 
                                          />
                                          
                                          <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-inner shrink-0">
                                            {member.profile_pic_url ? (
                                              <img src={getAssetUrl(member.profile_pic_url)!} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-500">
                                                {member.first_name[0]}{member.last_name[0]}
                                              </div>
                                            )}
                                          </div>
                                          
                                          <span className="flex-1 text-sm font-black text-neutral-100 tracking-tight truncate">
                                            {member.display_name || `${member.first_name} ${member.last_name}`}
                                          </span>

                                          <div className="relative group/input" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                              type="number"
                                              value={displayValue}
                                              onChange={(e) => handleShareChange(member.id, e.target.value)}
                                              className="w-24 bg-neutral-950 border-2 border-neutral-800 rounded-2xl px-3 py-2.5 text-lg font-black font-mono text-emerald-400 text-right focus:outline-none focus:border-emerald-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                              placeholder="0"
                                              step="0.01"
                                            />
                                            <div className="absolute right-0 top-full mt-1 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
                                              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{splitMode === 'percent' ? '%' : 'pcs'}</span>
                                            </div>
                                          </div>
                                        </Card>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center gap-4 mt-6 pt-6 border-t-2 border-neutral-800/50">
                                    <div className="flex bg-neutral-950 p-2 rounded-2xl border-2 border-neutral-800 shadow-inner">
                                      <button 
                                        onClick={() => setSplitMode('percent')}
                                        className={`p-2.5 rounded-xl transition-all ${splitMode === 'percent' ? 'bg-neutral-800 text-emerald-400 shadow-xl' : 'text-neutral-600 hover:text-neutral-400'}`}
                                        title="Percentage"
                                      >
                                        <Percent size={20} />
                                      </button>
                                      <button 
                                        onClick={() => setSplitMode('pcs')}
                                        className={`p-2.5 rounded-xl transition-all ${splitMode === 'pcs' ? 'bg-neutral-800 text-emerald-400 shadow-xl' : 'text-neutral-600 hover:text-neutral-400'}`}
                                        title="Pieces"
                                      >
                                        <Hash size={20} />
                                      </button>
                                    </div>
                                    
                                    <Button 
                                      variant="primary" 
                                      className="flex-1 !py-4 text-sm font-black uppercase tracking-[0.2em] shadow-emerald-500/20 shadow-xl rounded-2xl"
                                      onClick={saveSplit}
                                    >
                                      Apply Split
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 text-right font-bold text-neutral-200">{item.price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-200 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-neutral-100 mb-6">{t('groceries.modal.title')}</h2>
            <div onClick={() => fileInputRef.current?.click()} className={`w-full aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer mb-8 ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40'}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
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
              <Button variant="neutral" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button variant="emerald" className="flex-1" onClick={handleUpload} isLoading={uploadMutation.isPending} disabled={!selectedFile}>{uploadMutation.isPending ? t('groceries.modal.analyzing') : t('groceries.modal.submit')}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
