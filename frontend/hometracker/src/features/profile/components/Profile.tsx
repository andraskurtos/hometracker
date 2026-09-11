import { User, ShieldCheck, CreditCard, Camera, CheckCircle2, Loader2, Bell, BellOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReturnButton } from '@/components/ui/ReturnButton';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { GlassSection } from '@/components/ui/GlassSection';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { PageLayout } from '@/components/ui/PageLayout';
import { useProfileLogic } from '../hooks/useProfileLogic';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface ProfileProps {
  onBack: () => void;
  userName: string;
}

export default function Profile({ onBack }: ProfileProps) {
  const logic = useProfileLogic(onBack);
  const push = usePushNotifications();
  const {
    t,
    formData,
    isLoading,
    isSaving,
    isUploadingAvatar,
    saveSuccess,
    fileInputRef,
    handleAvatarClick,
    handleFileChange,
    handleSave,
    handleInputChange,
    isFieldEmpty,
  } = logic;

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-neutral-500 text-sm font-medium animate-pulse">
          {t('profile.fetchingDetails')}
        </p>
      </div>
    );
  }

  return (
    <PageLayout maxWidth="3xl">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <ReturnButton 
          onClick={onBack}
          label={t('common.backToDashboard')}
        />
        
        {saveSuccess && (
          <Badge variant="emerald" icon={<CheckCircle2 size={16} />} className="animate-in zoom-in duration-300">
            {t('profile.changesSaved')}
          </Badge>
        )}
      </div>

      {/* Profile Pic Area */}
      <Card className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="relative group">
          <Avatar 
            src={formData.profilePicUrl}
            firstName={formData.firstName}
            lastName={formData.lastName}
            size="xl"
            borderColor="border-neutral-700"
            className="shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          />
          <button 
            className="absolute bottom-0 right-0 p-2.5 bg-emerald-500 text-neutral-950 rounded-full hover:scale-110 transition-transform shadow-lg disabled:opacity-50 z-10" 
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('firstName', e.target.value)} 
          error={isFieldEmpty(formData.firstName)} 
          placeholder={t('profile.placeholders.firstName')} 
        />
        <Input 
          label={t('profile.fields.lastName')} 
          value={formData.lastName} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lastName', e.target.value)} 
          error={isFieldEmpty(formData.lastName)} 
          placeholder={t('profile.placeholders.lastName')} 
        />
        <Input 
          label={t('profile.fields.displayName')} 
          value={formData.displayName} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('displayName', e.target.value)} 
          error={isFieldEmpty(formData.displayName)} 
          placeholder={t('profile.placeholders.displayName')} 
        />
      </GlassSection>

      <GlassSection title={t('profile.sections.personalData')} icon={<ShieldCheck size={18} />}>
        {/* Gender — mirrors Input.tsx classes exactly */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider ml-1">
            {t('profile.fields.gender')}
          </label>
          <select
            value={formData.gender}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('gender', e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={`w-full py-3 px-4 bg-neutral-800/50 border rounded-xl text-neutral-200 appearance-none focus:outline-none transition-all ${
              isFieldEmpty(formData.gender)
                ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'
                : 'border-neutral-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'
            }`}
          >
            <option value="" disabled className="bg-neutral-900">{t('profile.genderOptions.select')}</option>
            <option value="male" className="bg-neutral-900">{t('profile.genderOptions.male')}</option>
            <option value="female" className="bg-neutral-900">{t('profile.genderOptions.female')}</option>
            <option value="other" className="bg-neutral-900">{t('profile.genderOptions.other')}</option>
          </select>
        </div>
        {/* Date of birth — overflow-hidden clips the native date control on mobile */}
        <div className="overflow-hidden min-w-0 w-full">
          <Input
            label={t('profile.fields.dob')}
            value={formData.dob}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('dob', e.target.value)}
            error={isFieldEmpty(formData.dob)}
            type="date"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </GlassSection>

      <GlassSection title={t('profile.sections.integrations')} icon={<CreditCard size={18} />}>
        <Input 
          label={t('profile.fields.revolut')} 
          value={formData.revolutUser} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('revolutUser', e.target.value)} 
          error={isFieldEmpty(formData.revolutUser)} 
          placeholder={t('profile.placeholders.revolut')} 
        />
        <Input 
          label={t('profile.fields.discord')} 
          value={formData.discordId} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('discordId', e.target.value)} 
          error={isFieldEmpty(formData.discordId)} 
          placeholder={t('profile.placeholders.discord')} 
        />
      </GlassSection>

      {/* Push Notifications — always visible; degrades gracefully when unsupported */}
      <GlassSection title="Push Notifications" icon={<Bell size={18} />} columns={1}>
        {!push.isSupported ? (
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <BellOff size={16} className="shrink-0" />
            <p>Push notifications require HTTPS and an installed PWA. Add the app to your home screen to enable them.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm text-neutral-300">
                {push.isSubscribed
                  ? 'Notifications are enabled on this device.'
                  : 'Get notified about activity in your households.'}
              </p>
              {push.error && (
                <p className="text-xs text-red-400 break-words">{push.error}</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                {push.isSubscribed
                  ? <><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Active on this device</>
                  : <><BellOff size={12} className="shrink-0" /> Not active on this device</>}
              </div>
            </div>
            {/* Toggle */}
            <button
              id="push-notifications-toggle"
              onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
              disabled={push.isLoading}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 ${
                push.isSubscribed ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
              aria-label={push.isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full shadow transition-transform duration-200 ${
                  push.isLoading ? 'bg-neutral-300' : 'bg-white'
                } ${
                  push.isSubscribed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </GlassSection>

      {/* Save Button */}
      <div className="flex justify-end mb-12">
        <Button 
          onClick={handleSave}
          isLoading={isSaving}
          className="px-10"
        >
          {t('common.saveChanges')}
        </Button>
      </div>
    </PageLayout>
  );
}
