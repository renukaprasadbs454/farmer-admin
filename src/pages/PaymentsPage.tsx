import { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  RefreshCw, 
  MapPin, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Download, 
  Search, 
  X,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { fetchPayments } from '../services/api';

export default function PaymentsPage({ selectedRegionId }: { selectedRegionId?: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalGross: 0, totalCommission: 0, totalNetFranchise: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetchPayments(selectedRegionId);
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to load payments from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [selectedRegionId]);

  const filteredPayments = useMemo(() => {
    return payments.filter((pt) => {
      const matchesMode = modeFilter === 'ALL' || pt.paymentMode === modeFilter;
      const matchesSearch = 
        pt.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.region?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(pt.grossAmount).includes(searchTerm);
      return matchesMode && matchesSearch;
    });
  }, [payments, modeFilter, searchTerm]);

  // Export CSV Functionality
  const exportPaymentsCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = ['#', 'Transaction ID', 'Region', 'Payment Mode', 'Gross Amount (INR)', 'Commission (INR)', 'Net Franchise (INR)', 'Status', 'Date'];
    const rows = filteredPayments.map((pt, idx) => [
      idx + 1,
      `"${pt.transactionId || pt.id}"`,
      `"${pt.region?.name || 'All Regions'}"`,
      pt.paymentMode,
      pt.grossAmount,
      pt.commissionAmount,
      pt.netFranchiseAmount,
      pt.paymentStatus,
      `"${new Date(pt.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `franchise_payments_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Franchise Ledger</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {filteredPayments.length} transactions
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Real-time payment tracking, COD management, and city franchise revenue splits</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Payment Mode Filter */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-bold">
            {['ALL', 'ONLINE', 'UPI', 'COD'].map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modeFilter === mode
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {mode === 'ALL' ? 'All Modes' : mode}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center h-9 bg-white border border-slate-200 rounded-xl px-3 shadow-sm w-56 focus-within:w-64 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search TXN ID or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Export to CSV */}
          <button
            onClick={exportPaymentsCSV}
            className="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Download Ledger as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button 
            onClick={loadPayments}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Platform Sales</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{Number(summary.totalGross).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Aggregated from PostgreSQL ledger</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission (5%)</p>
            <h3 className="text-2xl font-black text-blue-700 mt-0.5">₹{Number(summary.totalCommission).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Platform service fees retained</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Franchise Payout (95%)</p>
            <h3 className="text-2xl font-black text-purple-800 mt-0.5">₹{Number(summary.totalNetFranchise).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Disbursable to regional franchise owners</p>
          </div>
        </div>
      </div>

      {/* Transactions Excel-style Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Franchise Settlement Journal</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredPayments.length} of {payments.length} ledger entries
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading payment ledger from PostgreSQL...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 min-h-[250px] flex flex-col items-center justify-center">
            <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No payment transactions match the filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200/70">#</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Transaction ID</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Region / City</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Payment Mode</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Gross Volume</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Commission</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Net Franchise</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Status</th>
                  <th className="py-3.5 px-4 text-center">Settlement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredPayments.map((pt, idx) => (
                  <tr key={pt.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 border-r border-slate-100">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {pt.transactionId || pt.id.substring(0, 12)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        {pt.region?.name || 'Central'} District
                      </span>
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        pt.paymentMode === 'UPI' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        pt.paymentMode === 'ONLINE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {pt.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-right border-r border-slate-100 font-mono">
                      ₹{Number(pt.grossAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-blue-700 font-bold text-right border-r border-slate-100 font-mono">
                      ₹{Number(pt.commissionAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold text-right border-r border-slate-100 font-mono">
                      ₹{Number(pt.netFranchiseAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        pt.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {pt.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                      {new Date(pt.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Verified against PostgreSQL <code>payments</code> table</span>
            <span>&bull;</span>
            <span>All amounts in <b>INR (₹)</b></span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Farmer Mate Franchise Engine</span>
        </div>
      </div>
    </div>
  );
}
