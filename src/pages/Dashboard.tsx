import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, RefreshCw, CreditCard } from 'lucide-react';
import { fetchUsersBySegment, fetchLabourJobs, fetchPayments } from '../services/api';

export default function Dashboard({ selectedRegionId }: { selectedRegionId?: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingSellers: 0,
    activeJobs: 0,
    totalFarmers: 0,
    grossRevenue: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending sellers count
      const sellersRes = await fetchUsersBySegment('SELLER', 'PENDING', selectedRegionId);
      const pendingSellersCount = sellersRes.success ? sellersRes.count : 0;

      // 2. Fetch farmers count
      const farmersRes = await fetchUsersBySegment('FARMER', 'ALL', selectedRegionId);
      const farmersCount = farmersRes.success ? farmersRes.count : 0;

      // 3. Fetch jobs count & recent jobs
      const jobsRes = await fetchLabourJobs(selectedRegionId);
      const jobsList = jobsRes.success ? jobsRes.data : [];
      setRecentJobs(jobsList.slice(0, 5));

      // 4. Fetch payments & revenue
      const paymentsRes = await fetchPayments(selectedRegionId);
      const grossRev = paymentsRes.summary?.totalGross || 0;

      setStats({
        pendingSellers: pendingSellersCount,
        activeJobs: jobsList.length,
        totalFarmers: farmersCount,
        grossRevenue: grossRev,
      });
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedRegionId]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Live Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time statistics connected directly to PostgreSQL database</p>
        </div>

        <button 
          onClick={loadDashboardData}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Seller Approvals</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.pendingSellers}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Labour Jobs & Bookings</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.activeJobs}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Farmers</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalFarmers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Franchise Sales</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">₹{stats.grossRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
      
      {/* Live Recent Activity */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Service Job Requests</h2>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No service requests recorded in this region.</p>
        ) : (
          <div className="space-y-4">
            {recentJobs.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {req.farmerProfile?.userProfile?.fullName || 'Farmer'} requested {req.serviceTitle} ({req.workersNeeded} Workers)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.region?.name} City • Rate: ₹{req.ratePerUnit}/unit • Total: ₹{req.totalAmount}
                  </p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                  req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  req.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
