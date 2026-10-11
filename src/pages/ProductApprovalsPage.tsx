import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, RefreshCw, MapPin, Store } from 'lucide-react';
import { fetchProducts, approveProductStatus } from '../services/api';

export default function ProductApprovalsPage({ selectedRegionId }: { selectedRegionId?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');

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
    try {
      await approveProductStatus(productId, isApproved);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product approval');
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
                  <span className="text-lg font-black text-emerald-600">₹{p.price}</span>
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
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  p.isApprovedByAdmin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {p.isApprovedByAdmin ? 'Online & Approved' : 'Pending Approval'}
                </span>

                {p.isApprovedByAdmin ? (
                  <button
                    onClick={() => handleApprovalToggle(p.id, false)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprovalToggle(p.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Product
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
