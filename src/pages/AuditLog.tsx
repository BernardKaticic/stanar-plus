import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { auditLogApi } from "@/lib/api";
import { useState } from "react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

const TABLE_LABELS: Record<string, string> = {
  invoices: "E-računi",
  representatives: "Predstavnici",
  buildings: "Zgrade",
};

const AuditLog = () => {
  const [page, setPage] = useState(1);
  const [tableFilter, setTableFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page, tableFilter],
    queryFn: () =>
      auditLogApi.getAll({
        page,
        pageSize: 25,
        table: tableFilter === "all" ? undefined : tableFilter,
      }),
  });

  const items = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1>Audit log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pregled promjena u sustavu
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Zapisi</CardTitle>
              <CardDescription>Posljednje izmjene</CardDescription>
            </div>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tablica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve tablice</SelectItem>
                <SelectItem value="invoices">E-računi</SelectItem>
                <SelectItem value="representatives">Predstavnici</SelectItem>
                <SelectItem value="buildings">Zgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vrijeme</TableHead>
                  <TableHead>Tablica</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Akcija</TableHead>
                  <TableHead>Promjene</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Učitavanje...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nema zapisa
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.createdAt
                          ? format(new Date(item.createdAt), "d.M.yyyy. HH:mm", { locale: hr })
                          : "-"}
                      </TableCell>
                      <TableCell>{TABLE_LABELS[item.tableName] || item.tableName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.recordId}</TableCell>
                      <TableCell>
                        <span
                          className={
                            item.action === "INSERT"
                              ? "text-green-600"
                              : item.action === "DELETE"
                                ? "text-red-600"
                                : "text-amber-600"
                          }
                        >
                          {item.action}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {item.newValues && Object.keys(item.newValues).length > 0
                          ? JSON.stringify(item.newValues)
                          : item.oldValues && Object.keys(item.oldValues).length > 0
                            ? "(obrisano)"
                            : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalCount > 25 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Prikazano {(page - 1) * 25 + 1}–{Math.min(page * 25, totalCount)} od {totalCount}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prethodna
                </Button>
                <Button variant="outline" size="sm" disabled={page * 25 >= totalCount} onClick={() => setPage((p) => p + 1)}>
                  Sljedeća
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
