// ============================================
// JobWatch - TanStack Query Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JobFilters, NotificationFilters, UserSettings } from '@/types';
import type { SearchFormPayload } from '@/lib/searchMapping';
import {
  jobsService,
  searchesService,
  notificationsService,
  dashboardService,
  usersService,
} from '@/services';
import { REFRESH_INTERVAL } from '@/lib/constants';

// --- Dashboard ---
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// --- Jobs ---
export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsService.list(filters),
  });
}

export function useNewJobs() {
  return useQuery({
    queryKey: ['jobs', 'new'],
    queryFn: jobsService.getNew,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsService.get(id),
    enabled: !!id,
  });
}

export function useMarkJobViewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsService.markViewed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMarkJobApplied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsService.markApplied(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

// --- Searches ---
export function useSearches() {
  return useQuery({
    queryKey: ['searches'],
    queryFn: searchesService.list,
  });
}

export function useSearch(id: string) {
  return useQuery({
    queryKey: ['searches', id],
    queryFn: () => searchesService.get(id),
    enabled: !!id,
  });
}

export function useSearchHistory(id: string) {
  return useQuery({
    queryKey: ['searches', id, 'history'],
    queryFn: () => searchesService.history(id),
    enabled: !!id,
  });
}

export function useCreateSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SearchFormPayload) => searchesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['searches'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SearchFormPayload> }) =>
      searchesService.update(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['searches'] });
      qc.invalidateQueries({ queryKey: ['searches', variables.id] });
    },
  });
}

export function useDeleteSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => searchesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['searches'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useToggleSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' }) =>
      action === 'pause' ? searchesService.pause(id) : searchesService.resume(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['searches'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// --- Notifications ---
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsService.list(filters),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// --- Settings ---
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: usersService.getSettings,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => usersService.updateSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// --- User Profile ---
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: { name?: string; timezone?: string }) => usersService.updateProfile(data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersService.changePassword(data),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => usersService.deleteAccount(),
  });
}
