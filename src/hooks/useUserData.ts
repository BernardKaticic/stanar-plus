import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export const useUserApartment = () => {
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ['user-apartment', user?.id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!user) return null;

      // Admin i upravitelj vide sve stanove (mock)
      if (userRole === 'admin' || userRole === 'upravitelj') {
        return [];
      }

      // Stanar vidi samo svoj stan
      return [];
    },
    enabled: !!user,
  });
};

export const useUserPaymentSlips = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-payment-slips', user?.id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!user) return [];
      return [];
    },
    enabled: !!user,
  });
};

export const useUserWorkOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-work-orders', user?.id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!user) return [];
      return [];
    },
    enabled: !!user,
  });
};
