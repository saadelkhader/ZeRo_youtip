"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  type Profile,
  type UpdateProfileInput,
} from "@/lib/actions/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      try {
        return await getProfile();
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
