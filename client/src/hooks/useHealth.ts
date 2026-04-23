import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HealthMetric,
  InsertHealthMetric,
  Medication,
  InsertMedication,
  HealthJournalEntry,
  InsertHealthJournalEntry,
} from "@shared/schema";
import { toast } from "sonner";
import { today } from "@/lib/dateUtils";

// ===================== HEALTH METRICS =====================
export function useHealthMetrics(date?: string) {
  const dateStr = date || today();

  return useQuery({
    queryKey: ["health-metrics", dateStr],
    queryFn: async () => {
      const response = await fetch(
        `/api/health/metrics?date=${encodeURIComponent(dateStr)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch health metrics");
      }

      return response.json() as Promise<HealthMetric[]>;
    },
  });
}

export function useCreateHealthMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metric: InsertHealthMetric) => {
      const response = await fetch("/api/health/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(metric),
      });

      if (!response.ok) {
        throw new Error("Failed to log health metrics");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-metrics"] });
      toast.success("Health metrics recorded successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to log metrics"
      );
    },
  });
}

// ===================== MEDICATIONS =====================
export function useMedications() {
  return useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const response = await fetch("/api/health/medications", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch medications");
      }

      return response.json() as Promise<Medication[]>;
    },
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medication: InsertMedication) => {
      const response = await fetch("/api/health/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(medication),
      });

      if (!response.ok) {
        throw new Error("Failed to add medication");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medication added successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add medication"
      );
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/health/medications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete medication");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medication removed successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete medication"
      );
    },
  });
}

// ===================== HEALTH JOURNAL =====================
export function useHealthJournal() {
  return useQuery({
    queryKey: ["health-journal"],
    queryFn: async () => {
      const response = await fetch("/api/health/journal", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch journal entries");
      }

      return response.json() as Promise<HealthJournalEntry[]>;
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: InsertHealthJournalEntry) => {
      const response = await fetch("/api/health/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error("Failed to create journal entry");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-journal"] });
      toast.success("Journal entry saved successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save entry"
      );
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertHealthJournalEntry>) => {
      const response = await fetch(`/api/health/journal/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update journal entry");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-journal"] }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/health/journal/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete journal entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-journal"] }),
  });
}
