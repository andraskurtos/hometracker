import React, { useState, useEffect, useRef, useMemo, type JSX } from 'react';
import { ChevronDown, Plus, Upload, X, FileImage, Percent, Hash, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type UIOwner, type UIItem, receiptService } from '../services/receiptService';
import { calculateShares, distributeEvenly, convertSharesMode } from '../services/debtService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Spinner } from './ui/Spinner';
import { StatCard } from './ui/StatCard';
import { PageLayout } from './ui/PageLayout';
import { useReceipts, useUploadReceipt, useUpdateItemOwners, useReceiptDebts } from '../hooks/useReceipts';
import { useHouseholdMembers } from '../hooks/useHouseholds';

interface ReceiptSplitterProps {
  householdId: string | null;
}

type SplitMode = 'percent' | 'pcs';

// --- SUB-COMPONENT: DEBT BREAKDOWN ---
const DebtBreakdown = ({ receiptId, settled, members }: { receiptId: number, settled: boolean, members: any[] }) => {
  const { t } = useTranslation();
  const { data: debts, isLoading } = useReceiptDebts(receiptId);
  const currentUserId = localStorage.getItem('userId');

  if (isLoading || !debts) return (
    <div className="flex items-center gap-3 text-neutral-500 py-6">
      <Spinner size="sm" />
      <span className="text-[10px] uppercase tracking-[0.2em] font-black">{t('groceries.debts.calculating')}</span>
    </div>
  );

  const getMember = (id: string) => members.find(m => m.id === id);

  return (
    <div className="flex flex-col gap-4 mb-8 animate-slide-down">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">{t('groceries.debts.summary')}</h4>
      
      {/* Payee Card */}
      <StatCard 
        variant="emerald"
        label={t('groceries.debts.payee')}
        value={debts.payee_share.toLocaleString()}
        description={getMember(debts.payee)?.display_name || getMember(debts.payee)?.first_name}
        icon={
          <div className="flex items-center gap-2">
            {debts.payee === currentUserId && (
              <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5">{t('common.you')}</Badge>
            )}
            <Avatar 
              src={getMember(debts.payee)?.profile_pic_url} 
              firstName={getMember(debts.payee)?.first_name}
              lastName={getMember(debts.payee)?.last_name}
              size="sm"
              borderColor="border-emerald-500/30"
            />
          </div>
        }
      />

      {/* Debtors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {debts.debtors.map((d, idx) => (
          <StatCard 
            key={idx}
            variant="neutral"
            label={t('groceries.debts.debtor')}
            value={d.debtor_share.toLocaleString()}
            description={getMember(d.debtor)?.display_name || getMember(d.debtor)?.first_name}
            className={settled ? 'border-emerald-500/20' : 'border-red-500/10'}
            icon={
              <div className="flex items-center gap-2">
                {d.debtor === currentUserId && (
                  <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5 opacity-50">{t('common.you')}</Badge>
                )}
                <Avatar 
                  src={getMember(d.debtor)?.profile_pic_url} 
                  firstName={getMember(d.debtor)?.first_name}
                  lastName={getMember(d.debtor)?.last_name}
                  size="sm"
                />
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SPLIT MENU ---
const SplitMenu = React.memo(({ 
  receiptId, 
  item, 
  householdId, 
  onClose, 
  onSuccess 
}: { 
  receiptId: number, 
  item: UIItem, 
  householdId: string, 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('percent');
  const [tempShares, setTempShares] = useState<Record<string, number>>({});
  const { data: members = [] } = useHouseholdMembers(householdId);
  const updateOwnersMutation = useUpdateItemOwners();

  // Initial sync from item.owners
  useEffect(() => {
    const initial: Record<string, number> = {};
    item.owners.forEach(o => {
      initial[o.user_id] = splitMode === 'percent' ? o.weight : (o.weight / 100) * item.qty;
    });
    setTempShares(initial);
  }, [item.id, splitMode, item.qty]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleModeSwitch = (newMode: SplitMode) => {
    if (newMode === splitMode) return;
    setTempShares(prev => convertSharesMode(prev, item.qty, newMode));
    setSplitMode(newMode);
  };

  const toggleUserInSplit = (userId: string) => {
    const currentUsers = Object.keys(tempShares).filter(uid => tempShares[uid] > 0);
    const isAlreadyIn = tempShares[userId] > 0;
    const nextUsers = isAlreadyIn ? currentUsers.filter(uid => uid !== userId) : [...currentUsers, userId];

    const target = splitMode === 'percent' ? 100 : item.qty;
    setTempShares(distributeEvenly(target, nextUsers));
  };

  const metrics = useMemo(() => {
    const total = Object.values(tempShares).reduce((a, b) => a + b, 0);
    const target = splitMode === 'percent' ? 100 : item.qty;
    const isValid = Math.abs(total - target) < 0.001;
    return { total, target, isValid };
  }, [tempShares, splitMode, item.qty]);

  const handleSave = async () => {
    if (!metrics.isValid) return;

    const totalItemPrice = item.qty * item.price;
    const usersInSplit = Object.entries(tempShares)
        .filter(([_, val]) => val > 0)
        .map(([uid, val]) => ({
            userId: uid,
            weight: splitMode === 'percent' ? val : (val / item.qty) * 100
        }));
    
    const owners = calculateShares(totalItemPrice, usersInSplit);

    try {
      await updateOwnersMutation.mutateAsync({ receiptId, itemId: item.id, owners });
      onSuccess();
      handleClose();
    } catch (error: any) {
      alert(error.message || "Failed to update owners");
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`absolute top-full right-0 mt-4 min-w-[340px] max-w-md bg-neutral-900 border-2 border-neutral-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] z-[100] p-6 backdrop-blur-2xl flex flex-col ${isClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
    >
      <div className="flex flex-col gap-3 max-h-[min(70vh,500px)] overflow-y-auto pr-0 scrollbar-hide">
        {members.map(member => {
          const isSelected = tempShares[member.id] > 0;
          return (
            <Card key={member.id} padding="p-4" hoverable className={`flex items-center gap-4 border-2 transition-all duration-300 ${isSelected ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-neutral-950/60 border-neutral-800/50'}`} onClick={() => toggleUserInSplit(member.id)}>
              <Checkbox checked={isSelected} onChange={() => toggleUserInSplit(member.id)} />
              <Avatar 
                src={member.profile_pic_url}
                firstName={member.first_name}
                lastName={member.last_name}
                size="md"
                borderColor="border-neutral-700"
                className="shadow-inner"
              />
              <span className="flex-1 text-sm font-black text-neutral-100 tracking-tight truncate">{member.display_name || `${member.first_name} ${member.last_name}`}</span>
              <div className="relative group/input" onClick={(e) => e.stopPropagation()}>
                <input type="number" value={tempShares[member.id] || 0} onChange={(e) => setTempShares(prev => ({ ...prev, [member.id]: parseFloat(e.target.value) || 0 }))} className="w-24 bg-neutral-950 border-2 border-neutral-800 rounded-2xl px-3 py-2.5 text-lg font-black font-mono text-emerald-400 text-right focus:outline-none focus:border-emerald-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner" placeholder="0" step="0.01" />
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-col gap-4 mt-6 pt-6 border-t-2 border-neutral-800/50">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{t('groceries.debts.currentTotal')}</span>
            <span className={`text-sm font-black font-mono ${metrics.isValid ? 'text-emerald-500' : 'text-amber-500'}`}>{metrics.total.toFixed(2)} / {metrics.target} {splitMode === 'percent' ? '%' : 'pcs'}</span>
          </div>
          <div className="flex bg-neutral-950 p-1.5 rounded-2xl border-2 border-neutral-800 shadow-inner">
            <button onClick={() => handleModeSwitch('percent')} className={`p-2 rounded-xl transition-all ${splitMode === 'percent' ? 'bg-neutral-800 text-emerald-400 shadow-xl' : 'text-neutral-600 hover:text-neutral-400'}`} title="Percentage"><Percent size={18} /></button>
            <button onClick={() => handleModeSwitch('pcs')} className={`p-2 rounded-xl transition-all ${splitMode === 'pcs' ? 'bg-neutral-800 text-emerald-400 shadow-xl' : 'text-neutral-600 hover:text-neutral-400'}`} title="Pieces"><Hash size={18} /></button>
          </div>
        </div>
        <Button variant="primary" className="w-full !py-4 text-sm font-black uppercase tracking-[0.2em] shadow-emerald-500/20 shadow-xl rounded-2xl" onClick={handleSave} disabled={!metrics.isValid} isLoading={updateOwnersMutation.isPending}>{metrics.isValid ? t('groceries.debts.applySplit') : t('groceries.debts.invalidSplit')}</Button>
      </div>
    </div>
  );
});

// --- MAIN COMPONENT ---
export default function ReceiptSplitter({ householdId }: ReceiptSplitterProps): JSX.Element {
  const { t } = useTranslation();
  const { data: serverReceipts = [], isLoading: isLoadingReceipts, refetch } = useReceipts(householdId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const uploadMutation = useUploadReceipt(householdId);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [closingReceiptIds, setClosingReceiptIds] = useState<Set<number>>(new Set());
  const [activeSplitId, setActiveSplitId] = useState<{ receiptId: number, itemId: number } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverReceipts.length > 0 && expandedIds.size === 0) {
      // Auto-expand first receipt if needed or just leave as is
    }
  }, [serverReceipts]);

  const toggleAccordion = (id: number) => {
    if (expandedIds.has(id)) {
      setClosingReceiptIds(new Set([id]));
      setTimeout(() => {
        setExpandedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setClosingReceiptIds(new Set());
      }, 500);
    } else {
      setExpandedIds(prev => new Set([...prev, id]));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(t('groceries.upload.error'));
    }
  };

  if (isLoadingReceipts && serverReceipts.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-neutral-500 font-black uppercase tracking-widest text-[10px] animate-pulse">{t('groceries.loading')}</p>
      </div>
    );
  }

  return (
    <PageLayout maxWidth="4xl" className="relative pb-24">
      <div className="fixed bottom-10 right-10 z-40">
        <Button variant="primary" className="w-16 h-16 rounded-full shadow-2xl !p-0 flex items-center justify-center" onClick={() => setIsModalOpen(true)} icon={<Plus size={24} />}>
          {''}
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {serverReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-900/20 rounded-3xl border border-dashed border-neutral-800">
            <Upload size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('groceries.noReceipts')}</p>
          </div>
        ) : (
          serverReceipts.map(receipt => (
            <Card key={receipt.id} className="overflow-hidden" padding="p-0">
              <div onClick={() => toggleAccordion(receipt.id)} className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/40 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><FileImage size={24} /></div>
                  <div>
                    <h3 className="font-bold text-neutral-100">{receipt.storeName}</h3>
                    <p className="text-sm text-neutral-500">{receipt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xl font-black text-emerald-400">{receipt.totalAmount.toLocaleString()}</p>
                  <ChevronDown className={`text-neutral-600 transition-transform duration-300 ${expandedIds.has(receipt.id) && !closingReceiptIds.has(receipt.id) ? 'rotate-180' : ''}`} size={24} />
                </div>
              </div>

              {(expandedIds.has(receipt.id) || closingReceiptIds.has(receipt.id)) && (
                <div className={`border-t border-neutral-800/60 p-6 bg-neutral-950/30 overflow-hidden ${closingReceiptIds.has(receipt.id) ? 'animate-slide-up' : 'animate-slide-down'}`}>
                  <div className="overflow-x-auto overflow-visible">
                    
                    <DebtBreakdown receiptId={receipt.id} settled={receipt.settled} members={members} />

                    <div className="mb-4 ml-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{t('groceries.itemizedBreakdown')}</h4>
                    </div>

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
                            <td className="py-4 text-neutral-500">{item.qty} <span className="text-[10px] opacity-60 ml-0.5">{item.size !== '-' ? item.size : ''}</span></td>
                            <td className="py-4 relative">
                              <div 
                                onClick={() => {
                                  const currentUserId = localStorage.getItem('userId');
                                  if (receipt.payee == currentUserId) {
                                    setActiveSplitId({ receiptId: receipt.id, itemId: item.id });
                                  }
                                }} 
                                className={`flex items-center justify-center -space-x-3 group/stack ${receipt.payee == localStorage.getItem('userId') ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                {members.filter(m => item.owners.some(o => o.user_id === m.id)).slice(0, 3).map((member, idx) => (
                                  <Avatar 
                                    key={member.id}
                                    src={member.profile_pic_url}
                                    firstName={member.first_name}
                                    lastName={member.last_name}
                                    size="sm"
                                    className="ring-2 ring-neutral-900 group-hover/stack:translate-x-1 transition-transform"
                                    style={{ zIndex: 10 - idx }}
                                  />
                                ))}
                                {item.owners.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400 relative z-0 transition-transform group-hover/stack:translate-x-1">+{item.owners.length - 3}</div>}
                                {item.owners.length === 0 && <div className="w-8 h-8 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center text-neutral-600"><Plus size={14} /></div>}
                              </div>

                              {activeSplitId?.itemId === item.id && (
                                <SplitMenu 
                                  receiptId={receipt.id}
                                  item={item}
                                  householdId={householdId!}
                                  onClose={() => setActiveSplitId(null)}
                                  onSuccess={() => refetch()}
                                />
                              )}
                            </td>
                            <td className="py-4 text-right font-bold text-neutral-200">{(item.qty * item.price).toLocaleString()}</td>
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

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => !uploadMutation.isPending && setIsModalOpen(false)} />
          <Card className="w-full max-w-md relative animate-in zoom-in-95 duration-200" padding="p-8">
            <button onClick={() => !uploadMutation.isPending && setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-200 transition-colors"><X size={20} /></button>
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Upload size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-neutral-100 mb-2">{t('groceries.upload.title')}</h3>
                <p className="text-neutral-500">{t('groceries.upload.subtitle')}</p>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-12 border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center gap-3 ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/50'}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]); }} />
                {selectedFile ? (
                  <>
                    <div className="p-3 rounded-2xl bg-emerald-500 text-neutral-950"><Check size={24} /></div>
                    <span className="font-bold text-neutral-200 line-clamp-1 px-4">{selectedFile.name}</span>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-2xl bg-neutral-800 text-neutral-400"><Plus size={24} /></div>
                    <span className="font-bold text-neutral-500">{t('groceries.upload.selectFile')}</span>
                  </>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="neutral" className="flex-1" onClick={() => setIsModalOpen(false)} disabled={uploadMutation.isPending}>{t('common.cancel')}</Button>
                <Button variant="primary" className="flex-1" onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending} isLoading={uploadMutation.isPending}>{uploadMutation.isPending ? t('groceries.modal.analyzing') : t('common.upload')}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
