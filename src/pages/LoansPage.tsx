import { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Landmark,
  AlertCircle,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import {
  fetchLoanOffers,
  createLoanOfferApi,
  deleteLoanOfferApi,
  fetchLoanApplications,
  updateLoanApplicationStatusApi
} from '../services/api';

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'offers'>('applications');
  const [offers, setOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateOfferModal, setShowCreateOfferModal] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [adminRemarks, setAdminRemarks] = useState<string>('');

  // Create offer form state
  const [newOffer, setNewOffer] = useState({
    title: '',
    loanType: 'CROP_LOAN',
    providerName: '',
    interestRatePercent: '4.0',
    minAmount: '15000',
    maxAmount: '300000',
    tenureMonthsMin: '6',
    tenureMonthsMax: '12',
    processingFeePercent: '0.0',
    subsidyPercent: '3.0',
    eligibilityCriteria: '',
    documentsRequired: '7/12 Extract, Aadhaar Card, Bank Passbook',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [offersRes, appsRes] = await Promise.all([
        fetchLoanOffers('ALL'),
        fetchLoanApplications(statusFilter, 'ALL', searchQuery)
      ]);
      setOffers(offersRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      console.error('Failed to load loan data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createLoanOfferApi({
        ...newOffer,
        interestRatePercent: parseFloat(newOffer.interestRatePercent),
        minAmount: parseFloat(newOffer.minAmount),
        maxAmount: parseFloat(newOffer.maxAmount),
        tenureMonthsMin: parseInt(newOffer.tenureMonthsMin, 10),
        tenureMonthsMax: parseInt(newOffer.tenureMonthsMax, 10),
        processingFeePercent: parseFloat(newOffer.processingFeePercent),
        subsidyPercent: parseFloat(newOffer.subsidyPercent),
        documentsRequired: newOffer.documentsRequired.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowCreateOfferModal(false);
      loadData();
      alert('Loan offer published successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create loan offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await updateLoanApplicationStatusApi(selectedApp.id, {
        status: reviewStatus,
        approvedAmount: approvedAmount ? parseFloat(approvedAmount) : selectedApp.amountRequested,
        adminRemarks,
      });
      setShowReviewModal(false);
      setSelectedApp(null);
      loadData();
      alert(`Application ${reviewStatus} successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (app: any) => {
    setSelectedApp(app);
    setReviewStatus(app.status === 'PENDING' ? 'APPROVED' : app.status);
    setApprovedAmount(String(app.approvedAmount || app.amountRequested));
    setAdminRemarks(app.adminRemarks || '');
    setShowReviewModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Banknote className="w-3.5 h-3.5" /> Disbursed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/30 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-emerald-400/30">
            <Landmark className="w-3.5 h-3.5" /> Agri Credit Co-Origination & Mortgage Desk
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Crop & Land Loans Management</h1>
          <p className="text-emerald-100/90 text-sm leading-relaxed">
            Publish institutional credit offers, manage Kisan Credit Card (KCC) limits, and review farmer loan applications with land title verification.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <Banknote className="w-64 h-64 text-white" />
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
            Applications & Enquiries ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loan Offers ({offers.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'offers' ? (
            <button
              onClick={() => setShowCreateOfferModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Loan Offer
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
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

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by farmer name, phone number, crop name, or survey number..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
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
            <div className="py-20 text-center text-slate-400">Loading loan applications...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Loan Applications Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                When farmers apply for crop cultivation or land mortgage loans, their applications will appear here for review.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Applicant / Phone</th>
                      <th className="px-6 py-4">Loan Scheme / Bank</th>
                      <th className="px-6 py-4">Requested Amt</th>
                      <th className="px-6 py-4">Land & Crop</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{app.applicantName}</div>
                          <div className="text-xs text-slate-400 font-mono">{app.applicantPhone}</div>
                          {app.village && <div className="text-[11px] text-slate-500">{app.village}, {app.district}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 line-clamp-1">{app.loanOffer?.title}</div>
                          <div className="text-xs text-emerald-600 font-medium">{app.loanOffer?.providerName} ({app.loanOffer?.interestRatePercent}% p.a.)</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          ₹{app.amountRequested.toLocaleString()}
                          <div className="text-xs text-slate-400 font-normal">{app.tenureMonths} Months</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{app.cropName || 'General Crop'}</div>
                          <div className="text-xs text-slate-500">{app.landAreaAcres} Acres {app.surveyNumber ? `· ${app.surveyNumber}` : ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openReviewModal(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
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

      {/* Tab 2: Offers */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    offer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {offer.isActive ? 'Active Scheme' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-black text-slate-900 text-base mb-1">{offer.title}</h3>
                <p className="text-xs font-semibold text-emerald-700 mb-3">{offer.providerName}</p>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{offer.description}</p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Interest Rate</span>
                    <span className="font-extrabold text-slate-900 text-sm text-emerald-700">{offer.interestRatePercent}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Subsidy Subvention</span>
                    <span className="font-extrabold text-slate-900 text-sm">+{offer.subsidyPercent}% Rebate</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Loan Limit</span>
                    <span className="font-semibold text-slate-800">₹{(offer.minAmount/1000).toFixed(0)}k - ₹{(offer.maxAmount/100000).toFixed(1)}L</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenure Window</span>
                    <span className="font-semibold text-slate-800">{offer.tenureMonthsMin} - {offer.tenureMonthsMax} Mos</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Required Documents</span>
                  <div className="flex flex-wrap gap-1">
                    {offer.documentsRequired?.map((doc: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{offer._count?.applications || 0} Applications</span>
                <button
                  onClick={async () => {
                    if (confirm('Deactivate this loan offer?')) {
                      await deleteLoanOfferApi(offer.id);
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

      {/* Review Application Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Loan Application</h3>
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
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Applicant</span>
                  <div className="font-bold text-slate-900">{selectedApp.applicantName}</div>
                  <div className="text-slate-500 font-mono">{selectedApp.applicantPhone}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Requested Amount</span>
                  <div className="font-black text-emerald-700 text-base font-mono">₹{selectedApp.amountRequested.toLocaleString()}</div>
                  <div className="text-slate-500">{selectedApp.tenureMonths} Months Tenure</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Land Extent & Crop</span>
                  <div className="font-semibold text-slate-800">{selectedApp.cropName || 'General Crop'} ({selectedApp.landAreaAcres} Acres)</div>
                  <div className="text-slate-500">{selectedApp.surveyNumber || 'Survey No not specified'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Location</span>
                  <div className="font-semibold text-slate-800">{selectedApp.village || 'N/A'}, {selectedApp.district}</div>
                  <div className="text-slate-500">{selectedApp.state}</div>
                </div>
              </div>

              {selectedApp.purpose && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Stated Purpose</span>
                  <p className="text-slate-700 mt-0.5">{selectedApp.purpose}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision / Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Documents Verified with Sub-Registrar)</option>
                  <option value="APPROVED">APPROVED (Sanction Issued)</option>
                  <option value="DISBURSED">DISBURSED (Transferred to Farmer Account)</option>
                  <option value="REJECTED">REJECTED (Insufficient Land Title / Credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sanctioned / Approved Amount (₹)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  placeholder="e.g. 75000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Underwriter Remarks & Verification Notes</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="e.g. Pahani title verified with Mandya Taluk office. Eligible for 3% interest subvention."
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
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Publish New Loan Scheme</h3>
              <button onClick={() => setShowCreateOfferModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Title *</label>
                <input
                  type="text"
                  required
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  placeholder="e.g. SBI Kisan Credit Card (KCC) Crop Loan"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Category</label>
                  <select
                    value={newOffer.loanType}
                    onChange={(e) => setNewOffer({ ...newOffer, loanType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="CROP_LOAN">Crop Cultivation Loan</option>
                    <option value="LAND_MORTGAGE">Land Mortgage Loan</option>
                    <option value="KISAN_CREDIT">Kisan Credit Line (KCC)</option>
                    <option value="AGRI_EQUIPMENT">Farm Machinery & Solar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Partner Bank / Provider *</label>
                  <input
                    type="text"
                    required
                    value={newOffer.providerName}
                    onChange={(e) => setNewOffer({ ...newOffer, providerName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Interest Rate (% p.a.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newOffer.interestRatePercent}
                    onChange={(e) => setNewOffer({ ...newOffer, interestRatePercent: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prompt Repayment Subsidy (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOffer.subsidyPercent}
                    onChange={(e) => setNewOffer({ ...newOffer, subsidyPercent: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    value={newOffer.minAmount}
                    onChange={(e) => setNewOffer({ ...newOffer, minAmount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    value={newOffer.maxAmount}
                    onChange={(e) => setNewOffer({ ...newOffer, maxAmount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Tenure (Months)</label>
                  <input
                    type="number"
                    value={newOffer.tenureMonthsMin}
                    onChange={(e) => setNewOffer({ ...newOffer, tenureMonthsMin: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Tenure (Months)</label>
                  <input
                    type="number"
                    value={newOffer.tenureMonthsMax}
                    onChange={(e) => setNewOffer({ ...newOffer, tenureMonthsMax: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Documents (Comma Separated)</label>
                <input
                  type="text"
                  value={newOffer.documentsRequired}
                  onChange={(e) => setNewOffer({ ...newOffer, documentsRequired: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Description</label>
                <textarea
                  rows={2}
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  placeholder="e.g. Working capital support for crop sowing with government interest subvention..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
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
