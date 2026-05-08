import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { queryKeys } from './queryKeys';
import { useNavigate } from 'react-router-dom';

export const useProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: userService.getProfile,
    enabled,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => userService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    userService.logout();
    queryClient.clear();
    navigate('/landing');
  };
};
