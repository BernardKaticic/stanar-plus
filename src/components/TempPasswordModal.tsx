import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface TempPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  tempPassword: string;
}

export const TempPasswordModal = ({
  open,
  onOpenChange,
  email,
  tempPassword,
}: TempPasswordModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Email: ${email}\nPrivremena lozinka: ${tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Korisnički račun kreiran</AlertDialogTitle>
          <AlertDialogDescription>
            Privremena lozinka za suvlasnika. Kopirajte i sigurno pošaljite suvlasniku – neće biti prikazana ponovno.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Email: </span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Privremena lozinka: </span>
            <span className="font-mono font-medium bg-background px-2 py-1 rounded">{tempPassword}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopirano!" : "Kopiraj"}
          </Button>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Zatvori</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
