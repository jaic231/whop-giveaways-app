import { create } from "zustand";

interface CompanyState {
  // State
  experienceId: string | null;
  companyId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setExperienceId: (experienceId: string) => void;
  setCompanyId: (companyId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Async actions
  fetchCompanyFromExperience: (experienceId: string) => Promise<void>;
  initializeFromUrl: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  // Initial state
  experienceId: null,
  companyId: null,
  isLoading: false,
  error: null,

  // Sync actions
  setExperienceId: (experienceId) => set({ experienceId }),
  setCompanyId: (companyId) => set({ companyId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      experienceId: null,
      companyId: null,
      isLoading: false,
      error: null,
    }),

  // Async actions
  fetchCompanyFromExperience: async (experienceId: string) => {
    const { setLoading, setError, setCompanyId } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/experience/${experienceId}/company`);
      if (!response.ok) {
        throw new Error("Failed to fetch company from experience");
      }

      const data = await response.json();
      setCompanyId(data.companyId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch company from experience:", error);
    } finally {
      setLoading(false);
    }
  },

  initializeFromUrl: async () => {
    const { setExperienceId, fetchCompanyFromExperience } = get();

    try {
      // Extract experience ID from URL
      const pathSegments = window.location.pathname.split("/");
      const experienceId = pathSegments[2]; // /experiences/[experienceId]/...

      if (!experienceId) {
        throw new Error("No experience ID found in URL");
      }

      setExperienceId(experienceId);
      await fetchCompanyFromExperience(experienceId);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize from URL";
      set({ error: errorMessage });
      console.error("Failed to initialize from URL:", error);
    }
  },
}));
