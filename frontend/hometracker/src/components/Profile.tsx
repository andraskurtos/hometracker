import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, CreditCard, ArrowLeft, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAssetUrl } from '../utils/assetUtils';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { GlassSection } from './ui/GlassSection';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../hooks/useProfile';

interface ProfileProps {
  onBack: () => void;
  userName: string;
}

export default function Profile({ onBack }: ProfileProps) {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Queries & Mutations
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    gender: '',
    dob: '',
    revolutUser: '',
    discordId: '',
    profilePicUrl: ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- 1. SYNC PROFILE DATA ---
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || '',
        gender: profile.gender || '',
        dob: profile.date_of_birth || '',
        revolutUser: profile.revolut_username || '',
        discordId: profile.discord_id || '',
        profilePicUrl: profile.profile_pic_url || ''
      });
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadAvatarMutation.mutateAsync(file);
      } catch (err) {
        alert(t('profile.errors.uploadFailed'));
      }
    }
  };

  const fullAvatarUrl = getAssetUrl(formData.profilePicUrl);

  // --- 2. SAVE CHANGES ---
  const handleSave = async () => {
    setSaveSuccess(false);

    // Map frontend state back to backend column names
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      display_name: formData.displayName,
      gender: formData.gender,
      date_of_birth: formData.dob || null, // Important: pass null if empty string
      revolut_username: formData.revolutUser,
      discord_id: formData.discordId
    };

    try {
      await updateProfileMutation.mutateAsync(payload);
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(t('profile.errors.saveFailed'));
    }
  };

  const isFieldEmpty = (value: string) => !value || value.trim() === '';
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <Button variant="ghost" isLoading className="text-emerald-500">
          {t('profile.fetchingDetails')}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        
        {saveSuccess && (
          <Badge variant="emerald" icon={<CheckCircle2 size={16} />} className="animate-in zoom-in duration-300">
            {t('profile.changesSaved')}
          </Badge>
        )}
      </div>

      {/* Profile Pic Area */}
      <Card className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {fullAvatarUrl? (
              <img
                src={fullAvatarUrl}
                alt={t('profile.profileAlt')}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={64} className="text-neutral-600" />
            )}
          </div>
          <button 
            className="absolute bottom-0 right-0 p-2.5 bg-emerald-500 text-neutral-950 rounded-full hover:scale-110 transition-transform shadow-lg disabled:opacity-50" 
            onClick={handleAvatarClick}
            disabled={uploadAvatarMutation.isPending}
          >
            {uploadAvatarMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-neutral-100 mb-1">{formData.displayName || t('profile.setDisplayName')}</h2>
          <p className="text-neutral-500">{t('profile.memberSince', { year: new Date().getFullYear() })}</p>
        </div>
      </Card>

      {/* Form Sections */}
      <GlassSection title={t('profile.sections.name')} icon={<User size={18} />}>
        <Input 
          label={t('profile.fields.firstName')} 
          value={formData.firstName} 
          onChange={(e) => handleInputChange('firstName', e.target.value)} 
          error={isFieldEmpty(formData.firstName)} 
          placeholder={t('profile.placeholders.firstName')} 
        />
        <Input 
          label={t('profile.fields.lastName')} 
          value={formData.lastName} 
          onChange={(e) => handleInputChange('lastName', e.target.value)} 
          error={isFieldEmpty(formData.lastName)} 
          placeholder={t('profile.placeholders.lastName')} 
        />
        <Input 
          label={t('profile.fields.displayName')} 
          value={formData.displayName} 
          onChange={(e) => handleInputChange('displayName', e.target.value)} 
          error={isFieldEmpty(formData.displayName)} 
          placeholder={t('profile.placeholders.displayName')} 
        />
      </GlassSection>

      <GlassSection title={t('profile.sections.personalData')} icon={<ShieldCheck size={18} />}>
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider ml-1">{t('profile.fields.gender')}</label>
          <select 
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl bg-neutral-900/60 border ${isFieldEmpty(formData.gender) ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-800/60 focus:border-emerald-500/50'} text-neutral-200 outline-none transition-all duration-200 appearance-none`}
          >
            <option value="" disabled>{t('profile.genderOptions.select')}</option>
            <option value="male">{t('profile.genderOptions.male')}</option>
            <option value="female">{t('profile.genderOptions.female')}</option>
            <option value="other">{t('profile.genderOptions.other')}</option>
          </select>
        </div>
        <Input 
          label={t('profile.fields.dob')} 
          value={formData.dob} 
          onChange={(e) => handleInputChange('dob', e.target.value)} 
          error={isFieldEmpty(formData.dob)} 
          type="date" 
        />
      </GlassSection>

      <GlassSection title={t('profile.sections.integrations')} icon={<CreditCard size={18} />}>
        <Input 
          label={t('profile.fields.revolut')} 
          value={formData.revolutUser} 
          onChange={(e) => handleInputChange('revolutUser', e.target.value)} 
          error={isFieldEmpty(formData.revolutUser)} 
          placeholder={t('profile.placeholders.revolut')} 
        />
        <Input 
          label={t('profile.fields.discord')} 
          value={formData.discordId} 
          onChange={(e) => handleInputChange('discordId', e.target.value)} 
          error={isFieldEmpty(formData.discordId)} 
          placeholder={t('profile.placeholders.discord')} 
        />
      </GlassSection>

      {/* Save Button */}
      <div className="flex justify-end mb-12">
        <Button 
          onClick={handleSave}
          isLoading={updateProfileMutation.isPending}
          className="px-10"
        >
          {t('common.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
