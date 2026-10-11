import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ClipboardList, CreditCard, Download, PackageCheck, RefreshCw, Search, X } from 'lucide-react';
import { fetchOrders, updateOrderStatusApi } from '../services/api';

const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const paymentStatuses = ['PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED'];

export default function ProductOrdersPage({ selectedRegionId }: { selectedRegionId?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrders(selectedRegionId, statusFilter);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedRegionId, statusFilter]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orders.filter((order) => {
      return (
        order.id?.toLowerCase().includes(term) ||
        order.farmerProfile?.userProfile?.fullName?.toLowerCase().includes(term) ||
        order.sellerProfile?.shopName?.toLowerCase().includes(term) ||
        order.region?.name?.toLowerCase().includes(term)
      );
    });
  }, [orders, searchTerm]);

  const updateStatus = async (orderId: string, payload: { orderStatus?: string; paymentStatus?: string }) => {
    setSavingId(orderId);
    try {
      await updateOrderStatusApi(orderId, payload);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    if (filteredOrders.length === 0) return;
    const rows = filteredOrders.map((order, index) => [
      index + 1,
      order.id,
      `"${order.farmerProfile?.userProfile?.fullName || ''}"`,
      `"${order.sellerProfile?.shopName || ''}"`,
      `"${order.region?.name || ''}"`,
      order.orderStatus,
      order.paymentStatus,
      order.totalAmount,
      `"${new Date(order.createdAt).toLocaleDateString('en-IN')}"`,
    ]);
    const csv = [
      'Row,Order ID,Farmer,Seller,Region,Order Status,Payment Status,Total Amount,Created',
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `product_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">Monitor farmer purchases, seller fulfilment, and payment state from the live orders table</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-bold">
            {['ALL', 'PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === status ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative flex items-center h-9 bg-white border border-slate-200 rounded-xl px-3 shadow-sm w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search order, farmer, seller..." className="bg-transparent text-xs outline-none w-full" />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>
          <button onClick={exportCsv} className="h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={loadOrders} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <SummaryCard label="Total Orders" value={orders.length} icon={<PackageCheck className="w-6 h-6" />} />
        <SummaryCard label="Delivered Orders" value={orders.filter((o) => o.orderStatus === 'DELIVERED').length} icon={<ClipboardList className="w-6 h-6" />} />
        <SummaryCard label="Paid Orders" value={orders.filter((o) => o.paymentStatus === 'PAID').length} icon={<CreditCard className="w-6 h-6" />} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold">Loading product orders...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-sm font-bold">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm font-bold">No orders match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-200">Order</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Farmer</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Seller</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Items</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-right">Amount</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Order Status</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 border-r border-slate-100 font-mono">
                      <p className="font-bold text-slate-900">{order.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-bold">{order.farmerProfile?.userProfile?.fullName || 'Farmer'}</td>
                    <td className="py-3 px-4 border-r border-slate-100">{order.sellerProfile?.shopName || order.sellerProfile?.userProfile?.fullName || 'Seller'}</td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="mb-1 last:mb-0">
                          <span className="font-semibold">{item.product?.title}</span> x {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-right font-black">Rs {Number(order.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      <select
                        value={order.orderStatus}
                        disabled={savingId === order.id}
                        onChange={(e) => updateStatus(order.id, { orderStatus: e.target.value })}
                        className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold"
                      >
                        {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.paymentStatus}
                        disabled={savingId === order.id}
                        onChange={(e) => updateStatus(order.id, { paymentStatus: e.target.value })}
                        className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold"
                      >
                        {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  );
}
