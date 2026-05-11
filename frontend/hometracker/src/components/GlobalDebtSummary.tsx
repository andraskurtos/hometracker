import { Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGrossDebts, useHouseholdMembers } from '../hooks/useHouseholds';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { getAssetUrl } from '../utils/assetUtils';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
    <div className="flex items-center gap-2 text-neutral-500 py-4 animate-pulse justify-center">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-xs uppercase tracking-widest font-bold">{t('groceries.debts.calculatingGlobal')}</span>
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
    <div className="flex flex-col gap-3 mb-8 animate-slide-down w-full max-w-4xl mx-auto px-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">{t('groceries.debts.youOwe')}</h4>
      
      <div className="flex flex-col gap-3">
        {debts.map((d, idx) => {
          const member = getMember(d.payee);
          if (!member) return null;

          const hasRevolut = !!member.revolut_username;

          return (
            <Card 
                key={idx} 
                padding="p-4" 
                hoverable={!isDesktop && hasRevolut}
                onClick={(!isDesktop && hasRevolut) ? () => handleSettle(member.revolut_username!, d.amount) : undefined}
                className={`flex items-center justify-between bg-neutral-950/40 border-red-500/10 hover:border-red-500/20 transition-colors ${(!isDesktop && hasRevolut) ? 'cursor-pointer active:scale-[0.98]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-800">
                  {member.profile_pic_url ? (
                    <img src={getAssetUrl(member.profile_pic_url)!} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs font-black text-neutral-400">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-neutral-100">{member.display_name || member.first_name}</span>
                    <Badge variant="neutral" className="text-[8px] uppercase font-black px-1.5 py-0.5 opacity-50">{t('groceries.debts.payee')}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-red-500">
                    {d.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-tighter">{t('groceries.debts.grossDebt')}</span>
                </div>

                {isDesktop && hasRevolut && (
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSettle(member.revolut_username!, d.amount);
                        }}
                    >
                        {t('common.settle')}
                    </Button>
                )}
                {!isDesktop && hasRevolut && (
                    <ExternalLink size={14} className="text-neutral-600" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
