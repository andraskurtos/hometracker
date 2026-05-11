export const queryKeys = {
  households: {
    all: ['households'] as const,
    list: () => [...queryKeys.households.all, 'list'] as const,
    members: (householdId: string) => [...queryKeys.households.all, 'members', householdId] as const,
    debts: (householdId: string, userId: string) => [...queryKeys.households.all, 'debts', householdId, userId] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  receipts: {
    all: ['receipts'] as const,
    list: () => [...queryKeys.receipts.all, 'list'] as const,
  },
};
