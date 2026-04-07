import { useQuery } from "@tanstack/react-query";
import { contractsApi, decisionsApi, documentTemplatesApi } from "@/lib/api";

export const useDecisions = (params?: { status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["decisions", params?.status, params?.search],
    queryFn: () => decisionsApi.getAll(params),
  });
};

export const useContracts = (params?: { status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["contracts", params?.status, params?.search],
    queryFn: () => contractsApi.getAll(params),
  });
};

export const useDocumentTemplates = (type?: "decision" | "contract") => {
  return useQuery({
    queryKey: ["document-templates", type],
    queryFn: () => documentTemplatesApi.getAll({ type }),
  });
};
