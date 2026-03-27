import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  PenLine,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    to: "/products",
    label: "Products",
    icon: Package,
    ocid: "nav.products.link",
  },
  {
    to: "/billing",
    label: "Billing",
    icon: ShoppingCart,
    ocid: "nav.billing.link",
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    ocid: "nav.reports.link",
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const pathname = router.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-base text-foreground">
              My Stationery Shop
            </span>
          </div>
          <Link to="/billing">
            <Button
              data-ocid="header.start_sale.button"
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm px-5"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Start Sale
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.to ||
                (item.to !== "/" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to}>
                  <div
                    data-ocid={item.ocid}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50 text-center">
              v1.0.0
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-3">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} My Stationery Shop &mdash; Built with
          love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
