import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck2,
  Eye,
  RefreshCw,
  Umbrella,
  X
} from 'lucide-react';
import {
  fetchInsuranceOffers,
  createInsuranceOfferApi,
  deleteInsuranceOfferApi,
  fetchInsuranceApplications,
  updateInsuranceApplicationStatusApi
} from '../services/api';

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'offers'>('applications');
  const [offers, setOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [seasonFilter, setSeasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [claimStatus, setClaimStatus] = useState<string>('NONE');

  // Create policy form state
  const [newPolicy, setNewPolicy] = useState({
    policyName: '',
    insuranceType: 'PMFBY_SCHEME',
    underwriterName: '',
    coveredCrops: 'Onion, Tomato, Cotton, Wheat, Sugarcane, Paddy',
    premiumRatePercent: '2.0',
    sumInsuredPerAcre: '40000',
    perilsCovered: 'Drought, Flood, Pest Attack, Hailstorm, Unseasonal Rain',
    coverageDetails: '',
    termsConditions: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [offersRes, appsRes] = await Promise.all([
        fetchInsuranceOffers('ALL'),
        fetchInsuranceApplications(statusFilter, seasonFilter, searchQuery)
      ]);
      setOffers(offersRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      console.error('Failed to load insurance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, seasonFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createInsuranceOfferApi({
        ...newPolicy,
        premiumRatePercent: parseFloat(newPolicy.premiumRatePercent),
        sumInsuredPerAcre: parseFloat(newPolicy.sumInsuredPerAcre),
        coveredCrops: newPolicy.coveredCrops.split(',').map(s => s.trim()).filter(Boolean),
        perilsCovered: newPolicy.perilsCovered.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowCreatePolicyModal(false);
      loadData();
      alert('Insurance policy scheme published successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create insurance policy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await updateInsuranceApplicationStatusApi(selectedApp.id, {
        status: reviewStatus,
        policyNumber: policyNumber || undefined,
        claimStatus: claimStatus !== 'NONE' ? claimStatus : undefined,
        adminRemarks,
      });
      setShowReviewModal(false);
      setSelectedApp(null);
      loadData();
      alert(`Insurance enrollment updated to ${reviewStatus}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update insurance');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (app: any) => {
    setSelectedApp(app);
    setReviewStatus(app.status === 'PENDING' ? 'APPROVED' : app.status);
    setPolicyNumber(app.policyNumber || `PMFBY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    setAdminRemarks(app.adminRemarks || '');
    setClaimStatus(app.claimStatus || 'NONE');
    setShowReviewModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Policy Issued</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><FileCheck2 className="w-3.5 h-3.5" /> Covered / In Season</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3.5 h-3.5" /> Awaiting Underwriting</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/30 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-blue-400/30">
            <Umbrella className="w-3.5 h-3.5" /> Pradhan Mantri Fasal Bima & Weather Shield Desk
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Crop Insurance Management</h1>
          <p className="text-blue-100/90 text-sm leading-relaxed">
            Manage government PMFBY crop insurance schemes, review farmer crop declarations, issue electronic policy certificates, and audit localized loss claims.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Policy Enrollments & Claims ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Policy Schemes ({offers.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'offers' ? (
            <button
              onClick={() => setShowCreatePolicyModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Insurance Scheme
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Underwriting</option>
                <option value="APPROVED">Policy Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="ALL">All Seasons</option>
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
              </select>
              <button
                onClick={loadData}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Enrollments & Claims */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by farmer name, policy number, crop name, or survey number..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl text-sm cursor-pointer shadow-sm"
            >
              Search
            </button>
          </form>

          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading insurance enrollments...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Crop Insurance Applications Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                When farmers enroll their crop sowing acres under PMFBY or weather shield schemes, their policy applications will be listed here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Farmer / Contact</th>
                      <th className="px-6 py-4">Insurance Scheme</th>
                      <th className="px-6 py-4">Crop & Season</th>
                      <th className="px-6 py-4">Sum Insured</th>
                      <th className="px-6 py-4">Farmer Premium</th>
                      <th className="px-6 py-4">Policy # / Status</th>
                      <th className="px-6 py-4">Claim Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{app.applicantName}</div>
                          <div className="text-xs text-slate-400 font-mono">{app.applicantPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 line-clamp-1">{app.policyOffer?.policyName}</div>
                          <div className="text-xs text-blue-600 font-medium">{app.policyOffer?.underwriterName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{app.cropName}</div>
                          <div className="text-xs text-slate-500">{app.cropSeason} Season · {app.landAreaAcres} Acres</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          ₹{app.sumInsured?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                          ₹{app.calculatedPremium?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="mb-1">{getStatusBadge(app.status)}</div>
                          {app.policyNumber && (
                            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {app.policyNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {app.claimStatus === 'FILED' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Loss Reported
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">No Claims</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openReviewModal(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Underwrite
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schemes */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                    <Umbrella className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700">
                    {offer.insuranceType.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-black text-slate-900 text-base mb-1">{offer.policyName}</h3>
                <p className="text-xs font-semibold text-blue-700 mb-3">{offer.underwriterName}</p>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{offer.coverageDetails}</p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer Premium</span>
                    <span className="font-extrabold text-blue-700 text-sm">{offer.premiumRatePercent}% of Sum</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sum Insured / Acre</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{offer.sumInsuredPerAcre?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Covered Crops</span>
                  <div className="flex flex-wrap gap-1">
                    {offer.coveredCrops?.map((crop: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Perils Covered</span>
                  <div className="flex flex-wrap gap-1">
                    {offer.perilsCovered?.map((peril: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                        {peril}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-4">
                <span>{offer._count?.applications || 0} Enrollments</span>
                <button
                  onClick={async () => {
                    if (confirm('Deactivate this policy scheme?')) {
                      await deleteInsuranceOfferApi(offer.id);
                      loadData();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Underwrite Application Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Underwrite Crop Policy</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedApp.id}</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Farmer Name</span>
                  <div className="font-bold text-slate-900">{selectedApp.applicantName}</div>
                  <div className="text-slate-500 font-mono">{selectedApp.applicantPhone}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Sum Insured</span>
                  <div className="font-black text-blue-700 text-base font-mono">₹{selectedApp.sumInsured?.toLocaleString()}</div>
                  <div className="text-slate-500">Premium: ₹{selectedApp.calculatedPremium?.toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Crop & Season</span>
                  <div className="font-semibold text-slate-800">{selectedApp.cropName} ({selectedApp.cropSeason})</div>
                  <div className="text-slate-500">{selectedApp.landAreaAcres} Acres {selectedApp.surveyNumber ? `· ${selectedApp.surveyNumber}` : ''}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Underwriting Partner</span>
                  <div className="font-semibold text-slate-800">{selectedApp.policyOffer?.underwriterName}</div>
                  <div className="text-slate-500">{selectedApp.policyOffer?.policyName}</div>
                </div>
              </div>

              {selectedApp.claimDetails && (
                <div className="pt-2 border-t border-amber-200 bg-amber-50/50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Farmer Crop Loss Intimation
                  </div>
                  <p className="text-slate-700 text-[11px]">{selectedApp.claimDetails.damageDescription}</p>
                  <div className="text-slate-500 text-[10px] mt-1">
                    Loss Cause: {selectedApp.claimDetails.calamityType} · Damage: {selectedApp.claimDetails.damagePercent}%
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Policy Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPROVED">APPROVED (Certificate Issued)</option>
                  <option value="ACTIVE">ACTIVE (In Sowing Season)</option>
                  <option value="REJECTED">REJECTED (Ineligible Crop/Acreage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Electronic Policy Certificate Number</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  placeholder="e.g. PMFBY-KAR-2026-98112"
                />
              </div>

              {selectedApp.claimStatus === 'FILED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Claim Intimation Decision</label>
                  <select
                    value={claimStatus}
                    onChange={(e) => setClaimStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="FILED">FILED (Under Surveyor Inspection)</option>
                    <option value="APPROVED">APPROVED (Claim Amount Sanctioned)</option>
                    <option value="SETTLED">SETTLED (Direct Benefit Transferred)</option>
                    <option value="REJECTED">REJECTED (Discrepancy in Field Proof)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Remarks</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="e.g. Sowing certificate verified with local agriculture department office."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Scheme Modal */}
      {showCreatePolicyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add Crop Insurance Scheme</h3>
              <button onClick={() => setShowCreatePolicyModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Name *</label>
                <input
                  type="text"
                  required
                  value={newPolicy.policyName}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyName: e.target.value })}
                  placeholder="e.g. PMFBY - Comprehensive Crop Yield & Weather Shield"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Category</label>
                  <select
                    value={newPolicy.insuranceType}
                    onChange={(e) => setNewPolicy({ ...newPolicy, insuranceType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="PMFBY_SCHEME">Pradhan Mantri Fasal Bima (PMFBY)</option>
                    <option value="WEATHER_INDEX_INSURANCE">Parametric Weather Shield</option>
                    <option value="CROP_YIELD_INSURANCE">Yield Guarantee Cover</option>
                    <option value="POST_HARVEST_PROTECTION">Post-Harvest Calamity Cover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Underwriter Entity *</label>
                  <input
                    type="text"
                    required
                    value={newPolicy.underwriterName}
                    onChange={(e) => setNewPolicy({ ...newPolicy, underwriterName: e.target.value })}
                    placeholder="e.g. Agriculture Insurance Company of India"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Farmer Premium Share (% of sum) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPolicy.premiumRatePercent}
                    onChange={(e) => setNewPolicy({ ...newPolicy, premiumRatePercent: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sum Insured Per Acre (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPolicy.sumInsuredPerAcre}
                    onChange={(e) => setNewPolicy({ ...newPolicy, sumInsuredPerAcre: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Covered Crops (Comma Separated)</label>
                <input
                  type="text"
                  value={newPolicy.coveredCrops}
                  onChange={(e) => setNewPolicy({ ...newPolicy, coveredCrops: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perils Covered (Comma Separated)</label>
                <input
                  type="text"
                  value={newPolicy.perilsCovered}
                  onChange={(e) => setNewPolicy({ ...newPolicy, perilsCovered: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coverage Scope & Terms</label>
                <textarea
                  rows={2}
                  value={newPolicy.coverageDetails}
                  onChange={(e) => setNewPolicy({ ...newPolicy, coverageDetails: e.target.value })}
                  placeholder="e.g. Yield losses from non-preventable natural risks from pre-sowing to post-harvest..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePolicyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
