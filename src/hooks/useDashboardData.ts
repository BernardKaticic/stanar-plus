import { useQuery } from "@tanstack/react-query";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        totalCharged: 234567.89,
        totalPaid: 198234.50,
        collectionRate: 84.5,
        debtorsOver50: 12,
        openWorkOrders: 8,
        urgentWorkOrders: 3,
        outstandingBalance: 36245.4,
        averageDaysOverdue: 18,
        upcomingCharges: 15230.75,
        bankImportsPending: 1,
        invoicesDueThisWeek: 9,
        inspectionsThisWeek: 2,
        buildingCount: 28,
        cityCount: 6,
        apartmentCount: 412,
        tenantCount: 367,
        occupancyRate: 91,
        emptyUnits: 12,
      };
    },
  });
};

export const useDashboardActivities = () => {
  return useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return [
        { type: "reminder", text: "Poslana 2. opomena za Starčevića 23", time: "15.10.2025. 15:40", status: "warning" },
        { type: "payment", text: "Mato Galić - uplata 65.55 €", time: "15.10.2025. 14:23", status: "success" },
        { type: "work", text: "Radni nalog: Popravak lifta - A.Starčevića 15", time: "15.10.2025. 10:15", status: "info" },
        { type: "payment", text: "Ana Babić - uplata 78.90 €", time: "14.10.2025. 16:45", status: "success" },
        { type: "inspection", text: "Zakazana inspekcija dimnjaka - Ohridska 7", time: "14.10.2025. 09:30", status: "info" },
        { type: "payment", text: "Petar Horvat - uplata 95.00 €", time: "13.10.2025. 11:20", status: "success" },
      ];
    },
  });
};

export const useDashboardDebtors = () => {
  return useQuery({
    queryKey: ["dashboard-debtors"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return [
        { name: "Ivana Kovač", amount: "234.50 €", months: "3 mjeseca", location: "Starčevića 15 · Zagreb" },
        { name: "Tomislav Vuković", amount: "187.20 €", months: "2 mjeseca", location: "Ohridska 7 · Osijek" },
        { name: "Petra Šimić", amount: "156.80 €", months: "2 mjeseca", location: "Držićeva 8 · Zadar" },
        { name: "Robert Rotz", amount: "148.10 €", months: "2 mjeseca", location: "Strossmayera 22 · Zagreb" },
        { name: "Sara Ivezić", amount: "135.00 €", months: "2 mjeseca", location: "Trg kralja 12 · Split" },
      ];
    },
  });
};
