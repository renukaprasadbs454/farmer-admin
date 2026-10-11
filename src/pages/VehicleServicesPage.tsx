import { useState, useEffect, useMemo } from 'react';
import { 
  Tractor, 
  Plus, 
  Download, 
  RefreshCw, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Gauge,
  Truck
} from 'lucide-react';
import { 
  fetchAvailableServices, 
  createAvailableServiceApi, 
  updateAvailableServiceApi, 
  deleteAvailableServiceApi,
  fetchUsersBySegment 
} from '../services/api';

interface VehicleServicesPageProps {
  selectedRegionId?: string;
}

export default function VehicleServicesPage({ selectedRegionId }: VehicleServicesPageProps) {
  const [services, setServices] = useState<any[]>([]);
  const [servicemen, setServicemen] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form State for Add / Edit
  const [serviceForm, setServiceForm] = useState({
    title: '',
    equipmentType: 'Tractor',
    hourlyRate: '1000',
    acreRate: '1200',
    description: '',
    minBookingHours: '2',
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, servicemanRes] = await Promise.all([
        fetchAvailableServices('VEHICLE'),
        fetchUsersBySegment('SERVICEMAN', 'ALL', selectedRegionId),
      ]);

      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }
      if (servicemanRes.success && Array.isArray(servicemanRes.data)) {
        setServicemen(servicemanRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load vehicle services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRegionId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract rate from description or default
  const parsePricing = (desc: string) => {
    const hourlyMatch = desc?.match(/₹?(\d+[\d,]*)\/hr/i);
    const acreMatch = desc?.match(/₹?(\d+[\d,]*)\/acre/i);
    return {
      hourly: hourlyMatch ? hourlyMatch[1].replace(',', '') : '1,000',
      acre: acreMatch ? acreMatch[1].replace(',', '') : '1,200',
    };
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  // Handle Create Service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const compositeDescription = `${serviceForm.description.trim()} • Base: ₹${serviceForm.hourlyRate}/hr, ₹${serviceForm.acreRate}/acre (Min: ${serviceForm.minBookingHours}h) • Type: ${serviceForm.equipmentType}`;

      const res = await createAvailableServiceApi({
        title: serviceForm.title.trim(),
        category: 'VEHICLE',
        description: compositeDescription,
        iconName: 'truck',
      });

      if (res.success) {
        showToast(`Vehicle service "${serviceForm.title}" added to catalog!`);
        setShowAddModal(false);
        setServiceForm({
          title: '',
          equipmentType: 'Tractor',
          hourlyRate: '1000',
          acreRate: '1200',
          description: '',
          minBookingHours: '2',
        });
        await loadData();
      } else {
        setFormError(res.message || 'Failed to create service');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error creating service');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit Service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const compositeDescription = `${serviceForm.description.trim()} • Base: ₹${serviceForm.hourlyRate}/hr, ₹${serviceForm.acreRate}/acre (Min: ${serviceForm.minBookingHours}h) • Type: ${serviceForm.equipmentType}`;

      const res = await updateAvailableServiceApi(editingService.id, {
        title: serviceForm.title.trim(),
        description: compositeDescription,
      });

      if (res.success) {
        showToast(`Service "${serviceForm.title}" updated successfully!`);
        setEditingService(null);
        await loadData();
      } else {
        setFormError(res.message || 'Failed to update service');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error updating service');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Service
  const handleDeleteService = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the platform vehicle catalog?`)) return;
    try {
      await deleteAvailableServiceApi(id);
      showToast(`Removed "${title}" from catalog`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredServices.length === 0) return;
    const headers = ['#', 'Service Title', 'Category', 'Description & Pricing Model', 'Date Added'];
    const rows = filteredServices.map((s, idx) => [
      idx + 1,
      `"${s.title}"`,
      s.category,
      `"${s.description || ''}"`,
      `"${new Date(s.createdAt).toLocaleDateString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `vehicle_services_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vehicle & Machinery Services</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {filteredServices.length} machinery types
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Define equipment services, benchmark pricing, and regional machinery provider rates</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex items-center h-9 bg-white border border-slate-200 rounded-xl px-3 shadow-sm w-56 focus-within:w-64 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search vehicle services..."
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

          <button
            onClick={exportToCSV}
            className="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={loadData}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Services"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          <button
            onClick={() => {
              setServiceForm({
                title: '',
                equipmentType: 'Tractor',
                hourlyRate: '1000',
                acreRate: '1200',
                description: '',
                minBookingHours: '2',
              });
              setShowAddModal(true);
            }}
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle Service</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Machinery Types</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{services.length} Active Services</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Available for farmers to book across regions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Standard Hourly Benchmark</p>
            <h3 className="text-2xl font-black text-blue-700 mt-0.5">₹950 – ₹2,200/hr</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Base rates across plowing, harvesting & spraying</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Machinery Providers</p>
            <h3 className="text-2xl font-black text-purple-800 mt-0.5">{servicemen.length} Servicemen</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Active equipment fleet in PostgreSQL</p>
          </div>
        </div>
      </div>

      {/* Excel Spreadsheet Table of Services */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Vehicle Services Pricing & Catalog Matrix</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredServices.length} catalog items
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading machinery services catalog...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center text-slate-400 min-h-[250px] flex flex-col items-center justify-center">
            <Tractor className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No vehicle services found</p>
            <p className="text-xs text-slate-400 mt-1">Click &ldquo;+ Add Vehicle Service&rdquo; to create your first machinery offering</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200/70">#</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Equipment / Service Title</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Specifications & Scope</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Standard Hourly Rate</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Standard Acreage Rate</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-center">Catalog Status</th>
                  <th className="py-3.5 px-4 text-center">Manage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredServices.map((service, idx) => {
                  const pricing = parsePricing(service.description);
                  return (
                    <tr key={service.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                            <Tractor className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{service.title}</p>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 uppercase">
                              VEHICLE
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">{service.description}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-right border-r border-slate-100">
                        ₹{pricing.hourly}/hr
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-right border-r border-slate-100">
                        ₹{pricing.acre}/acre
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({
                                title: service.title,
                                equipmentType: 'Tractor',
                                hourlyRate: pricing.hourly.replace(',', ''),
                                acreRate: pricing.acre.replace(',', ''),
                                description: service.description.split('• Base:')[0].trim(),
                                minBookingHours: '2',
                              });
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Edit Pricing & Specs"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" /> Edit Pricing
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id, service.title)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Synced with PostgreSQL <code>available_services</code> table</span>
          <span className="font-mono text-[11px]">Region: {selectedRegionId ? 'Selected District' : 'All Regions'}</span>
        </div>
      </div>

      {/* Registered Machinery Fleet Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Regional Registered Machinery Fleet (From Servicemen)</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{servicemen.length} operators active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicemen.map((sm) => (
            <div key={sm.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{sm.fullName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {sm.approvalStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">{sm.servicemanProfile?.vehicleType || 'Tractor'}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Plate: {sm.servicemanProfile?.vehicleNumber || 'MH-12-XX-0000'} &bull; {sm.region?.name || 'Pune'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">₹{sm.servicemanProfile?.ratePerHour || 950}/hr</span>
                <span className="text-emerald-700">₹{sm.servicemanProfile?.ratePerAcre || 1200}/acre</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT VEHICLE SERVICE ================= */}
      {(showAddModal || editingService) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingService ? 'Edit Vehicle Service Pricing' : 'Create New Vehicle Service'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure equipment specifications and benchmark pricing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingService(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingService ? handleUpdateService : handleCreateService} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Tractor Plowing (MB Plough & Rotavator)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Equipment Category</label>
                  <select
                    value={serviceForm.equipmentType}
                    onChange={(e) => setServiceForm({ ...serviceForm, equipmentType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="Tractor">Tractor (45HP – 60HP)</option>
                    <option value="Combine Harvester">Combine Harvester</option>
                    <option value="Agricultural Drone">Agricultural Drone Sprayer</option>
                    <option value="Mini Tractor">Mini Tractor / Power Tiller</option>
                    <option value="Boom Sprayer">Boom Sprayer Tanker</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Min. Booking Units</label>
                  <input
                    type="number"
                    value={serviceForm.minBookingHours}
                    onChange={(e) => setServiceForm({ ...serviceForm, minBookingHours: e.target.value })}
                    placeholder="2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Standard Hourly Rate (₹/hr) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={serviceForm.hourlyRate}
                      onChange={(e) => setServiceForm({ ...serviceForm, hourlyRate: e.target.value })}
                      placeholder="1000"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Standard Acreage Rate (₹/acre) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={serviceForm.acreRate}
                      onChange={(e) => setServiceForm({ ...serviceForm, acreRate: e.target.value })}
                      placeholder="1200"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Scope of Work & Equipment Specs</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="e.g. Heavy duty rotavator tilling with dual disc plough. Fuel included."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingService ? 'Update Pricing & Specs' : 'Save & Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
