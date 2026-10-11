import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, ClipboardList, CreditCard, RefreshCw, Search, Star, X } from 'lucide-react';
import { fetchLabourJobs, fetchOrders, updateOrderStatusApi } from '../services/api';

interface OperationsReviewPageProps {
  selectedRegionId?: string;
  mode: 'ISSUES' | 'SUBSCRIPTIONS' | 'REVIEWS';
}

const labels = {
  ISSUES: {
    title: 'Job Issues & Proof',
    subtitle: 'Review delayed, cancelled, or incomplete service jobs and order exceptions',
    icon: AlertOctagon,
  },
  SUBSCRIPTIONS: {
    title: 'Payment Modes & Subscriptions',
    subtitle: 'Monitor paid, pending, partial, and COD platform transactions from live orders',
    icon: CreditCard,
  },
  REVIEWS: {
    title: 'Reviews & Ratings Queue',
    subtitle: 'Follow up on completed work and low-confidence marketplace activity',
    icon: Star,
  },
};

export default function OperationsReviewPage({ selectedRegionId, mode }: OperationsReviewPageProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = labels[mode];
  const Icon = meta.icon;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, ordersRes] = await Promise.all([
        fetchLabourJobs(selectedRegionId),
        fetchOrders(selectedRegionId),
      ]);
      if (jobsRes.success && Array.isArray(jobsRes.data)) setJobs(jobsRes.data);
      if (ordersRes.success && Array.isArray(ordersRes.data)) setOrders(ordersRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRegionId, mode]);

  const records = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const orderRecords = orders
      .filter((order) => {
        if (mode === 'ISSUES') return ['CANCELLED', 'PENDING'].includes(order.orderStatus) || ['FAILED', 'REFUNDED'].includes(order.paymentStatus);
        if (mode === 'SUBSCRIPTIONS') return true;
        return order.orderStatus === 'DELIVERED';
      })
      .map((order) => ({
        id: order.id,
        type: 'Product Order',
        title: order.sellerProfile?.shopName || 'Seller order',
        person: order.farmerProfile?.userProfile?.fullName || 'Farmer',
        status: `${order.orderStatus} / ${order.paymentStatus}`,
        amount: order.totalAmount,
        createdAt: order.createdAt,
        raw: order,
      }));

    const jobRecords = jobs
      .filter((job) => {
        if (mode === 'ISSUES') return ['PENDING', 'CANCELLED'].includes(job.status);
        if (mode === 'SUBSCRIPTIONS') return false;
        return ['COMPLETED', 'ASSIGNED', 'IN_PROGRESS'].includes(job.status);
      })
      .map((job) => ({
        id: job.id,
        type: 'Labour Job',
        title: job.serviceTitle,
        person: job.farmerProfile?.userProfile?.fullName || 'Farmer',
        status: job.status,
        amount: job.totalAmount,
        createdAt: job.createdAt,
        raw: job,
      }));

    return [...orderRecords, ...jobRecords].filter((record) => (
      record.id.toLowerCase().includes(term) ||
      record.title.toLowerCase().includes(term) ||
      record.person.toLowerCase().includes(term) ||
      record.status.toLowerCase().includes(term)
    ));
  }, [jobs, orders, mode, searchTerm]);

  const markOrderResolved = async (record: any) => {
    if (record.type !== 'Product Order') return;
    setSavingId(record.id);
    try {
      await updateOrderStatusApi(record.id, { orderStatus: 'DELIVERED', paymentStatus: record.raw.paymentStatus === 'FAILED' ? 'PENDING' : record.raw.paymentStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{meta.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center h-9 bg-white border border-slate-200 rounded-xl px-3 shadow-sm w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search operations..." className="bg-transparent text-xs outline-none w-full" />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>
          <button onClick={loadData} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Metric label="Live Records" value={records.length} />
        <Metric label="Orders Synced" value={orders.length} />
        <Metric label="Jobs Synced" value={jobs.length} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold">Loading operations queue...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-sm font-bold">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm font-bold">No live records need attention in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-200">Record</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Farmer / Owner</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Status</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {records.map((record) => (
                  <tr key={`${record.type}-${record.id}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4 border-r border-slate-100">
                      <p className="font-bold text-slate-900">{record.title}</p>
                      <p className="text-[11px] text-slate-500">{record.type} - {record.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-bold">{record.person}</td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px]">{record.status}</span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-right font-black">Rs {Number(record.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      {record.type === 'Product Order' && mode === 'ISSUES' ? (
                        <button disabled={savingId === record.id} onClick={() => markOrderResolved(record)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold">
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Review in source module</span>
                      )}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
        <ClipboardList className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  );
}
