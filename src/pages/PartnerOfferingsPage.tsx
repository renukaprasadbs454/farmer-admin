import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Download, Edit3, FileSpreadsheet, RefreshCw, Search, Trash2, Wrench, X, XCircle } from 'lucide-react';
import {
  approvePartnerServiceOfferingApi,
  deletePartnerServiceOfferingApi,
  fetchPartnerServiceOfferings,
  updatePartnerServiceOfferingApi,
} from '../services/api';

interface PartnerOfferingsPageProps {
  selectedRegionId?: string;
  category?: 'LABOUR' | 'VEHICLE' | 'ALL';
}

const statusTabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function PartnerOfferingsPage({ selectedRegionId, category = 'ALL' }: PartnerOfferingsPageProps) {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    vehicleType: '',
    vehicleNumber: '',
    servicesOffered: '',
    ratePerHour: '',
    ratePerDay: '',
    ratePerAcre: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPartnerServiceOfferings({
        regionId: selectedRegionId,
        category,
        approvalStatus: statusFilter,
        includeInactive: true,
      });
      if (res.success && Array.isArray(res.data)) {
        setOfferings(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load partner offerings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
  }, [selectedRegionId, category, statusFilter]);

  const filteredOfferings = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return offerings.filter((offering) => {
      return (
        offering.title?.toLowerCase().includes(term) ||
        offering.userProfile?.fullName?.toLowerCase().includes(term) ||
        offering.userProfile?.account?.phoneNumber?.includes(searchTerm) ||
        offering.userProfile?.region?.name?.toLowerCase().includes(term)
      );
    });
  }, [offerings, searchTerm]);

  const approve = async (id: string, approvalStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setSavingId(id);
    try {
      await approvePartnerServiceOfferingApi(id, approvalStatus);
      await loadOfferings();
    } catch (err: any) {
      alert(err.message || 'Failed to update offering');
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (offering: any) => {
    setEditing(offering);
    setForm({
      title: offering.title || '',
      description: offering.description || '',
      vehicleType: offering.vehicleType || '',
      vehicleNumber: offering.vehicleNumber || '',
      servicesOffered: offering.servicesOffered?.join(', ') || '',
      ratePerHour: offering.ratePerHour ? String(offering.ratePerHour) : '',
      ratePerDay: offering.ratePerDay ? String(offering.ratePerDay) : '',
      ratePerAcre: offering.ratePerAcre ? String(offering.ratePerAcre) : '',
    });
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSavingId(editing.id);
    try {
      await updatePartnerServiceOfferingApi(editing.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        vehicleType: form.vehicleType.trim() || null,
        vehicleNumber: form.vehicleNumber.trim() || null,
        servicesOffered: form.servicesOffered.split(',').map((item) => item.trim()).filter(Boolean),
        ratePerHour: form.ratePerHour || undefined,
        ratePerDay: form.ratePerDay || undefined,
        ratePerAcre: form.ratePerAcre || undefined,
      });
      setEditing(null);
      await loadOfferings();
    } catch (err: any) {
      alert(err.message || 'Failed to save offering');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (offering: any) => {
    if (!confirm(`Suspend "${offering.title}" from partner offerings?`)) return;
    setSavingId(offering.id);
    try {
      await deletePartnerServiceOfferingApi(offering.id);
      await loadOfferings();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend offering');
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    if (filteredOfferings.length === 0) return;
    const rows = filteredOfferings.map((offering, index) => [
      index + 1,
      `"${offering.title || ''}"`,
      offering.category,
      `"${offering.userProfile?.fullName || ''}"`,
      `"${offering.userProfile?.region?.name || ''}"`,
      offering.approvalStatus,
      offering.isActive ? 'ACTIVE' : 'INACTIVE',
      offering.ratePerDay || offering.ratePerHour || offering.ratePerAcre || '',
    ]);
    const csv = [
      'Row,Title,Category,Partner,Region,Approval,Active,Primary Rate',
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `partner_offerings_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {category === 'VEHICLE' ? 'Vehicle Partner Offerings' : category === 'LABOUR' ? 'Labour Partner Offerings' : 'Partner Custom Offerings'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Approve and manage custom services submitted from the seller/provider portal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-bold">
            {statusTabs.map((status) => (
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
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search offering or partner..." className="bg-transparent text-xs outline-none w-full" />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>
          <button onClick={exportCsv} className="h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={loadOfferings} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Partner Offering Approval Matrix</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{filteredOfferings.length} records</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold">Loading partner offerings...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-sm font-bold">{error}</div>
        ) : filteredOfferings.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm font-bold">No partner offerings match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-200">Offering</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Partner</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Rates</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOfferings.map((offering) => (
                  <tr key={offering.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 border-r border-slate-100">
                      <p className="font-bold text-slate-900">{offering.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{offering.description || 'No description provided'}</p>
                      <p className="text-[10px] font-black mt-1 text-emerald-700">{offering.category}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      <p className="font-bold text-slate-900">{offering.userProfile?.fullName || 'Partner'}</p>
                      <p className="text-[11px] text-slate-500">+91 {offering.userProfile?.account?.phoneNumber || ''}</p>
                      <p className="text-[11px] text-slate-400">{offering.userProfile?.region?.name || 'Region not set'}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono">
                      {offering.ratePerDay && <p>Rs {offering.ratePerDay}/day</p>}
                      {offering.ratePerHour && <p>Rs {offering.ratePerHour}/hr</p>}
                      {offering.ratePerAcre && <p>Rs {offering.ratePerAcre}/acre</p>}
                      {!offering.ratePerDay && !offering.ratePerHour && !offering.ratePerAcre && <p className="text-slate-400">Rate not set</p>}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        offering.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        offering.approvalStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        offering.approvalStatus === 'SUSPENDED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {offering.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => approve(offering.id, 'APPROVED')} disabled={savingId === offering.id} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => approve(offering.id, 'REJECTED')} disabled={savingId === offering.id} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                        <button onClick={() => startEdit(offering)} className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(offering)} className="p-1.5 bg-slate-100 rounded-lg text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Partner Offering</h3>
                <p className="text-xs text-slate-500">Update admin-visible details before approval</p>
              </div>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Offering title" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" rows={3} placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Vehicle type" />
                <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Vehicle number" />
              </div>
              <input value={form.servicesOffered} onChange={(e) => setForm({ ...form, servicesOffered: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Skills/services, comma separated" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={form.ratePerHour} onChange={(e) => setForm({ ...form, ratePerHour: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Rate/hr" />
                <input type="number" value={form.ratePerDay} onChange={(e) => setForm({ ...form, ratePerDay: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Rate/day" />
                <input type="number" value={form.ratePerAcre} onChange={(e) => setForm({ ...form, ratePerAcre: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Rate/acre" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100">Cancel</button>
                <button disabled={savingId === editing.id} type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
