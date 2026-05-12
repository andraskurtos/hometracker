import { useTranslation } from 'react-i18next';
import { useGrossDebts, useHouseholdMembers } from '../hooks/useHouseholds';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Spinner } from './ui/Spinner';
import { StatCard } from './ui/StatCard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ExternalLink } from 'lucide-react';

interface GlobalDebtSummaryProps {
  householdId: string;
  currency?: string;
}

export const GlobalDebtSummary = ({ householdId, currency = 'HUF' }: GlobalDebtSummaryProps) => {
  const { t } = useTranslation();
  const userId = localStorage.getItem('userId');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const { data: debts, isLoading: isLoadingDebts } = useGrossDebts(householdId, userId);
  const { data: members = [], isLoading: isLoadingMembers } = useHouseholdMembers(householdId);

  if (isLoadingDebts || isLoadingMembers) return (
    <div className="flex items-center gap-3 text-neutral-500 py-6 justify-center">
      <Spinner size="sm" />
      <span className="text-[10px] uppercase tracking-[0.2em] font-black">{t('groceries.debts.calculatingGlobal')}</span>
    </div>
  );

  if (!debts || debts.length === 0) return null;

  const getMember = (id: string) => members.find(m => m.id === id);

  const getRevolutLink = (username: string, amount: number) => {
    // amount*100 because Revolut expects cents
    const amountCents = Math.round(amount * 100);
    return `https://revolut.me/${username}?currency=${currency}&amount=${amountCents}&note=hometracker_settle`;
  };

  const handleSettle = (username: string, amount: number) => {
    window.open(getRevolutLink(username, amount), '_blank');
  };

  return (
    <div className="flex flex-col gap-4 mb-8 animate-slide-down w-full max-w-4xl mx-auto">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">{t('groceries.debts.youOwe')}</h4>
      
      <div className="flex flex-col gap-3">
        {debts.map((d, idx) => {
          const member = getMember(d.payee);
          if (!member) return null;

          const hasRevolut = !!member.revolut_username;

          return (
            <StatCard
              key={idx}
              variant="red"
              label={t('groceries.debts.payee')}
              value={d.amount.toLocaleString()}
              description={member.display_name || member.first_name}
              className="border-red-500/10 group"
              onClick={hasRevolut ? () => handleSettle(member.revolut_username!, d.amount) : undefined}
              icon={
                <div className="flex items-center gap-3">
                  {hasRevolut && (
                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                      <ExternalLink size={14} />
                    </div>
                  )}
                  <Avatar 
                    src={member.profile_pic_url}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    size="md"
                    borderColor="border-red-500/20"
                  />
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
};
