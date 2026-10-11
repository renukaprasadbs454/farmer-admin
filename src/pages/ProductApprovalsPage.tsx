import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { ShoppingBag, CheckCircle, RefreshCw, MapPin, Store, Edit3, Trash2, X } from 'lucide-react';
import { approveProductStatus, deleteProductApi, fetchProducts, updateProductApi } from '../services/api';

export default function ProductApprovalsPage({ selectedRegionId }: { selectedRegionId?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const isApprovedParam = filter === 'APPROVED' ? true : filter === 'PENDING' ? false : undefined;
      const res = await fetchProducts(selectedRegionId, isApprovedParam);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedRegionId, filter]);

  const handleApprovalToggle = async (productId: string, isApproved: boolean) => {
    setSavingId(productId);
    try {
      await approveProductStatus(productId, isApproved);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product approval');
    } finally {
      setSavingId(null);
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title || '',
      description: product.description || '',
      price: product.price ? String(product.price) : '',
      mrp: product.mrp ? String(product.mrp) : '',
      discountPercent: product.discountPercent ? String(product.discountPercent) : '',
      unit: product.unit || '',
      packageSize: product.packageSize || '',
      qualityGrade: product.qualityGrade || '',
      quantityValue: product.quantityValue ? String(product.quantityValue) : '',
      quantityUnit: product.quantityUnit || '',
      minOrderQuantity: product.minOrderQuantity ? String(product.minOrderQuantity) : '',
      stock: product.stock ? String(product.stock) : '',
      storageInstructions: product.storageInstructions || '',
      usageInstructions: product.usageInstructions || '',
    });
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;
    setSavingId(editingProduct.id);
    try {
      await updateProductApi(editingProduct.id, productForm);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSavingId(null);
    }
  };

  const deleteProduct = async (product: any) => {
    if (!confirm(`Remove "${product.title}" from the marketplace catalog?`)) return;
    setSavingId(product.id);
    try {
      await deleteProductApi(product.id);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Seller Product Approvals</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Review shop products before publishing live on Farmer Mate store</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadProducts}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm text-xs font-semibold">
            {(['PENDING', 'APPROVED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  filter === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[24px] p-12 border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Fetching products from database...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 border border-slate-100 text-center text-slate-500">
          No products match the selected approval filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-100 relative flex items-center justify-center">
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=600';
                    }}
                  />
                </div>

                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{p.title}</h3>
                  <span className="text-lg font-black text-emerald-600">Rs {p.price}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{p.description}</p>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{p.sellerProfile?.shopName || 'Agri Shop'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.region?.name} Region</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
                    <span>Stock: <b>{p.stock}</b></span>
                    <span>Pack: <b>{p.packageSize || p.unit}</b></span>
                    <span>MRP: <b>{p.mrp ? `Rs ${p.mrp}` : 'N/A'}</b></span>
                    <span>Discount: <b>{p.discountPercent || 0}%</b></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  p.isApprovedByAdmin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {p.isApprovedByAdmin ? 'Online & Approved' : 'Pending Approval'}
                </span>

                <div className="flex items-center gap-1.5">
                  {p.isApprovedByAdmin ? (
                    <button
                      onClick={() => handleApprovalToggle(p.id, false)}
                      disabled={savingId === p.id}
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprovalToggle(p.id, true)}
                      disabled={savingId === p.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="Edit product">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteProduct(p)} disabled={savingId === p.id} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50" title="Delete product">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Product Listing</h3>
                <p className="text-xs text-slate-500">Price, package, stock, quality, and discount sync to the farmer marketplace</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProductField label="Title" value={productForm.title} onChange={(value) => setProductForm({ ...productForm, title: value })} required />
                <ProductField label="Price" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} type="number" required />
                <ProductField label="MRP" value={productForm.mrp} onChange={(value) => setProductForm({ ...productForm, mrp: value })} type="number" />
                <ProductField label="Discount Percent" value={productForm.discountPercent} onChange={(value) => setProductForm({ ...productForm, discountPercent: value })} type="number" />
                <ProductField label="Package Size" value={productForm.packageSize} onChange={(value) => setProductForm({ ...productForm, packageSize: value })} />
                <ProductField label="Quality Grade" value={productForm.qualityGrade} onChange={(value) => setProductForm({ ...productForm, qualityGrade: value })} />
                <ProductField label="Quantity Value" value={productForm.quantityValue} onChange={(value) => setProductForm({ ...productForm, quantityValue: value })} type="number" />
                <ProductField label="Quantity Unit" value={productForm.quantityUnit} onChange={(value) => setProductForm({ ...productForm, quantityUnit: value })} />
                <ProductField label="Min Order Quantity" value={productForm.minOrderQuantity} onChange={(value) => setProductForm({ ...productForm, minOrderQuantity: value })} type="number" />
                <ProductField label="Stock" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} type="number" />
              </div>
              <textarea value={productForm.description || ''} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Description" />
              <textarea value={productForm.storageInstructions || ''} onChange={(e) => setProductForm({ ...productForm, storageInstructions: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Storage instructions" />
              <textarea value={productForm.usageInstructions || ''} onChange={(e) => setProductForm({ ...productForm, usageInstructions: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Usage instructions" />
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={savingId === editingProduct.id} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
      />
    </div>
  );
}
