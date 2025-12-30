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
}

export const WorkOrderDialog = ({ open, onOpenChange, onSave, userId }: WorkOrderDialogProps) => {
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

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: '1', number: '15', name: null, street: { name: 'Antuna Starčevića', city: { name: 'Vinkovci' } } },
        { id: '2', number: '7', name: null, street: { name: 'Ohridska', city: { name: 'Vinkovci' } } },
        { id: '3', number: '12', name: null, street: { name: 'Marmontova', city: { name: 'Split' } } },
      ];
    },
  });

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
                <FormItem>
                  <FormLabel>Naslov</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Popravak lifta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
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

            <FormField
              control={form.control}
              name="building_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zgrada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite zgradu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings?.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.street?.city?.name} - {building.street?.name} {building.number}
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
                <FormItem>
                  <FormLabel>Prioritet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">Kreiraj nalog</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
