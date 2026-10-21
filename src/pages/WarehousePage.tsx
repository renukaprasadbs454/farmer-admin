import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Warehouse,
  ThermometerSnowflake,
  MapPin,
  Eye,
  RefreshCw,
  Box,
  X
} from 'lucide-react';
import {
  fetchWarehouseListings,
  createWarehouseListingApi,
  deleteWarehouseListingApi,
  fetchWarehouseBookings,
  assignWarehouseBookingApi
} from '../services/api';

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'facilities'>('bookings');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddFacilityModal, setShowAddFacilityModal] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Assign form state
  const [assignStatus, setAssignStatus] = useState<string>('APPROVED');
  const [assignedBay, setAssignedBay] = useState<string>('');
  const [adminRemarks, setAdminRemarks] = useState<string>('');

  // New facility form state
  const [newFacility, setNewFacility] = useState({
    name: '',
    warehouseType: 'COLD_STORAGE',
    location: '',
    district: 'Mandya',
    state: 'Karnataka',
    pincode: '571402',
    totalCapacitySqFt: '15000',
    availableCapacitySqFt: '15000',
    rentPerSqFtDay: '1.40',
    rentPerSqFtMonth: '36.00',
    minimumRentalDays: '7',
    temperatureRange: '0°C to 4°C',
    features: '24/7 CCTV, Temperature Monitoring, Goods In-Transit Insurance, Forklift Bay',
    contactPerson: '',
    contactPhone: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [facRes, bookRes] = await Promise.all([
        fetchWarehouseListings(typeFilter, '', searchQuery),
        fetchWarehouseBookings(statusFilter, 'ALL', searchQuery)
      ]);
      setFacilities(facRes.data || []);
      setBookings(bookRes.data || []);
    } catch (err) {
      console.error('Failed to load warehouse data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createWarehouseListingApi({
        ...newFacility,
        totalCapacitySqFt: parseFloat(newFacility.totalCapacitySqFt),
        availableCapacitySqFt: parseFloat(newFacility.availableCapacitySqFt),
        rentPerSqFtDay: parseFloat(newFacility.rentPerSqFtDay),
        rentPerSqFtMonth: parseFloat(newFacility.rentPerSqFtMonth),
        minimumRentalDays: parseInt(newFacility.minimumRentalDays, 10),
        features: newFacility.features.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowAddFacilityModal(false);
      loadData();
      alert('Warehouse facility registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create facility');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSpace = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await assignWarehouseBookingApi(selectedBooking.id, {
        status: assignStatus,
        assignedBayNumber: assignedBay,
        adminRemarks,
      });
      setShowAssignModal(false);
      setSelectedBooking(null);
      loadData();
      alert(`Booking ${assignStatus} and assigned to ${assignedBay || 'storage zone'}`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign space');
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignModal = (booking: any) => {
    setSelectedBooking(booking);
    setAssignStatus(booking.status === 'PENDING' ? 'APPROVED' : booking.status);
    setAssignedBay(booking.assignedBayNumber || `Bay ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}-${Math.floor(10 + Math.random() * 90)}`);
    setAdminRemarks(booking.adminRemarks || '');
    setShowAssignModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Space Assigned</span>;
      case 'CHECKED_IN':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Box className="w-3.5 h-3.5" /> Produce Stored</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><CheckCircle2 className="w-3.5 h-3.5" /> Checked Out</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Awaiting Bay Assignment</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/30 backdrop-blur-md rounded-full text-xs font-semibold text-teal-200 mb-3 border border-teal-400/30">
            <Building2 className="w-3.5 h-3.5" /> Rural Cold Storage & Godown Logistics Hub
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Warehouse Space Rental</h1>
          <p className="text-teal-100/90 text-sm leading-relaxed">
            Post verified storage spaces (sq.ft rent per day/month), monitor available capacities, and allocate bays to incoming farmer harvest bookings.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <Warehouse className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Space Reservations & Bays ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'facilities'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Warehouse Facilities ({facilities.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'facilities' ? (
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              >
                <option value="ALL">All Warehouse Types</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="DRY_GRAIN_GODOWN">Dry Grain Godown</option>
                <option value="SILO">Silo Storage</option>
                <option value="PACKHOUSE_GRADING">Packhouse & Grading</option>
              </select>
              <button
                onClick={() => setShowAddFacilityModal(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Facility
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Assignment</option>
                <option value="APPROVED">Space Assigned</option>
                <option value="CHECKED_IN">Produce Stored</option>
                <option value="COMPLETED">Checked Out</option>
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

      {/* Tab 1: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by farmer name, phone number, crop type, or assigned bay..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
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
            <div className="py-20 text-center text-slate-400">Loading warehouse reservations...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Warehouse Reservations Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                When farmers apply to store their harvest lots in cold storages or godowns, reservations will show here for bay assignment.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Farmer / Contact</th>
                      <th className="px-6 py-4">Facility / Location</th>
                      <th className="px-6 py-4">Crop Stored</th>
                      <th className="px-6 py-4">Space (Sq. Ft.)</th>
                      <th className="px-6 py-4">Duration & Dates</th>
                      <th className="px-6 py-4">Estimated Rent</th>
                      <th className="px-6 py-4">Assigned Bay</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{b.applicantName}</div>
                          <div className="text-xs text-slate-400 font-mono">{b.applicantPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 line-clamp-1">{b.warehouseListing?.name}</div>
                          <div className="text-xs text-slate-500">{b.warehouseListing?.district}, {b.warehouseListing?.state}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{b.cropType}</div>
                          {b.quantityEstimatedTons && (
                            <div className="text-xs text-slate-500">~{b.quantityEstimatedTons} Metric Tons</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {b.requestedSqFt?.toLocaleString()} sq.ft.
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{b.totalDays} Days ({b.billingCycle})</div>
                          <div className="text-xs text-slate-400">
                            {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                          ₹{b.totalRentEstimate?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {b.assignedBayNumber ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                              <Box className="w-3 h-3 text-teal-600" /> {b.assignedBayNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(b.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openAssignModal(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Assign Bay
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

      {/* Tab 2: Facilities */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => {
            const occupancyPct = Math.round(
              ((fac.totalCapacitySqFt - fac.availableCapacitySqFt) / (fac.totalCapacitySqFt || 1)) * 100
            );

            return (
              <div key={fac.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-teal-50 text-teal-700">
                      {fac.warehouseType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base mb-1">{fac.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.location}, {fac.district}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs font-bold text-slate-700">Available Storage</span>
                      <span className="font-mono font-extrabold text-teal-700 text-sm">
                        {fac.availableCapacitySqFt?.toLocaleString()} / {fac.totalCapacitySqFt?.toLocaleString()} sq.ft.
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-1">
                      <span>{occupancyPct}% Occupied</span>
                      <span>{(100 - occupancyPct)}% Available</span>
                    </div>
                  </div>

                  {/* Tariff Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Rent</span>
                      <span className="font-extrabold text-slate-900 text-sm">₹{fac.rentPerSqFtDay} <span className="text-[10px] text-slate-400">/sq.ft</span></span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Rent</span>
                      <span className="font-extrabold text-teal-700 text-sm">₹{fac.rentPerSqFtMonth} <span className="text-[10px] text-slate-400">/sq.ft</span></span>
                    </div>
                  </div>

                  {fac.temperatureRange && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl mb-3 font-semibold">
                      <ThermometerSnowflake className="w-4 h-4" />
                      <span>{fac.temperatureRange}</span>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Amenities</span>
                    <div className="flex flex-wrap gap-1">
                      {fac.features?.map((f: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span>{fac._count?.bookings || 0} Reservations</span>
                  <button
                    onClick={async () => {
                      if (confirm('Deactivate this warehouse facility?')) {
                        await deleteWarehouseListingApi(fac.id);
                        loadData();
                      }
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Space & Bay Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Warehouse Storage Bay</h3>
                <p className="text-xs text-slate-400 font-mono">Booking ID: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Farmer</span>
                  <div className="font-bold text-slate-900">{selectedBooking.applicantName}</div>
                  <div className="text-slate-500 font-mono">{selectedBooking.applicantPhone}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Requested Space</span>
                  <div className="font-black text-teal-700 text-base font-mono">{selectedBooking.requestedSqFt} Sq. Ft.</div>
                  <div className="text-slate-500">{selectedBooking.totalDays} Days ({selectedBooking.billingCycle})</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Crop To Store</span>
                  <div className="font-semibold text-slate-800">{selectedBooking.cropType}</div>
                  <div className="text-slate-500">{selectedBooking.quantityEstimatedTons ? `~${selectedBooking.quantityEstimatedTons} Tons` : ''}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Facility</span>
                  <div className="font-semibold text-slate-800">{selectedBooking.warehouseListing?.name}</div>
                  <div className="text-teal-700 font-bold font-mono">Rent: ₹{selectedBooking.totalRentEstimate?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reservation Status</label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="APPROVED">APPROVED (Bay Assigned)</option>
                  <option value="CHECKED_IN">CHECKED_IN (Produce Stored in Bay)</option>
                  <option value="COMPLETED">COMPLETED (Checked Out)</option>
                  <option value="REJECTED">REJECTED (No Chamber/Bay Available)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Storage Bay / Chamber Number *</label>
                <input
                  type="text"
                  required
                  value={assignedBay}
                  onChange={(e) => setAssignedBay(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  placeholder="e.g. Bay C-04 (Chamber 1)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logistics / Temperature Instructions</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="e.g. Set chamber temperature at 2°C with 85% relative humidity. Forklift operator notified."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSpace}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add Warehouse / Cold Storage Facility</h3>
              <button onClick={() => setShowAddFacilityModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  placeholder="e.g. Mandya Agro Cold Chain & Logistics Hub"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Classification</label>
                  <select
                    value={newFacility.warehouseType}
                    onChange={(e) => setNewFacility({ ...newFacility, warehouseType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="COLD_STORAGE">Cold Storage (Temperature Controlled)</option>
                    <option value="DRY_GRAIN_GODOWN">Dry Grain Godown (Ventilated)</option>
                    <option value="SILO">Silo Storage (Bulk Grain)</option>
                    <option value="PACKHOUSE_GRADING">Packhouse & Sorting Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temperature Specifications</label>
                  <input
                    type="text"
                    value={newFacility.temperatureRange}
                    onChange={(e) => setNewFacility({ ...newFacility, temperatureRange: e.target.value })}
                    placeholder="e.g. 0°C to 4°C"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location / Address *</label>
                <input
                  type="text"
                  required
                  value={newFacility.location}
                  onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
                  placeholder="e.g. Plot 45-B, Mandya Industrial Area, Mysore-Bangalore Highway"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={newFacility.district}
                    onChange={(e) => setNewFacility({ ...newFacility, district: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newFacility.state}
                    onChange={(e) => setNewFacility({ ...newFacility, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Capacity (Sq. Ft.) *</label>
                  <input
                    type="number"
                    required
                    value={newFacility.totalCapacitySqFt}
                    onChange={(e) => setNewFacility({ ...newFacility, totalCapacitySqFt: e.target.value, availableCapacitySqFt: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Capacity (Sq. Ft.)</label>
                  <input
                    type="number"
                    value={newFacility.availableCapacitySqFt}
                    onChange={(e) => setNewFacility({ ...newFacility, availableCapacitySqFt: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rent per Sq. Ft. / Day (₹) *</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={newFacility.rentPerSqFtDay}
                    onChange={(e) => setNewFacility({ ...newFacility, rentPerSqFtDay: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rent per Sq. Ft. / Month (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newFacility.rentPerSqFtMonth}
                    onChange={(e) => setNewFacility({ ...newFacility, rentPerSqFtMonth: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amenities & Security Features (Comma Separated)</label>
                <input
                  type="text"
                  value={newFacility.features}
                  onChange={(e) => setNewFacility({ ...newFacility, features: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Supervisor Name</label>
                  <input
                    type="text"
                    value={newFacility.contactPerson}
                    onChange={(e) => setNewFacility({ ...newFacility, contactPerson: e.target.value })}
                    placeholder="e.g. Santhosh Kumar"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor Phone</label>
                  <input
                    type="text"
                    value={newFacility.contactPhone}
                    onChange={(e) => setNewFacility({ ...newFacility, contactPhone: e.target.value })}
                    placeholder="e.g. +91 9448199221"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFacilityModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
