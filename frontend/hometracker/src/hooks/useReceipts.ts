import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptService } from '../services/receiptService';
import { queryKeys } from './queryKeys';

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
