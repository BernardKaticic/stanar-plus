import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ParsedInvoice } from "@/lib/xmlInvoiceParser";

export interface ImportPreviewItem extends ParsedInvoice {
  status?: "pending" | "importing" | "done" | "error";
  error?: string;
  invoiceId?: string;
}

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ImportPreviewItem[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
  importedCount?: number;
}

export const ImportPreviewDialog = ({
  open,
  onOpenChange,
  items,
  onConfirm,
  onCancel,
  isImporting,
  importedCount = 0,
}: ImportPreviewDialogProps) => {
  const pendingCount = items.filter((i) => i.status === "pending" || !i.status).length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Uvoz računa – pregled</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex-1 min-h-0 -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Broj</TableHead>
                <TableHead className="text-xs">Dobavljač</TableHead>
                <TableHead className="text-xs">Datum</TableHead>
                <TableHead className="text-right text-xs">Iznos</TableHead>
                <TableHead className="text-xs w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{item.invoiceNumber}</TableCell>
                  <TableCell className="text-sm">{item.supplierName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.date}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {item.amount.toFixed(2).replace(".", ",")} €
                  </TableCell>
                  <TableCell>
                    {item.status === "done" && (
                      <Badge variant="default" className="text-xs">Uvezeno</Badge>
                    )}
                    {item.status === "error" && (
                      <Badge variant="destructive" className="text-xs" title={item.error}>
                        Greška
                      </Badge>
                    )}
                    {item.status === "importing" && (
                      <Badge variant="secondary" className="text-xs">Uvozi...</Badge>
                    )}
                    {(!item.status || item.status === "pending") && (
                      <Badge variant="outline" className="text-xs">Čeka</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-4 border-t gap-4">
          <p className="text-sm text-muted-foreground">
            {doneCount > 0 && <span className="text-success">{doneCount} uvezeno</span>}
            {doneCount > 0 && errorCount > 0 && " · "}
            {errorCount > 0 && <span className="text-destructive">{errorCount} grešaka</span>}
            {pendingCount > 0 && !isImporting && (
              <span> · {pendingCount} čeka uvoz</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isImporting}>
              Zatvori
            </Button>
            {pendingCount > 0 && (
              <Button onClick={onConfirm} disabled={isImporting}>
                {isImporting ? "Uvozi..." : `Uvezi ${pendingCount} račun(a)`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
