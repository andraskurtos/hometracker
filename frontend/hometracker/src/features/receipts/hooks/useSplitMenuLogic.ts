import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type UIItem } from '@/services/receiptService';
import { calculateShares, distributeEvenly, convertSharesMode } from '@/services/debtService';
import { useUpdateItemOwners } from './useReceipts';
import { useHouseholdMembers } from '@/features/households/hooks/useHouseholds';

export type SplitMode = 'percent' | 'pcs';

interface UseSplitMenuLogicProps {
  receiptId: number;
  item: UIItem;
  householdId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const useSplitMenuLogic = ({
  receiptId,
  item,
  householdId,
  onClose,
  onSuccess
}: UseSplitMenuLogicProps) => {
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
    const totalItemPrice = item.qty * item.price;
    
    item.owners.forEach(o => {
      // weight is (o.amount / totalItemPrice) * 100
      const weight = totalItemPrice > 0 ? (o.amount / totalItemPrice) * 100 : 0;
      const value = splitMode === 'percent' ? weight : (weight / 100) * item.qty;
      initial[o.userId] = Math.round(value * 100) / 100;
    });
    setTempShares(initial);
  }, [item.id, splitMode, item.qty, item.price]);

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
    const isAlreadyIn = tempShares[userId] > 0;
    
    let nextUsers: string[];
    if (isAlreadyIn) {
      nextUsers = Object.keys(tempShares).filter(uid => tempShares[uid] > 0 && uid !== userId);
    } else {
      nextUsers = [...Object.keys(tempShares).filter(uid => tempShares[uid] > 0), userId];
    }

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
      alert(error instanceof Error ? error.message : "Failed to update owners");
    }
  };

  const updateShareManually = (userId: string, value: number) => {
    setTempShares(prev => ({ ...prev, [userId]: Math.round(value * 100) / 100 }));
  };

  return {
    t,
    dropdownRef,
    isClosing,
    splitMode,
    tempShares,
    members,
    metrics,
    isUpdating: updateOwnersMutation.isPending,
    handleClose,
    handleModeSwitch,
    toggleUserInSplit,
    handleSave,
    updateShareManually
  };
};

export type SplitMenuLogic = ReturnType<typeof useSplitMenuLogic>;
