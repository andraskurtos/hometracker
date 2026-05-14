import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile, useUploadAvatar } from './useProfile';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  dob: string;
  revolutUser: string;
  discordId: string;
  profilePicUrl: string;
}

export const useProfileLogic = (onBack: () => void) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Queries & Mutations
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [formData, setFormData] = useState<ProfileFormData>({
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

  // Sync profile data when fetched
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

  const handleSave = async () => {
    setSaveSuccess(false);

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      display_name: formData.displayName,
      gender: formData.gender,
      date_of_birth: formData.dob || null,
      revolut_username: formData.revolutUser,
      discord_id: formData.discordId
    };

    try {
      await updateProfileMutation.mutateAsync(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(t('profile.errors.saveFailed'));
    }
  };

  const handleInputChange = (name: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFieldEmpty = (value: string) => !value || value.trim() === '';

  return {
    t,
    formData,
    isLoading,
    isSaving: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    saveSuccess,
    fileInputRef,
    handleAvatarClick,
    handleFileChange,
    handleSave,
    handleInputChange,
    isFieldEmpty,
    onBack
  };
};

export type ProfileLogic = ReturnType<typeof useProfileLogic>;
