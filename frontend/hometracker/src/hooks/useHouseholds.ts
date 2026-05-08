import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { householdService, type HouseholdUpdate } from '../services/householdService';
import { queryKeys } from './queryKeys';

export const useMyHouseholds = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.households.list(),
    queryFn: householdService.getMyHouseholds,
    enabled,
  });
};

export const useHouseholdMembers = (householdId: number | null) => {
  return useQuery({
    queryKey: queryKeys.households.members(householdId!),
    queryFn: () => householdService.getHouseholdMembers(householdId!),
    enabled: !!householdId,
  });
};

export const useUpdateHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HouseholdUpdate }) => 
      householdService.updateHousehold(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useRegenerateJoinCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => householdService.regenerateJoinCode(id),
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

export const usePromoteMember = (householdId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => householdService.promoteMember(householdId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.members(householdId) });
    },
  });
};

export const useKickMember = (householdId: number) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};

export const useDeactivateHousehold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => householdService.deactivateHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households.list() });
    },
  });
};
