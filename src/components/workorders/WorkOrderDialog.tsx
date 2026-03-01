import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api";

const workOrderSchema = z.object({
  title: z.string().trim().min(1, "Naslov je obavezan").max(200, "Naslov je predugačak"),
  description: z.string().trim().max(1000, "Opis je predugačak").optional(),
  building_id: z.string().min(1, "Zgrada je obavezna"),
  apartment_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: WorkOrderFormData & { created_by: string }) => void;
  userId: string;
  isPending?: boolean;
}

export const WorkOrderDialog = ({ open, onOpenChange, onSave, userId, isPending }: WorkOrderDialogProps) => {
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      building_id: "",
      apartment_id: "",
      priority: "medium",
    },
  });

  const { data: buildingsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
    enabled: open,
  });
  const buildings = buildingsList.map((b: { id: string; name: string }) => ({
    id: String(b.id).replace(/^building-/, ""),
    name: b.name,
  }));

  const handleSubmit = (data: WorkOrderFormData) => {
    onSave({ ...data, created_by: userId });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novi radni nalog</DialogTitle>
          <DialogDescription>
            Kreirajte novi radni nalog za održavanje ili popravak.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Naslov</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Popravak lifta" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Opis (opcionalno)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detaljan opis problema..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="building_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Zgrada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Odaberite zgradu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Prioritet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Nisko</SelectItem>
                      <SelectItem value="medium">Normalno</SelectItem>
                      <SelectItem value="high">Hitno</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kreiranje..." : "Kreiraj nalog"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
