import { useTranslation } from 'react-i18next';
import { useFinancialSummary, useHouseholdMembers, useSettleBulkDebts, useMarkDebtAsPending, useRejectBulkSettlement } from '../hooks/useHouseholds';
import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { ExternalLink, Check, X } from 'lucide-react';
import { storageService } from '../../../services/storageService';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface GlobalDebtSummaryProps {
  householdId: string;
  currency?: string;
}

export const GlobalDebtSummary = ({ householdId, currency = 'HUF' }: GlobalDebtSummaryProps) => {
  const { t } = useTranslation();
  const userId = storageService.getUserId();
  
  const { data: summary, isLoading: isLoadingSummary } = useFinancialSummary(householdId);
  const { data: members = [], isLoading: isLoadingMembers } = useHouseholdMembers(householdId);
  const { mutate: settleBulk } = useSettleBulkDebts();
  const { mutate: markPending } = useMarkDebtAsPending();
  const { mutate: rejectSettlement } = useRejectBulkSettlement();

  if (isLoadingSummary || isLoadingMembers) return (
    <div className="flex items-center gap-3 text-neutral-500 py-6 justify-center">
      <Spinner size="sm" />
      <span className="text-[10px] uppercase tracking-[0.2em] font-black">{t('groceries.debts.calculatingGlobal')}</span>
    </div>
  );

  const getMember = (id: string) => members.find(m => m.id === id);

  const getRevolutLink = (username: string, amount: number) => {
    const amountCents = Math.round(amount * 100);
    return `https://revolut.me/${username}?currency=${currency}&amount=${amountCents}&note=hometracker_settle`;
  };

  const handleSettle = (payeeId: string, username: string, amount: number) => {
    // 1. Mark as pending
    markPending({ householdId, payeeId });
    // 2. Open link
    window.open(getRevolutLink(username, amount), '_blank');
  };

  const handleConfirmBulk = (debtorId: string) => {
    settleBulk({ householdId, debtorId });
  };

  const handleRejectBulk = (debtorId: string) => {
    rejectSettlement({ householdId, debtorId });
  };

  const hasDebts = summary?.debts && summary.debts.length > 0;
  // ONLY display pending credits
  const pendingCredits = summary?.credits.filter(c => c.status === 'pending') || [];
  const hasCredits = pendingCredits.length > 0;

  if (!hasDebts && !hasCredits) return null;

  return (
    <div className="flex flex-col gap-8 mb-12 w-full max-w-4xl mx-auto">
      {/* SECTION: WHO OWES YOU (ONLY PENDING) */}
      {hasCredits && (
        <div className="flex flex-col gap-4 animate-slide-down">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/70 ml-1">{t('groceries.debts.youAreOwed')}</h4>
          <div className="flex flex-col gap-3">
            {pendingCredits.map((d, idx) => {
              const member = getMember(d.other_user_id);
              if (!member) return null;

              return (
                <Card key={idx} padding="p-6" className="border-amber-500/20 bg-amber-500/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        src={member.profile_pic_url}
                        firstName={member.first_name}
                        lastName={member.last_name}
                        size="lg"
                        borderColor="border-amber-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-neutral-100">{member.display_name || member.first_name}</span>
                          <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">{t('common.pending')}</Badge>
                        </div>
                        <p className="text-xs text-neutral-400 max-w-xs">
                          {t('groceries.debts.confirmSettlementPrompt', { user: member.first_name })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">{t('groceries.debts.grossDebt')}</span>
                        <span className="text-2xl font-black text-emerald-400">{d.amount.toLocaleString()} <span className="text-xs opacity-50 font-medium ml-1">{currency}</span></span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="red" 
                          size="sm" 
                          className="h-10 w-10 !p-0 rounded-xl"
                          onClick={() => handleRejectBulk(d.other_user_id)}
                          title={t('common.reject')}
                        >
                          <X size={20} />
                        </Button>
                        <Button 
                          variant="emerald" 
                          size="sm" 
                          className="h-10 w-10 !p-0 rounded-xl"
                          onClick={() => handleConfirmBulk(d.other_user_id)}
                          title={t('common.confirm')}
                        >
                          <Check size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: YOU OWE */}
      {hasDebts && (
        <div className="flex flex-col gap-4 animate-slide-down">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 ml-1">{t('groceries.debts.youOwe')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.debts.map((d, idx) => {
              const member = getMember(d.other_user_id);
              if (!member) return null;
              const hasRevolut = !!member.revolut_username;

              return (
                <StatCard
                  key={idx}
                  variant="red"
                  label={t('groceries.debts.payee')}
                  value={`${d.amount.toLocaleString()} ${currency}`}
                  description={member.display_name || member.first_name}
                  className="border-red-500/10 group h-full"
                  onClick={hasRevolut ? () => handleSettle(d.other_user_id, member.revolut_username!, d.amount) : undefined}
                  icon={
                    <div className="flex items-center gap-3">
                      {d.status === 'pending' && (
                        <Badge variant="neutral" className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">{t('common.pending')}</Badge>
                      )}
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
      )}
    </div>
  );
};
