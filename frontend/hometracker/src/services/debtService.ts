// src/services/debtService.ts
import { type UIOwner } from './receiptService';
import { householdService, type GrossDebt } from './householdService';

export const debtService = {
  getGrossDebts: householdService.fetchGrossDebts,
};

/**
 * Largest Remainder Method (Hare-Niemeyer) for penny-perfect distribution.
 * Works with cents internally to avoid float precision issues.
 */
export const calculateShares = (
  totalItemPrice: number,
  usersInSplit: { userId: string, weight: number }[]
): UIOwner[] => {
  if (usersInSplit.length === 0) return [];

  const totalItemPriceCents = Math.round(totalItemPrice * 100);
  const totalWeight = usersInSplit.reduce((a, b) => a + b.weight, 0);

  if (totalWeight === 0) return [];

  // 1. Calculate base shares in cents and fractional parts
  let distributedSumCents = 0;
  const ownersData = usersInSplit.map((user) => {
    const exactAmountCents = (user.weight / totalWeight) * totalItemPriceCents;
    const baseAmountCents = Math.floor(exactAmountCents);
    distributedSumCents += baseAmountCents;
    return {
      userId: user.userId,
      amountCents: baseAmountCents,
      fractionalPart: exactAmountCents - baseAmountCents
    };
  });

  // 2. Distribute remainder (pennies) to those with the largest fractional parts
  let remainderCents = totalItemPriceCents - distributedSumCents;

  // Sort by fractional part descending
  const sortedByFraction = [...ownersData].sort((a, b) => b.fractionalPart - a.fractionalPart);

  for (let i = 0; i < remainderCents; i++) {
    sortedByFraction[i].amountCents += 1;
  }

  return ownersData.map(o => ({
    userId: o.userId,
    amount: o.amountCents / 100
  }));
};

/**
 * Distributes a target value (100% or total qty) evenly among users.
 * Handles remainders at the UI level for display consistency.
 */
export const distributeEvenly = (
  target: number,
  userIds: string[]
): Record<string, number> => {
  if (userIds.length === 0) return {};

  const baseShare = Math.floor((target / userIds.length) * 100) / 100;
  const remainder = Math.round((target - (baseShare * userIds.length)) * 100) / 100;

  const newShares: Record<string, number> = {};
  userIds.forEach((uid, idx) => {
    newShares[uid] = idx === 0 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare;
  });
  
  return newShares;
};

/**
 * Converts shares between SplitModes (percent <-> pcs)
 */
export const convertSharesMode = (
  currentShares: Record<string, number>,
  qty: number,
  toMode: 'percent' | 'pcs'
): Record<string, number> => {
  const nextShares: Record<string, number> = {};
  Object.keys(currentShares).forEach(uid => {
    if (toMode === 'pcs') {
      nextShares[uid] = Math.round(((currentShares[uid] || 0) / 100) * qty * 100) / 100;
    } else {
      nextShares[uid] = Math.round(((currentShares[uid] || 0) / qty) * 100 * 100) / 100;
    }
  });
  return nextShares;
};
