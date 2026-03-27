import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProducts, useRecordTransaction } from "@/hooks/useQueries";
import {
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";

interface CartItem {
  product: Product;
  quantity: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Billing() {
  const { data: products, isLoading } = useProducts();
  const recordTx = useRecordTransaction();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");

  const filtered = (products ?? []).filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())) &&
      p.stock > 0n,
  );

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === p.id);
      if (existing) {
        if (existing.quantity >= Number(p.stock)) {
          toast.error("Not enough stock!");
          return prev;
        }
        return prev.map((c) =>
          c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function updateQty(productId: bigint, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  function removeItem(productId: bigint) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  const total = cart.reduce(
    (sum, c) => sum + c.product.sellingPrice * c.quantity,
    0,
  );
  const totalCost = cart.reduce(
    (sum, c) => sum + c.product.costPrice * c.quantity,
    0,
  );

  function printReceipt(txId: bigint) {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    const date = new Date().toLocaleString();
    const rows = cart
      .map(
        (c) =>
          `<tr><td>${c.product.name}</td><td style="text-align:center">${c.quantity}</td><td style="text-align:right">${fmt(c.product.sellingPrice)}</td><td style="text-align:right">${fmt(c.product.sellingPrice * c.quantity)}</td></tr>`,
      )
      .join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
<style>
body{font-family:'Courier New',monospace;max-width:320px;margin:0 auto;padding:20px;font-size:12px}
h2{text-align:center;font-size:16px;margin-bottom:4px}
.center{text-align:center}
.sep{border:none;border-top:1px dashed #000;margin:8px 0}
table{width:100%;border-collapse:collapse}
th{text-align:left;border-bottom:1px solid #000;padding:3px 0}
td{padding:3px 0}
.total{font-weight:bold;font-size:14px}
@media print{body{margin:0}}
</style></head><body>
<h2>My Stationery Shop</h2>
<p class="center">Receipt #${String(txId)}</p>
<p class="center">${date}</p>
${customerName ? `<p class="center">Customer: ${customerName}</p>` : ""}
<hr class="sep"/>
<table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
<tbody>${rows}</tbody></table>
<hr class="sep"/>
<p class="total" style="text-align:right">Total: ${fmt(total)}</p>
<hr class="sep"/>
<p class="center">Thank you for shopping with us!</p>
<p class="center">Visit again soon &#128522;</p>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
    win.document.close();
  }

  async function handleConfirm() {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    const items = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: BigInt(c.quantity),
      costPrice: c.product.costPrice,
      sellingPrice: c.product.sellingPrice,
    }));
    try {
      const txId = await recordTx.mutateAsync(items);
      toast.success("Sale recorded!");
      printReceipt(txId);
      setCart([]);
      setCustomerName("");
    } catch {
      toast.error("Failed to record sale.");
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-7rem)] flex gap-6 animate-fade-in">
      {/* Product search panel */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold mb-3">Select Products</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="billing.search_input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div
              data-ocid="billing.products.loading_state"
              className="text-center py-8 text-muted-foreground text-sm"
            >
              Loading products...
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="billing.products.empty_state"
              className="text-center py-8 text-muted-foreground text-sm"
            >
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p, i) => {
                const inCart = cart.find((c) => c.product.id === p.id);
                return (
                  <button
                    type="button"
                    key={String(p.id)}
                    data-ocid={`billing.product.item.${i + 1}`}
                    onClick={() => addToCart(p)}
                    className="text-left p-3 bg-background border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.category}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-primary">
                        {fmt(p.sellingPrice)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {inCart && (
                          <Badge className="bg-accent/20 text-accent border-0 text-xs">
                            {inCart.quantity}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Stock: {String(p.stock)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart panel */}
      <div className="w-80 flex flex-col bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Order Summary</h2>
            {cart.length > 0 && (
              <Badge className="ml-auto bg-primary text-white">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div
                data-ocid="billing.cart.empty_state"
                className="text-center py-10 text-muted-foreground text-sm"
              >
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Cart is empty
              </div>
            ) : (
              cart.map((c, i) => (
                <div
                  key={String(c.product.id)}
                  data-ocid={`billing.cart.item.${i + 1}`}
                  className="flex flex-col gap-1.5 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-tight flex-1 pr-2">
                      {c.product.name}
                    </p>
                    <button
                      type="button"
                      data-ocid={`billing.cart.delete_button.${i + 1}`}
                      onClick={() => removeItem(c.product.id)}
                      className="text-muted-foreground hover:text-destructive p-0.5 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-ocid={`billing.cart.minus_button.${i + 1}`}
                        onClick={() => updateQty(c.product.id, -1)}
                        className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        data-ocid={`billing.cart.plus_button.${i + 1}`}
                        onClick={() => updateQty(c.product.id, 1)}
                        disabled={c.quantity >= Number(c.product.stock)}
                        className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {fmt(c.product.sellingPrice * c.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer Name (optional)</Label>
            <Input
              id="customer"
              data-ocid="billing.customer_name.input"
              placeholder="Walk-in customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profit</span>
            <span className="font-semibold text-green-600">
              {fmt(total - totalCost)}
            </span>
          </div>
          <Button
            data-ocid="billing.confirm_sale.button"
            onClick={handleConfirm}
            disabled={cart.length === 0 || recordTx.isPending}
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold"
          >
            {recordTx.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" /> Confirm &amp; Print Receipt
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
