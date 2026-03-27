import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddProduct,
  useDeleteProduct,
  useIsAdmin,
  useProducts,
  useUpdateProduct,
} from "@/hooks/useQueries";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";

const SKEL_ROWS = ["r1", "r2", "r3", "r4", "r5"];
const EMPTY_FORM = {
  name: "",
  category: "",
  costPrice: "",
  sellingPrice: "",
  stock: "",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { data: isAdmin } = useIsAdmin();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formError, setFormError] = useState("");

  const filtered = (products ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditTarget(p);
    setForm({
      name: p.name,
      category: p.category,
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      stock: String(p.stock),
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.costPrice ||
      !form.sellingPrice ||
      !form.stock
    ) {
      setFormError("All fields are required.");
      return;
    }
    const costPrice = Number.parseFloat(form.costPrice);
    const sellingPrice = Number.parseFloat(form.sellingPrice);
    const stock = BigInt(Math.floor(Number(form.stock)));
    if (Number.isNaN(costPrice) || Number.isNaN(sellingPrice)) {
      setFormError("Prices must be valid numbers.");
      return;
    }
    try {
      if (editTarget) {
        await updateProduct.mutateAsync({
          id: editTarget.id,
          product: {
            ...editTarget,
            name: form.name,
            category: form.category,
            costPrice,
            sellingPrice,
            stock,
          },
        });
        toast.success("Product updated!");
      } else {
        await addProduct.mutateAsync({
          id: 0n,
          name: form.name,
          category: form.category,
          costPrice,
          sellingPrice,
          stock,
          created: 0n,
          updated: 0n,
        });
        toast.success("Product added!");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save product.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      toast.success("Product deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete product.");
    }
  }

  const isPending = addProduct.isPending || updateProduct.isPending;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your inventory</p>
        </div>
        {isAdmin && (
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-white"
            data-ocid="products.add_product.button"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="products.search_input"
          placeholder="Search products or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKEL_ROWS.map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div
                    data-ocid="products.empty_state"
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    {search
                      ? "No products match your search."
                      : "No products yet. Add your first product!"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow
                  key={String(p.id)}
                  data-ocid={`products.item.${i + 1}`}
                  className="hover:bg-muted/20"
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {p.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(p.costPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(p.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.stock < 5n ? "text-orange-600 font-semibold" : ""
                      }
                    >
                      {String(p.stock)}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          data-ocid={`products.edit_button.${i + 1}`}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          data-ocid={`products.delete_button.${i + 1}`}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="products.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Product Name</Label>
              <Input
                id="pname"
                data-ocid="products.name.input"
                placeholder="e.g. A4 Notebook"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Category</Label>
              <Input
                id="pcat"
                data-ocid="products.category.input"
                placeholder="e.g. Notebooks"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pcost">Cost Price (₹)</Label>
                <Input
                  id="pcost"
                  data-ocid="products.cost_price.input"
                  type="number"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="psell">Selling Price (₹)</Label>
                <Input
                  id="psell"
                  data-ocid="products.selling_price.input"
                  type="number"
                  placeholder="0.00"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock Quantity</Label>
              <Input
                id="pstock"
                data-ocid="products.stock.input"
                type="number"
                placeholder="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            {formError && (
              <p
                data-ocid="products.form.error_state"
                className="text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="products.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white"
              data-ocid="products.submit.button"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTarget ? "Update" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="products.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="products.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="products.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
