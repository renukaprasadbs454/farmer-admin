import { useState, useEffect, useMemo } from 'react';
import { 
  HardHat, 
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
  Users,
  Coins
} from 'lucide-react';
import { 
  fetchAvailableServices, 
  createAvailableServiceApi, 
  updateAvailableServiceApi, 
  deleteAvailableServiceApi,
  fetchUsersBySegment 
} from '../services/api';

interface LabourServicesPageProps {
  selectedRegionId?: string;
}

export default function LabourServicesPage({ selectedRegionId }: LabourServicesPageProps) {
  const [services, setServices] = useState<any[]>([]);
  const [labourers, setLabourers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form State for Add / Edit
  const [serviceForm, setServiceForm] = useState({
    title: '',
    skillLevel: 'Skilled Labour',
    dailyRate: '600',
    hourlyRate: '90',
    minTeamSize: '4',
    description: '',
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, labourRes] = await Promise.all([
        fetchAvailableServices('LABOUR'),
        fetchUsersBySegment('LABOUR', 'ALL', selectedRegionId),
      ]);

      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }
      if (labourRes.success && Array.isArray(labourRes.data)) {
        setLabourers(labourRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load labour services:', err);
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
    const dailyMatch = desc?.match(/₹?(\d+[\d,]*)\/day/i);
    const hourlyMatch = desc?.match(/₹?(\d+[\d,]*)\/hr/i);
    return {
      daily: dailyMatch ? dailyMatch[1].replace(',', '') : '600',
      hourly: hourlyMatch ? hourlyMatch[1].replace(',', '') : '90',
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
      const compositeDescription = `${serviceForm.description.trim()} • Wage: ₹${serviceForm.dailyRate}/day, ₹${serviceForm.hourlyRate}/hr (Team: ${serviceForm.minTeamSize} workers) • Level: ${serviceForm.skillLevel}`;

      const res = await createAvailableServiceApi({
        title: serviceForm.title.trim(),
        category: 'LABOUR',
        description: compositeDescription,
        iconName: 'plant',
      });

      if (res.success) {
        showToast(`Labour task "${serviceForm.title}" added to catalog!`);
        setShowAddModal(false);
        setServiceForm({
          title: '',
          skillLevel: 'Skilled Labour',
          dailyRate: '600',
          hourlyRate: '90',
          minTeamSize: '4',
          description: '',
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
      const compositeDescription = `${serviceForm.description.trim()} • Wage: ₹${serviceForm.dailyRate}/day, ₹${serviceForm.hourlyRate}/hr (Team: ${serviceForm.minTeamSize} workers) • Level: ${serviceForm.skillLevel}`;

      const res = await updateAvailableServiceApi(editingService.id, {
        title: serviceForm.title.trim(),
        description: compositeDescription,
      });

      if (res.success) {
        showToast(`Labour service "${serviceForm.title}" updated successfully!`);
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
    if (!confirm(`Are you sure you want to remove "${title}" from the labour catalog?`)) return;
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
    const headers = ['#', 'Task Name', 'Category', 'Description & Wage Structure', 'Created Date'];
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
    link.setAttribute('download', `labour_services_catalog_${new Date().toISOString().split('T')[0]}.csv`);
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
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Labour Services & Wage Benchmarks</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {filteredServices.length} standard tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Standardize agricultural manual tasks, fair wage benchmarks, and regional workforce rates</p>
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
              placeholder="Search labour services..."
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
                skillLevel: 'Skilled Labour',
                dailyRate: '600',
                hourlyRate: '90',
                minTeamSize: '4',
                description: '',
              });
              setShowAddModal(true);
            }}
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labour Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Labour Tasks</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{services.length} Agricultural Tasks</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Sowing, harvesting, de-weeding, spraying</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Wage Benchmark</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">₹500 – ₹700/day</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Fair agricultural wage guidelines per worker</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Labour Crews</p>
            <h3 className="text-2xl font-black text-purple-800 mt-0.5">{labourers.length} Groups</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Workforce ready for dispatch in region</p>
          </div>
        </div>
      </div>

      {/* Excel Spreadsheet Table of Services */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Standardized Labour Services & Wage Matrix</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredServices.length} task definitions
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading labour tasks catalog...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center text-slate-400 min-h-[250px] flex flex-col items-center justify-center">
            <HardHat className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No labour tasks found</p>
            <p className="text-xs text-slate-400 mt-1">Click &ldquo;+ Add Labour Task&rdquo; to define a new workforce service</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200/70">#</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Agricultural Task</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Scope & Skill Guidelines</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Standard Daily Wage</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-right">Hourly Rate</th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70 text-center">Status</th>
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
                            <HardHat className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{service.title}</p>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 uppercase">
                              LABOUR
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">{service.description}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-right border-r border-slate-100">
                        ₹{pricing.daily}/day
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 text-right border-r border-slate-100">
                        ₹{pricing.hourly}/hr
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
                                skillLevel: 'Skilled Labour',
                                dailyRate: pricing.daily.replace(',', ''),
                                hourlyRate: pricing.hourly.replace(',', ''),
                                minTeamSize: '4',
                                description: service.description.split('• Wage:')[0].trim(),
                              });
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Edit Wage & Specs"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" /> Edit Wage
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id, service.title)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Task"
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

      {/* Registered Labour Workforce Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Regional Registered Labour Teams (From Workforce Registry)</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{labourers.length} teams available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labourers.map((lb) => (
            <div key={lb.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{lb.fullName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {lb.approvalStatus}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {lb.labourProfile?.servicesOffered?.slice(0, 2).map((s: string) => (
                    <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {lb.region?.name || 'Mandya'} &bull; {lb.labourProfile?.experienceYears || 5} Yrs Experience
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900">₹{lb.labourProfile?.dailyRate || 600}/day</span>
                <span className="text-slate-500">₹{lb.labourProfile?.hourlyRate || 90}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT LABOUR SERVICE ================= */}
      {(showAddModal || editingService) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingService ? 'Edit Labour Wage & Pricing' : 'Define New Agricultural Labour Task'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure task guidelines and fair wage benchmarks</p>
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
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Labour Task Title *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Sugarcane Harvesting & De-trashing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Skill Requirement</label>
                  <select
                    value={serviceForm.skillLevel}
                    onChange={(e) => setServiceForm({ ...serviceForm, skillLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="General Farm Hand">General Farm Hand</option>
                    <option value="Skilled Labour">Skilled Labour</option>
                    <option value="Specialized / Certified">Specialized / Certified (Spraying/Pruning)</option>
                    <option value="Heavy Crop Cutting">Heavy Crop Cutting Crew</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Recommended Team Size</label>
                  <input
                    type="number"
                    value={serviceForm.minTeamSize}
                    onChange={(e) => setServiceForm({ ...serviceForm, minTeamSize: e.target.value })}
                    placeholder="4"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Standard Daily Wage (₹/day) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={serviceForm.dailyRate}
                      onChange={(e) => setServiceForm({ ...serviceForm, dailyRate: e.target.value })}
                      placeholder="600"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Standard Hourly Rate (₹/hr) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={serviceForm.hourlyRate}
                      onChange={(e) => setServiceForm({ ...serviceForm, hourlyRate: e.target.value })}
                      placeholder="90"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Task Scope & Field Guidelines</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="e.g. Field harvesting, binding in bundles, and stacking at farm edge. Minimum 4 members team."
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
                  {formLoading ? 'Saving...' : editingService ? 'Update Wage & Guidelines' : 'Save & Publish Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
