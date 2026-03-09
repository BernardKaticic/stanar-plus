import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personName: string;
  shareNum: number;
  shareDen: number;
  onSuccess: () => void;
  onSubmit: (shareNum: number, shareDen: number) => Promise<void>;
}

export function EditShareDialog({
  open,
  onOpenChange,
  personName,
  shareNum: initialNum,
  shareDen: initialDen,
  onSuccess,
  onSubmit,
}: EditShareDialogProps) {
  const [shareNum, setShareNum] = useState(String(initialNum));
  const [shareDen, setShareDen] = useState(String(initialDen));
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setShareNum(String(initialNum));
      setShareDen(String(initialDen));
    }
  }, [open, initialNum, initialDen]);

  const handleSubmit = async () => {
    const num = parseInt(shareNum, 10);
    const den = parseInt(shareDen, 10);
    if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0 || num <= 0) {
      toast({
        title: "Udio mora biti pozitivni cijeli brojevi (npr. 1 i 4 za 1/4)",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      await onSubmit(num, den);
      toast({ title: "Udio ažuriran" });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Nije moguće ažurirati udio.";
      toast({ title: "Greška", description: msg, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  const pct =
    Number.isInteger(Number(shareNum)) && Number.isInteger(Number(shareDen)) && Number(shareDen) > 0
      ? ((Number(shareNum) / Number(shareDen)) * 100).toFixed(1)
      : "–";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Uredi udio – {personName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FormSection>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Brojnik (npr. 1)</Label>
              <Input
                type="number"
                min={1}
                value={shareNum}
                onChange={(e) => setShareNum(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nazivnik (npr. 4)</Label>
              <Input
                type="number"
                min={1}
                value={shareDen}
                onChange={(e) => setShareDen(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Udio: {shareNum}/{shareDen} = {pct}%
          </p>
          </FormSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Odustani
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
