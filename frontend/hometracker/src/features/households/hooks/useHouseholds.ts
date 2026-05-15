import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { householdService, type HouseholdUpdate } from '../../../services/householdService';
import { queryKeys } from '../../shared/hooks/queryKeys';

export const useMyHouseholds = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.households.list(),
    queryFn: householdService.getMyHouseholds,
    enabled,
  });
};

export const useHouseholdMembers = (householdId: string | null) => {
  return useQuery({
    queryKey: queryKeys.households.members(householdId!),
    queryFn: () => householdService.getHouseholdMembers(householdId!),
    enabled: !!householdId,
  });
};

export const useFinancialSummary = (householdId: string | null) => {
  return useQuery({
    queryKey: [...queryKeys.households.list(), householdId, 'summary'],
    queryFn: () => householdService.fetchFinancialSummary(householdId!),
    enabled: !!householdId,
  });
};

export const useSettleBulkDebts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, debtorId }: { householdId: string; debtorId: string }) => 
      householdService.settleBulkDebts(householdId, debtorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.list() });
    },
  });
};

export const useMarkDebtAsPending = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, payeeId }: { householdId: string; payeeId: string }) => 
      householdService.markDebtAsPending(householdId, payeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useRejectBulkSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, debtorId }: { householdId: string; debtorId: string }) => 
      householdService.rejectBulkSettlement(householdId, debtorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useGrossDebts = (householdId: string | null, userId: string | null) => {
  return useQuery({
    queryKey: queryKeys.households.debts(householdId!, userId!),
    queryFn: () => householdService.fetchGrossDebts(householdId!, userId!),
    enabled: !!householdId && !!userId,
  });
};

export const useUpdateHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HouseholdUpdate }) => 
      householdService.updateHousehold(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useRegenerateJoinCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => householdService.regenerateJoinCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useJoinHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (joinCode: string) => householdService.joinHousehold(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const usePromoteMember = (householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => householdService.promoteMember(householdId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.members(householdId) });
    },
  });
};

export const useKickMember = (householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => householdService.kickMember(householdId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.members(householdId) });
    },
  });
};

export const useCreateHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description, baseCurrency }: { name: string; description?: string; baseCurrency?: string }) => 
      householdService.createHousehold(name, description, baseCurrency),
    onSuccess: (newHousehold) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
      return newHousehold;
    },
  });
};

export const useDeactivateHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => householdService.deactivateHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};
