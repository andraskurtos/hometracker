import { ChevronDown, Plus, Upload, X, FileImage, Percent, Hash, Check, Trash2, AlertCircle, Pencil, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type UIItem } from '@/services/receiptService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { PageLayout } from '@/components/ui/PageLayout';
import { PopupMenu } from '@/components/ui/PopupMenu';
import { useReceiptDebts, useUpdateReceiptItem } from '../hooks/useReceipts';
import { useReceiptSplitterLogic } from '../hooks/useReceiptSplitterLogic';
import { useSplitMenuLogic } from '../hooks/useSplitMenuLogic';
import { storageService } from '@/services/storageService';
import { type HouseholdMember } from '@/services/householdService';
import { memo, useRef, useState } from 'react';

interface ReceiptSplitterProps {
  householdId: string | null;
}

// --- SUB-COMPONENT: DEBT BREAKDOWN ---
const DebtBreakdown = ({ 
  receiptId, 
  payeeId,
  members,
  onMarkPending,
  onConfirmSettlement
}: { 
  receiptId: number, 
  payeeId: string,
  members: HouseholdMember[],
  onMarkPending: (id: number) => void,
  onConfirmSettlement: (rId: number, uId: string) => void
}) => {
  const { t } = useTranslation();
  const { data: debts, isLoading } = useReceiptDebts(receiptId);
  const currentUserId = storageService.getUserId();

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
        {debts.debtors.map((d: any, idx: number) => (
          <StatCard 
            key={idx}
            variant="neutral"
            label={t('groceries.debts.debtor')}
            value={d.debtor_share.toLocaleString()}
            description={getMember(d.debtor)?.display_name || getMember(d.debtor)?.first_name}
            className={
              d.status === 'settled' ? 'border-emerald-500/20' : 
              d.status === 'pending' ? 'border-amber-500/20' : 
              'border-red-500/10'
            }
            icon={
              <div className="flex items-center gap-2">
                {d.debtor === currentUserId && (
                  <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5 opacity-50">{t('common.you')}</Badge>
                )}
                {d.status === 'pending' && (
                  <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">{t('common.pending')}</Badge>
                )}
                <div className="flex items-center gap-1">
                  {d.debtor === currentUserId && d.status === 'unsettled' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="h-8 !px-3 !py-0 text-[9px] font-black uppercase tracking-tight"
                      onClick={() => onMarkPending(receiptId)}
                      icon={<CreditCard size={12} />}
                    >
                      {t('common.settle')}
                    </Button>
                  )}
                  {payeeId === currentUserId && d.status !== 'settled' && (
                    <Button 
                      variant="emerald" 
                      size="sm" 
                      className="h-8 !px-3 !py-0 text-[9px] font-black uppercase tracking-tight"
                      onClick={() => onConfirmSettlement(receiptId, d.debtor)}
                      icon={<Check size={12} />}
                    >
                      {t('common.confirm')}
                    </Button>
                  )}
                  <Avatar 
                    src={getMember(d.debtor)?.profile_pic_url} 
                    firstName={getMember(d.debtor)?.first_name}
                    lastName={getMember(d.debtor)?.last_name}
                    size="sm"
                  />
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SPLIT MENU ---
const SplitMenu = memo(({ 
  receiptId, 
  item, 
  householdId, 
  onClose, 
  onSuccess,
  anchorRef
}: { 
  receiptId: number, 
  item: UIItem, 
  householdId: string, 
  onClose: () => void, 
  onSuccess: () => void,
  anchorRef: React.RefObject<HTMLElement | null>
}) => {
  const logic = useSplitMenuLogic({ receiptId, item, householdId, onClose, onSuccess });
  const { 
    t, 
    isClosing, 
    splitMode, 
    tempShares, 
    members, 
    metrics, 
    isUpdating, 
    handleModeSwitch, 
    toggleUserInSplit, 
    handleSave,
    updateShareManually
  } = logic;

  return (
    <PopupMenu 
      anchorRef={anchorRef} 
      onClose={onClose}
      className={`mt-4 min-w-[340px] max-w-md bg-neutral-900 border-2 border-neutral-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] p-6 backdrop-blur-2xl flex flex-col ${isClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
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
                <input 
                    type="number" 
                    value={tempShares[member.id] || 0} 
                    onChange={(e) => updateShareManually(member.id, parseFloat(e.target.value) || 0)} 
                    className="w-24 bg-neutral-950 border-2 border-neutral-800 rounded-2xl px-3 py-2.5 text-lg font-black font-mono text-emerald-400 text-right focus:outline-none focus:border-emerald-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner" 
                    placeholder="0" 
                    step="0.01" 
                />
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
        <Button variant="primary" className="w-full !py-4 text-sm font-black uppercase tracking-[0.2em] shadow-emerald-500/20 shadow-xl rounded-2xl" onClick={handleSave} disabled={!metrics.isValid} isLoading={isUpdating}>{metrics.isValid ? t('groceries.debts.applySplit') : t('groceries.debts.invalidSplit')}</Button>
      </div>
    </PopupMenu>
  );
});

// --- SUB-COMPONENT: ITEM ROW ---
const ItemRow = ({ 
  item, 
  receipt, 
  members, 
  activeSplitId, 
  setActiveSplitId, 
  householdId, 
  refetch
}: { 
  item: UIItem, 
  receipt: any, 
  members: HouseholdMember[], 
  activeSplitId: any, 
  setActiveSplitId: (val: any) => void,
  householdId: string,
  refetch: () => void
}) => {
  const { t } = useTranslation();
  const rowAnchorRef = useRef<HTMLDivElement>(null);
  const currentUserId = storageService.getUserId();
  const { mutate: updateItem } = useUpdateReceiptItem();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const isPayee = receipt.payee === currentUserId;
  const isLocked = item.owners.some(o => o.settled !== 'unsettled');

  const startEditing = (field: string, value: any) => {
    if (!isPayee || isLocked) return;
    setEditingField(field);
    setEditValue(value.toString());
  };

  const handleSave = () => {
    if (!editingField) return;
    
    const payload: any = {};
    const numValue = parseFloat(editValue);

    if (editingField === 'name') payload.name = editValue;
    if (editingField === 'qty') payload.quantity = isNaN(numValue) ? 0 : numValue;
    if (editingField === 'size') payload.size = isNaN(numValue) ? null : numValue;
    if (editingField === 'price') payload.price_paid = isNaN(numValue) ? 0 : numValue;

    const currentField = editingField;
    setEditingField(null);

    updateItem({ receiptId: receipt.id, itemId: item.id, payload }, {
      onSuccess: () => {
        refetch();
      },
      onError: (err) => {
        console.error("Update failed:", err);
        alert("Failed to update item.");
        setEditingField(currentField);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditingField(null);
    }
  };

  return (
    <tr key={item.id} className="group hover:bg-neutral-800/20 transition-colors">
      <td className="py-4 font-medium text-neutral-300 group/name relative">
        {editingField === 'name' ? (
          <input 
            autoFocus
            className="bg-neutral-900 border-2 border-emerald-500/50 rounded-xl px-2 py-1 text-sm w-full outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span>{item.name}</span>
            {isPayee && !isLocked && (
              <Pencil 
                size={12} 
                className="opacity-0 group-hover/name:opacity-50 cursor-pointer hover:!opacity-100 transition-opacity" 
                onClick={() => startEditing('name', item.name)}
              />
            )}
          </div>
        )}
      </td>
      <td className="py-4 text-neutral-500">
        <div className="flex items-center gap-2">
          <div className="group/qty relative flex items-center gap-1">
            {editingField === 'qty' ? (
              <input 
                autoFocus
                type="number"
                step="0.01"
                className="bg-neutral-900 border-2 border-emerald-500/50 rounded-xl px-2 py-1 text-sm w-16 outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
              />
            ) : (
              <>
                <span>{item.qty}</span>
                {isPayee && !isLocked && (
                  <Pencil 
                    size={10} 
                    className="opacity-0 group-hover/qty:opacity-50 cursor-pointer hover:!opacity-100 transition-opacity" 
                    onClick={() => startEditing('qty', item.qty)}
                  />
                )}
              </>
            )}
          </div>
          <div className="group/size relative flex items-center gap-1">
            {editingField === 'size' ? (
              <input 
                autoFocus
                type="number"
                step="0.01"
                className="bg-neutral-900 border-2 border-emerald-500/50 rounded-xl px-2 py-1 text-sm w-16 outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
              />
            ) : (
              <>
                <span className="text-[10px] opacity-60 ml-0.5">{item.size !== '-' ? item.size : ''}</span>
                {isPayee && !isLocked && (
                  <Pencil 
                    size={10} 
                    className="opacity-0 group-hover/size:opacity-50 cursor-pointer hover:!opacity-100 transition-opacity" 
                    onClick={() => startEditing('size', item.rawSize || 0)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 relative">
        <div className="group/lock relative">
          <div 
            ref={rowAnchorRef}
            onClick={() => {
              if (receipt.payee == currentUserId && !isLocked) {
                setActiveSplitId({ receiptId: receipt.id, itemId: item.id });
              }
            }} 
            className={`flex items-center justify-center -space-x-3 group/stack ${receipt.payee == currentUserId && !isLocked ? 'cursor-pointer' : 'cursor-default'} ${isLocked ? 'grayscale opacity-40' : ''}`}
          >
            {members.filter((m: HouseholdMember) => item.owners.some((o: any) => o.userId === m.id)).slice(0, 3).map((member: HouseholdMember, idx: number) => (
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

          {isLocked && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover/lock:opacity-100 transition-opacity z-50">
              <p className="text-[10px] text-neutral-400 leading-relaxed font-medium text-center">
                {t('groceries.warnings.itemLocked')}
              </p>
            </div>
          )}
        </div>

        {activeSplitId?.itemId === item.id && activeSplitId?.receiptId === receipt.id && (
          <SplitMenu 
            receiptId={receipt.id}
            item={item}
            householdId={householdId}
            onClose={() => setActiveSplitId(null)}
            onSuccess={() => refetch()}
            anchorRef={rowAnchorRef}
          />
        )}
      </td>
      <td className="py-4 text-right font-bold text-neutral-200 group/price relative">
        {editingField === 'price' ? (
          <input 
            autoFocus
            type="number"
            step="0.01"
            className="bg-neutral-900 border-2 border-emerald-500/50 rounded-xl px-2 py-1 text-sm w-24 text-right outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
          />
        ) : (
          <div className="flex items-center justify-end gap-2">
            <span>{(item.qty * item.price).toLocaleString()}</span>
            {isPayee && !isLocked && (
              <Pencil 
                size={12} 
                className="opacity-0 group-hover/price:opacity-50 cursor-pointer hover:!opacity-100 transition-opacity" 
                onClick={() => startEditing('price', item.price)}
              />
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

// --- MAIN COMPONENT ---
export default function ReceiptSplitter({ householdId }: ReceiptSplitterProps) {
  const logic = useReceiptSplitterLogic(householdId);
  const {
    serverReceipts,
    members,
    currentHousehold,
    isLoading,
    isUploading,
    isDeleting,
    expandedIds,
    closingReceiptIds,
    toggleAccordion,
    activeSplitId,
    setActiveSplitId,
    isModalOpen,
    selectedFile,
    fileInputRef,
    openUploadModal,
    closeUploadModal,
    handleUpload,
    handleFileChange,
    handleDeleteReceipt,
    handleMarkAsPending,
    handleConfirmSettlement,
    refetch,
    t
  } = logic;

  const currentUserId = storageService.getUserId();

  if (isLoading && serverReceipts.length === 0) {
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
        <Button variant="primary" className="w-16 h-16 rounded-full shadow-2xl !p-0 flex items-center justify-center" onClick={openUploadModal} icon={<Plus size={24} />}>
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
          serverReceipts.map((receipt: any) => (
            <Card key={receipt.id} className="overflow-hidden" padding="p-0">
              <div onClick={() => toggleAccordion(receipt.id)} className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/40 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><FileImage size={24} /></div>
                  <div>
                    <h3 className="font-bold text-neutral-100">{receipt.storeName}</h3>
                    <p className="text-sm text-neutral-500">{receipt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  {receipt.payee === currentUserId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReceipt(receipt.id);
                      }}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                      title={t('common.confirmDelete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <p className="text-xl font-black text-emerald-400">{receipt.totalAmount.toLocaleString()}</p>
                  <ChevronDown className={`text-neutral-600 transition-transform duration-300 ${expandedIds.has(receipt.id) && !closingReceiptIds.has(receipt.id) ? 'rotate-180' : ''}`} size={24} />
                </div>
              </div>

              {(expandedIds.has(receipt.id) || closingReceiptIds.has(receipt.id)) && (
                <div className={`border-t border-neutral-800/60 p-6 bg-neutral-950/30 overflow-hidden ${closingReceiptIds.has(receipt.id) ? 'animate-slide-up' : 'animate-slide-down'}`}>
                  <div className="overflow-x-auto overflow-visible">
                    
                    <DebtBreakdown 
                      receiptId={receipt.id} 
                      payeeId={receipt.payee} 
                      members={members} 
                      onMarkPending={handleMarkAsPending}
                      onConfirmSettlement={handleConfirmSettlement}
                    />

                    {(() => {
                      const sumOfItems = receipt.items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0);
                      const diff = receipt.totalAmount - sumOfItems;
                      if (Math.abs(diff) > 0.01) {
                        const type = diff > 0 ? t('groceries.warnings.missing') : t('groceries.warnings.surplus');
                        return (
                          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-medium text-amber-200/80 leading-relaxed">
                              {t('groceries.warnings.parsingMismatch', { 
                                type, 
                                amount: Math.abs(diff).toLocaleString(), 
                                currency: currentHousehold?.base_currency || 'HUF' 
                              })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

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
                        {receipt.items.map((item: UIItem) => (
                          <ItemRow 
                            key={item.id}
                            item={item}
                            receipt={receipt}
                            members={members}
                            activeSplitId={activeSplitId}
                            setActiveSplitId={setActiveSplitId}
                            householdId={householdId!}
                            refetch={refetch}
                          />
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
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={closeUploadModal} />
          <Card className="w-full max-w-md relative animate-in zoom-in-95 duration-200" padding="p-8">
            <button onClick={closeUploadModal} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-200 transition-colors"><X size={20} /></button>
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
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
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
                <Button variant="neutral" className="flex-1" onClick={closeUploadModal} disabled={isUploading}>{t('common.cancel')}</Button>
                <Button variant="primary" className="flex-1" onClick={handleUpload} disabled={!selectedFile || isUploading} isLoading={isUploading}>{isUploading ? t('groceries.modal.analyzing') : t('common.upload')}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}

