import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReceipts, uploadReceipt } from '../services/receiptService';
import { queryKeys } from './queryKeys';

export const useReceipts = () => {
  return useQuery({
    queryKey: queryKeys.receipts.list(),
    queryFn: fetchReceipts,
  });
};

export const useUploadReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadReceipt(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.list() });
    },
  });
};
