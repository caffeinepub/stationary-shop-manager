import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReport } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Package,
  Receipt,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const SKEL_ROWS = ["a", "b", "c", "d"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Reports() {
  const { data: report, isLoading } = useReport();
  const qc = useQueryClient();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["report"] });
  }

  const margin =
    report && report.totalRevenue > 0
      ? ((report.totalProfit / report.totalRevenue) * 100).toFixed(1)
      : "0.0";

  const summaries = [
    {
      label: "Total Revenue",
      value: report ? fmt(report.totalRevenue) : "—",
      icon: DollarSign,
      bg: "bg-kpi-blue",
      color: "text-primary",
    },
    {
      label: "Total Investment (Cost)",
      value: report ? fmt(report.totalCost) : "—",
      icon: Package,
      bg: "bg-kpi-peach",
      color: "text-orange-600",
    },
    {
      label: "Total Profit",
      value: report ? fmt(report.totalProfit) : "—",
      icon: TrendingUp,
      bg: "bg-kpi-mint",
      color: "text-accent",
    },
    {
      label: "Total Transactions",
      value: report ? String(report.transactionCount) : "—",
      icon: Receipt,
      bg: "bg-kpi-lavender",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">
            Overview of your business performance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refresh}
          data-ocid="reports.refresh.button"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Report
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-card">
              <CardContent className="p-5">
                <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mb-1" />
                ) : (
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
            <p className="text-3xl font-bold text-accent">{margin}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Of total revenue is profit
            </p>
          </div>
          <div className="w-24 h-24 rounded-full border-8 border-accent/20 flex items-center justify-center">
            <span className="text-lg font-bold text-accent">{margin}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div data-ocid="reports.top_products.loading_state">
              {SKEL_ROWS.map((k) => (
                <Skeleton key={k} className="h-10 w-full mb-2" />
              ))}
            </div>
          ) : !report?.topProducts?.length ? (
            <div
              data-ocid="reports.top_products.empty_state"
              className="text-center py-8 text-muted-foreground text-sm"
            >
              No sales data yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>#</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topProducts.map(([name, qty], i) => (
                  <TableRow
                    key={name}
                    data-ocid={`reports.top_products.item.${i + 1}`}
                  >
                    <TableCell>
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-accent">
                        {String(qty)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
