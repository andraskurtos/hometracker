import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, CreditCard, ArrowLeft, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/userService';
import { getAssetUrl } from '../utils/assetUtils';

interface ProfileProps {
  onBack: () => void;
  userName: string;
}

const InputField = ({ label, name, value, onChange, isFieldEmpty, type = "text", placeholder = "" }: { 
  label: string, 
  name: string, 
  value: string, 
  onChange: (name: string, value: string) => void,
  isFieldEmpty: (val: string) => boolean,
  type?: string, 
  placeholder?: string 
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-xl bg-neutral-900/60 border ${isFieldEmpty(value) ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-800/60 focus:border-emerald-500/50'} text-neutral-200 placeholder:text-neutral-600 outline-none transition-all duration-200`}
    />
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="w-full bg-neutral-900/30 border border-neutral-800/40 rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-6 text-neutral-400">
      <Icon size={18} strokeWidth={2} />
      <h3 className="font-semibold text-sm uppercase tracking-widest">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

export default function Profile({ onBack, userName }: ProfileProps) {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: userName || '',
    gender: '',
    dob: '',
    revolutUser: '',
    discordId: '',
    profilePicUrl: ''
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { avatar_url } = await userService.uploadAvatar(file);
        setFormData(prev => ({...prev, profilePicUrl: avatar_url}));
      } catch (err) {
        alert(t('profile.errors.uploadFailed'));
      }
    }
  };

  const fullAvatarUrl = getAssetUrl(formData.profilePicUrl);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- 1. FETCH PROFILE ON LOAD ---
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const data = await userService.getProfile();
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          displayName: data.display_name || '',
          gender: data.gender || '',
          dob: data.date_of_birth || '',
          revolutUser: data.revolut_username || '',
          discordId: data.discord_id || '',
          profilePicUrl: data.profile_pic_url || ''
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // --- 2. SAVE CHANGES ---
  const handleSave = async () => {
    setIsSaving(true);
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
      await userService.updateProfile(payload);
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(t('profile.errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const isFieldEmpty = (value: string) => !value || value.trim() === '';
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-neutral-500 animate-pulse">{t('profile.fetchingDetails')}</p>
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
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full animate-in zoom-in duration-300">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{t('profile.changesSaved')}</span>
          </div>
        )}
      </div>

      {/* Profile Pic Area */}
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-neutral-900/40 border border-neutral-800/60 rounded-3xl backdrop-blur-md shadow-xl">
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
          <button className="absolute bottom-0 right-0 p-2.5 bg-emerald-500 text-neutral-950 rounded-full hover:scale-110 transition-transform shadow-lg" onClick={handleAvatarClick}>
            <Camera size={18} />
          </button>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-neutral-100 mb-1">{formData.displayName || t('profile.setDisplayName')}</h2>
          <p className="text-neutral-500">{t('profile.memberSince', { year: new Date().getFullYear() })}</p>
        </div>
      </div>

      {/* Form Sections */}
      <Section title={t('profile.sections.name')} icon={User}>
        <InputField label={t('profile.fields.firstName')} name="firstName" value={formData.firstName} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} placeholder={t('profile.placeholders.firstName')} />
        <InputField label={t('profile.fields.lastName')} name="lastName" value={formData.lastName} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} placeholder={t('profile.placeholders.lastName')} />
        <InputField label={t('profile.fields.displayName')} name="displayName" value={formData.displayName} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} placeholder={t('profile.placeholders.displayName')} />
      </Section>

      <Section title={t('profile.sections.personalData')} icon={ShieldCheck}>
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
        <InputField label={t('profile.fields.dob')} name="dob" value={formData.dob} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} type="date" />
      </Section>

      <Section title={t('profile.sections.integrations')} icon={CreditCard}>
        <InputField label={t('profile.fields.revolut')} name="revolutUser" value={formData.revolutUser} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} placeholder={t('profile.placeholders.revolut')} />
        <InputField label={t('profile.fields.discord')} name="discordId" value={formData.discordId} onChange={handleInputChange} isFieldEmpty={isFieldEmpty} placeholder={t('profile.placeholders.discord')} />
      </Section>

      {/* Save Button */}
      <div className="flex justify-end mb-12">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="group relative px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('common.saveChanges')
          )}
        </button>
      </div>
    </div>
  );
}