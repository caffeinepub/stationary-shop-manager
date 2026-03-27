import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useReport, useTransactions } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";

const TX_SKELS = ["a", "b", "c"];
const LS_SKELS = ["a", "b", "c"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleString();
}

export default function Dashboard() {
  const { data: report, isLoading: repLoading } = useReport();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: products, isLoading: prodLoading } = useProducts();

  const lowStock = products?.filter((p) => p.stock < 5n) ?? [];
  const recentTx = [...(transactions ?? [])]
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 5);

  const kpis = [
    {
      label: "Total Revenue",
      value: report ? fmt(report.totalRevenue) : "—",
      icon: DollarSign,
      bg: "bg-kpi-blue",
      color: "text-primary",
    },
    {
      label: "Total Products",
      value: products ? String(products.length) : "—",
      icon: Package,
      bg: "bg-kpi-mint",
      color: "text-accent",
    },
    {
      label: "Low Stock Alerts",
      value: String(lowStock.length),
      icon: AlertTriangle,
      bg: "bg-kpi-peach",
      color: "text-orange-600",
    },
    {
      label: "Total Profit",
      value: report ? fmt(report.totalProfit) : "—",
      icon: TrendingUp,
      bg: "bg-kpi-lavender",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="bg-primary rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back! 👋</h1>
          <p className="text-white/70 mt-1 text-sm">
            Here&apos;s what&apos;s happening at your shop today.
          </p>
        </div>
        <div className="hidden md:flex gap-3">
          <Link to="/billing">
            <Button
              className="bg-accent hover:bg-accent/90 text-white rounded-full"
              data-ocid="dashboard.start_sale.button"
            >
              Start Sale
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="shadow-card border-border">
              <CardContent className="p-5">
                <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {repLoading || prodLoading ? (
                  <Skeleton className="h-7 w-24 mb-1" />
                ) : (
                  <p className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Link to="/reports">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-accent hover:text-accent"
                  data-ocid="dashboard.view_reports.button"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {txLoading ? (
              TX_SKELS.map((k) => <Skeleton key={k} className="h-12 w-full" />)
            ) : recentTx.length === 0 ? (
              <div
                data-ocid="transactions.empty_state"
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No transactions yet. Make your first sale!
              </div>
            ) : (
              recentTx.map((tx, i) => (
                <div
                  key={String(tx.id)}
                  data-ocid={`transactions.item.${i + 1}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">Sale #{String(tx.id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(tx.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">
                      {fmt(tx.totalRevenue)}
                    </p>
                    <p className="text-xs text-green-600">
                      +{fmt(tx.totalProfit)} profit
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              <Badge
                variant="secondary"
                className="bg-kpi-peach text-orange-600 border-0"
              >
                {lowStock.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {prodLoading ? (
              LS_SKELS.map((k) => <Skeleton key={k} className="h-10 w-full" />)
            ) : lowStock.length === 0 ? (
              <div
                data-ocid="lowstock.empty_state"
                className="text-center py-8 text-muted-foreground text-sm"
              >
                ✅ All products are well stocked!
              </div>
            ) : (
              lowStock.slice(0, 5).map((p, i) => (
                <div
                  key={String(p.id)}
                  data-ocid={`lowstock.item.${i + 1}`}
                  className="flex items-center justify-between p-3 bg-kpi-peach rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                  >
                    {String(p.stock)} left
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {report?.topProducts && report.topProducts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.topProducts.slice(0, 5).map(([name, qty], i) => (
                <div
                  key={name}
                  data-ocid={`top_products.item.${i + 1}`}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{name}</span>
                  <Badge className="bg-kpi-mint text-accent border-0">
                    {String(qty)} sold
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
