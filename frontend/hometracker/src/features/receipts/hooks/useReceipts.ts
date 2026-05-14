import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptService, type UIOwner } from '@/services/receiptService';
import { queryKeys } from '@/features/shared/hooks/queryKeys';

export const useReceipts = (householdId: string | null) => {
  return useQuery({
    queryKey: [...queryKeys.receipts.list(), householdId],
    queryFn: () => receiptService.fetchReceipts(householdId!),
    enabled: !!householdId,
  });
};

export const useUploadReceipt = (householdId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => receiptService.uploadReceipt(householdId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.list() });
    },
  });
};

export const useUpdateItemOwners = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiptId, itemId, owners }: { receiptId: number; itemId: number; owners: UIOwner[] }) => 
      receiptService.updateItemOwners(receiptId, itemId, owners),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.list() });
      queryClient.invalidateQueries({ queryKey: ['receipts', 'debts', variables.receiptId] });
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiptId: number) => receiptService.deleteReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.list() });
    },
  });
};

export const useReceiptDebts = (receiptId: number | null) => {
  return useQuery({
    queryKey: ['receipts', 'debts', receiptId],
    queryFn: () => receiptService.fetchReceiptDebts(receiptId!),
    enabled: !!receiptId,
  });
};
