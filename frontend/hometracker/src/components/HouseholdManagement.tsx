import { Home, Copy, Check, ArrowLeft, Users, Shield, RefreshCw, Pencil, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { householdService, type Household, type HouseholdMember } from '../services/householdService';
import { getAssetUrl } from '../utils/assetUtils';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface HouseholdManagementProps {
  household: Household;
  onBack: () => void;
  onUpdate: () => void;
}

// Sub-component for editable fields
const EditableHeader = ({ 
  field, 
  value, 
  isEditing, 
  isSaving, 
  editValue, 
  isAdmin, 
  onEdit, 
  onChange, 
  onSave, 
  onCancel, 
  t 
}: any) => {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(field);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="group relative">
      {isEditing ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          {field === 'base_currency' ? (
            <select
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => onSave(field)}
              onKeyDown={onKeyDown}
              disabled={isSaving}
              className="bg-neutral-950/50 border border-emerald-500/50 rounded-lg px-2 py-1 text-neutral-200 outline-none disabled:opacity-50"
              autoFocus
            >
              <option value="HUF">HUF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => onSave(field)}
              onKeyDown={onKeyDown}
              disabled={isSaving}
              className="bg-neutral-950/50 border border-emerald-500/50 rounded-lg px-3 py-1 text-neutral-200 outline-none w-full disabled:opacity-50"
              autoFocus
            />
          )}
          <div className="p-1.5 text-emerald-500 min-w-8 flex justify-center">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {field === 'name' ? (
            <h1 className="text-3xl font-black text-neutral-100">{value}</h1>
          ) : field === 'description' ? (
            <p className="text-neutral-500">{value || t('household.management.noDescription')}</p>
          ) : (
            <Badge variant="neutral">
              {value}
            </Badge>
          )}
          {isAdmin && (
            <button 
              onClick={() => onEdit(field)}
              className="p-1.5 rounded-lg text-neutral-600 hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function HouseholdManagement({ household, onBack, onUpdate }: HouseholdManagementProps) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  
  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({
    name: household.name,
    description: household.description || '',
    base_currency: household.base_currency
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when household prop changes
  useEffect(() => {
    setEditValues({
      name: household.name,
      description: household.description || '',
      base_currency: household.base_currency
    });
  }, [household]);

  const isAdmin = household.role === 'admin';

  const loadMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const data = await householdService.getHouseholdMembers(household.id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [household.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(household.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm(t('household.management.confirmRegenerate'))) return;
    setIsRegeneratingCode(true);
    try {
      await householdService.regenerateJoinCode(household.id);
      onUpdate();
    } catch (err) {
      alert(t('household.management.errors.regenerateFailed'));
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const handleUpdateField = async (field: string) => {
    if (isSaving || editingField !== field) return;

    const newValue = editValues[field];
    const oldValue = (household as any)[field] || '';

    if (newValue === oldValue) {
      setEditingField(null);
      return;
    }

    setIsSaving(true);
    try {
      await householdService.updateHousehold(household.id, { [field]: newValue });
      setEditingField(null);
      // Safety check: ensure onUpdate is a function
      if (typeof onUpdate === 'function') {
        await onUpdate();
      }
    } catch (err) {
      console.error("Household update failed:", err);
      alert(t('household.management.errors.updateFailed'));
      // Reset values to original on error
      setEditValues({
        name: household.name,
        description: household.description || '',
        base_currency: household.base_currency
      });
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKick = async (userId: string) => {
    if (!window.confirm(t('household.management.confirmKick'))) return;
    try {
      await householdService.kickMember(household.id, userId);
      loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePromote = async (userId: string) => {
    if (!window.confirm(t('household.management.confirmPromote'))) return;
    try {
      await householdService.promoteMember(household.id, userId);
      loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors group w-fit"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>{t('common.backToLaunchpad')}</span>
      </button>

      {/* Household Hero */}
      <Card className="p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-neutral-800 opacity-10">
          <Home size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start gap-5">
            <div className="p-4 rounded-[1.5rem] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Home size={40} />
            </div>
            <div className="flex-1 space-y-3">
              <EditableHeader 
                field="name" 
                value={household.name} 
                isEditing={editingField === 'name'}
                isSaving={isSaving}
                editValue={editValues.name}
                isAdmin={isAdmin}
                onEdit={setEditingField}
                onChange={(val: string) => setEditValues((p: any) => ({...p, name: val}))}
                onSave={handleUpdateField}
                onCancel={() => setEditingField(null)}
                t={t}
              />
              <EditableHeader 
                field="description" 
                value={household.description} 
                isEditing={editingField === 'description'}
                isSaving={isSaving}
                editValue={editValues.description}
                isAdmin={isAdmin}
                onEdit={setEditingField}
                onChange={(val: string) => setEditValues((p: any) => ({...p, description: val}))}
                onSave={handleUpdateField}
                onCancel={() => setEditingField(null)}
                t={t}
              />
              
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge variant="emerald" icon={<Shield size={12} />}>
                  {household.role.toUpperCase()}
                </Badge>
                <EditableHeader 
                  field="base_currency" 
                  value={household.base_currency} 
                  isEditing={editingField === 'base_currency'}
                  isSaving={isSaving}
                  editValue={editValues.base_currency}
                  isAdmin={isAdmin}
                  onEdit={setEditingField}
                  onChange={(val: string) => setEditValues((p: any) => ({...p, base_currency: val}))}
                  onSave={handleUpdateField}
                  onCancel={() => setEditingField(null)}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Join Code Area */}
      <Card className="p-8 rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest ml-1">{t('household.management.joinCodeTitle')}</h3>
          {isAdmin && (
            <Button 
              variant="neutral"
              onClick={handleRegenerateCode}
              isLoading={isRegeneratingCode}
              className="px-3 py-1.5 text-xs"
              icon={<RefreshCw size={14} className={isRegeneratingCode ? 'animate-spin' : ''} />}
            >
              {t('household.management.regenerateCode')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800 shadow-inner group overflow-hidden">
          <code className="text-3xl md:text-4xl font-mono font-black tracking-wide text-emerald-400 flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
            {household.join_code}
          </code>
          <button 
            onClick={copyToClipboard}
            className={`p-4 rounded-xl transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-neutral-800 text-neutral-400 hover:text-emerald-200 hover:bg-neutral-700'}`}
            title={t('common.copy')}
          >
            {copied ? <Check size={24} /> : <Copy size={24} />}
          </button>
        </div>
        <p className="text-sm text-neutral-500 mt-4 ml-1">
          {t('household.management.joinCodeHelp')}
        </p>
      </Card>

      {/* Members Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-neutral-400" />
            <h3 className="text-xl font-bold text-neutral-200">{t('household.management.members')}</h3>
          </div>
          <Badge variant="neutral" className="px-3 py-1 font-bold">
            {members.length} {t('household.management.totalMembers')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoadingMembers ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-600">
              <Loader2 className="animate-spin mb-2" />
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            members.map((member) => (
              <Card 
                key={member.id}
                hoverable
                padding="none"
                className="group p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                      {member.profile_pic_url ? (
                        <img src={getAssetUrl(member.profile_pic_url) || ''} alt={member.display_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-neutral-600">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      )}
                    </div>
                    {member.role === 'admin' && (
                      <div 
                        className="absolute -top-1.5 -right-1.5 p-1 bg-emerald-500 rounded-full text-neutral-950 border-2 border-neutral-950 shadow-lg z-10" 
                        title="Admin"
                      >
                        <Shield size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-100 flex items-center gap-2 text-lg">
                      {member.display_name || `${member.first_name} ${member.last_name}`}
                      {member.id === localStorage.getItem('userId') && (
                        <Badge variant="emerald" className="text-[10px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded">
                          {t('common.you')}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      {t('household.management.joinedAt')}: {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isAdmin && member.id !== localStorage.getItem('userId') && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {member.role !== 'admin' && (
                      <button 
                        onClick={() => handlePromote(member.id)}
                        className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                        title={t('household.management.promote')}
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleKick(member.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      title={t('household.management.kick')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
