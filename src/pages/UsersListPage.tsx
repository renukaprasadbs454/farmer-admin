import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Store, 
  Tractor, 
  HardHat, 
  Shield, 
  MapPin, 
  Phone, 
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit3,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  approveUserStatus,
  deleteUserProfileApi,
  fetchUsersBySegment,
  restoreUserProfileApi,
  updateUserProfileApi,
} from '../services/api';

interface UsersListPageProps {
  role: 'FARMER' | 'SELLER' | 'SERVICEMAN' | 'LABOUR' | 'ADMIN';
  title: string;
  subtitle: string;
  selectedRegionId?: string;
}

export default function UsersListPage({ role, title, subtitle, selectedRegionId }: UsersListPageProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsersBySegment(role, approvalFilter, selectedRegionId, true);
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, approvalFilter, selectedRegionId]);

  const handleApproval = async (profileId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setActionLoadingId(profileId);
    try {
      await approveUserStatus(profileId, status);
      await loadData();
      if (selectedUser?.id === profileId) {
        setSelectedUser((prev: any) => prev ? { ...prev, approvalStatus: status } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user approval status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      address: user.address || '',
      state: user.state || user.farmerProfile?.state || '',
      district: user.district || user.farmerProfile?.district || '',
      taluk: user.taluk || user.farmerProfile?.taluk || '',
      village: user.village || user.farmerProfile?.village || '',
      pincode: user.pincode || user.farmerProfile?.pincode || '',
      shopName: user.sellerProfile?.shopName || '',
      shopAddress: user.sellerProfile?.shopAddress || '',
      gstNumber: user.sellerProfile?.gstNumber || '',
      licenseNumber: user.sellerProfile?.licenseNumber || '',
      deliveryRadiusKm: user.sellerProfile?.deliveryRadiusKm ? String(user.sellerProfile.deliveryRadiusKm) : '',
      vehicleType: user.servicemanProfile?.vehicleType || '',
      vehicleNumber: user.servicemanProfile?.vehicleNumber || '',
      ratePerHour: user.servicemanProfile?.ratePerHour ? String(user.servicemanProfile.ratePerHour) : user.labourProfile?.hourlyRate ? String(user.labourProfile.hourlyRate) : '',
      ratePerAcre: user.servicemanProfile?.ratePerAcre ? String(user.servicemanProfile.ratePerAcre) : '',
      dailyRate: user.labourProfile?.dailyRate ? String(user.labourProfile.dailyRate) : '',
      servicesOffered: user.labourProfile?.servicesOffered?.join(', ') || '',
    });
  };

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    setActionLoadingId(editingUser.id);
    try {
      const payload: Record<string, any> = {
        fullName: editForm.fullName,
        address: editForm.address,
        state: editForm.state,
        district: editForm.district,
        taluk: editForm.taluk,
        village: editForm.village,
        pincode: editForm.pincode,
      };

      if (role === 'SELLER') {
        payload.sellerProfile = {
          shopName: editForm.shopName,
          shopAddress: editForm.shopAddress,
          gstNumber: editForm.gstNumber,
          licenseNumber: editForm.licenseNumber,
          deliveryRadiusKm: editForm.deliveryRadiusKm,
        };
      }
      if (role === 'SERVICEMAN') {
        payload.servicemanProfile = {
          vehicleType: editForm.vehicleType,
          vehicleNumber: editForm.vehicleNumber,
          ratePerHour: editForm.ratePerHour,
          ratePerAcre: editForm.ratePerAcre,
        };
      }
      if (role === 'LABOUR') {
        payload.labourProfile = {
          servicesOffered: editForm.servicesOffered.split(',').map((item) => item.trim()).filter(Boolean),
          dailyRate: editForm.dailyRate,
          hourlyRate: editForm.ratePerHour,
        };
      }

      await updateUserProfileApi(editingUser.id, payload);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user profile');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (user: any) => {
    if (!confirm(`Deactivate ${user.fullName}'s ${role.toLowerCase()} profile?`)) return;
    setActionLoadingId(user.id);
    try {
      await deleteUserProfileApi(user.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user profile');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (user: any) => {
    setActionLoadingId(user.id);
    try {
      await restoreUserProfileApi(user.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to restore user profile');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'SELLER': return Store;
      case 'SERVICEMAN': return Tractor;
      case 'LABOUR': return HardHat;
      case 'ADMIN': return Shield;
      default: return Users;
    }
  };

  const IconComponent = getRoleIcon();

  // Filter & Search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const nameMatch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = u.account?.phoneNumber?.includes(searchTerm);
      const addressMatch = u.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const regionMatch = u.region?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Role specific search
      let roleMatch = false;
      if (role === 'FARMER' && u.farmerProfile) {
        roleMatch = u.farmerProfile.primaryCrops?.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()));
      } else if (role === 'SELLER' && u.sellerProfile) {
        roleMatch = u.sellerProfile.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.sellerProfile.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (role === 'SERVICEMAN' && u.servicemanProfile) {
        roleMatch = u.servicemanProfile.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.servicemanProfile.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (role === 'LABOUR' && u.labourProfile) {
        roleMatch = u.labourProfile.servicesOffered?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      return nameMatch || phoneMatch || addressMatch || regionMatch || roleMatch;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'name') {
        aVal = a.fullName;
        bVal = b.fullName;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [users, searchTerm, sortField, sortOrder, role]);

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (filteredUsers.length === 0) return;

    let headers = ['Row ID', 'Full Name', 'Phone Number', 'Region', 'Address', 'Status', 'Registration Date'];

    if (role === 'FARMER') {
      headers.push(
        'Total Land',
        'Cultivated Land',
        'Land Unit',
        'State',
        'District',
        'Taluk',
        'Hobli',
        'Village',
        'Pincode',
        'GPS Latitude',
        'GPS Longitude',
        'Water Sources',
        'Has Borewell',
        'Borewell Depth (ft)',
        'Animals & Livestock',
        'Farming Vehicles',
        'Soil Type',
        'Soil pH',
        'Soil Tested',
        'Primary Crops'
      );
    } else if (role === 'SELLER') {
      headers.push('Shop Name', 'GSTIN', 'Shop Address');
    } else if (role === 'SERVICEMAN') {
      headers.push('Vehicle Type', 'Registration Number', 'Hourly Rate', 'Acreage Rate');
    } else if (role === 'LABOUR') {
      headers.push('Services Offered', 'Daily Rate', 'Hourly Rate', 'Experience (Years)');
    } else if (role === 'ADMIN') {
      headers.push('Admin Role');
    }

    const rows = filteredUsers.map((u, idx) => {
      const base = [
        idx + 1,
        `"${u.fullName || ''}"`,
        `"+91 ${u.account?.phoneNumber || ''}"`,
        `"${u.region?.name || ''}"`,
        `"${u.address || ''}"`,
        u.approvalStatus,
        `"${new Date(u.createdAt).toLocaleDateString()}"`,
      ];

      if (role === 'FARMER') {
        const fp = u.farmerProfile || {};
        const animalsStr = Array.isArray(fp.animals)
          ? fp.animals.map((a: any) => `${a.type || a.label || ''}:${a.count || 0}`).join('; ')
          : typeof fp.animals === 'object' && fp.animals
          ? Object.entries(fp.animals).map(([k, v]) => `${k}:${v}`).join('; ')
          : '';

        base.push(
          fp.totalLandArea || fp.landAreaAcres || 0,
          fp.cultivatedLandArea || 0,
          `"${fp.landUnit || 'acres'}"`,
          `"${fp.state || u.state || ''}"`,
          `"${fp.district || u.district || ''}"`,
          `"${fp.taluk || u.taluk || ''}"`,
          `"${fp.hobli || u.hobli || ''}"`,
          `"${fp.village || u.village || ''}"`,
          `"${fp.pincode || u.pincode || ''}"`,
          u.latitude || '',
          u.longitude || '',
          `"${fp.waterSources?.join('; ') || ''}"`,
          fp.hasBorewell ? 'Yes' : 'No',
          fp.borewellDepth || '',
          `"${animalsStr}"`,
          `"${fp.vehicles?.join('; ') || ''}"`,
          `"${fp.soilType || ''}"`,
          `"${fp.soilPh || ''}"`,
          fp.soilTested ? 'Yes' : 'No',
          `"${fp.primaryCrops?.join('; ') || ''}"`
        );
      } else if (role === 'SELLER') {
        base.push(
          `"${u.sellerProfile?.shopName || ''}"`,
          `"${u.sellerProfile?.gstNumber || 'N/A'}"`,
          `"${u.sellerProfile?.shopAddress || ''}"`
        );
      } else if (role === 'SERVICEMAN') {
        base.push(
          `"${u.servicemanProfile?.vehicleType || ''}"`,
          `"${u.servicemanProfile?.vehicleNumber || ''}"`,
          u.servicemanProfile?.ratePerHour || 0,
          u.servicemanProfile?.ratePerAcre || 0
        );
      } else if (role === 'LABOUR') {
        base.push(
          `"${u.labourProfile?.servicesOffered?.join('; ') || ''}"`,
          u.labourProfile?.dailyRate || 0,
          u.labourProfile?.hourlyRate || 0,
          u.labourProfile?.experienceYears || 0
        );
      } else if (role === 'ADMIN') {
        base.push(u.adminProfile?.adminRole || 'ADMIN');
      }

      return base.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${role.toLowerCase()}_users_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = users.filter((u) => u.approvalStatus === 'PENDING').length;
  const approvedCount = users.filter((u) => u.approvalStatus === 'APPROVED').length;

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {filteredUsers.length} records
                </span>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                    {pendingCount} pending review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-bold">
            {[
              { id: 'ALL', label: 'All Users', count: users.length },
              { id: 'PENDING', label: 'Pending', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'REJECTED', label: 'Rejected', count: users.filter(u => u.approvalStatus === 'REJECTED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setApprovalFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  approvalFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  approvalFilter === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center h-9 bg-white border border-slate-200 rounded-xl px-3 shadow-sm w-56 focus-within:w-64 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search in ${role.toLowerCase()}s...`}
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

          {/* Export to Excel / CSV */}
          <button
            onClick={exportToCSV}
            className="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Download Excel / CSV sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button 
            onClick={loadData}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Database Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Excel Spreadsheet Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 min-h-[360px]">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading {title} from PostgreSQL...</p>
            <p className="text-xs text-slate-400 mt-1">Querying database relations and active profile tables</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="font-bold text-sm">Failed to load user database</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 min-h-[300px] flex flex-col items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No {role.toLowerCase()} records match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try changing the status tab, region selection, or clearing your search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200/70">#</th>
                  <th 
                    onClick={() => toggleSort('name')}
                    className="py-3.5 px-4 border-r border-slate-200/70 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    User & Contact {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200/70">Region & Location</th>

                  {/* Role Specific Column Headers */}
                  {role === 'FARMER' && (
                    <>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Land Holdings</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Water & Borewell</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Soil & Crops</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Machinery & Livestock</th>
                    </>
                  )}

                  {role === 'SELLER' && (
                    <>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Shop Name</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">GST Number</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Catalog Items</th>
                    </>
                  )}

                  {role === 'SERVICEMAN' && (
                    <>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Machinery / Vehicle</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Registration No.</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Hourly Rate</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Acreage Rate</th>
                    </>
                  )}

                  {role === 'LABOUR' && (
                    <>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Services & Skills</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Daily Wage</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Hourly Wage</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Experience</th>
                    </>
                  )}

                  {role === 'ADMIN' && (
                    <>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Access Level</th>
                      <th className="py-3.5 px-4 border-r border-slate-200/70">Assigned District</th>
                    </>
                  )}

                  <th className="py-3.5 px-4 border-r border-slate-200/70">Approval Status</th>
                  <th 
                    onClick={() => toggleSort('createdAt')}
                    className="py-3.5 px-4 border-r border-slate-200/70 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Created Date {sortField === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3.5 px-4 text-center">Manage / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredUsers.map((user, idx) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/90 transition-colors group border-b border-slate-100"
                  >
                    {/* Row Index */}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* Name & Phone */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {user.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-slate-400" /> +91 {user.account?.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div>
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          {[user.farmerProfile?.village || user.village, user.farmerProfile?.taluk || user.taluk, user.farmerProfile?.district || user.district || user.region?.name].filter(Boolean).join(', ') || 'All Regions'}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                          {user.address || 'Market Center'}
                        </p>
                        {user.latitude && user.longitude && (
                          <span className="inline-block mt-0.5 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            GPS: {Number(user.latitude).toFixed(3)}, {Number(user.longitude).toFixed(3)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role Specific Fields */}
                    {role === 'FARMER' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100">
                          <div>
                            <span className="text-slate-900 font-extrabold">
                              {user.farmerProfile?.totalLandArea || user.farmerProfile?.landAreaAcres || 0} {user.farmerProfile?.landUnit || 'Acres'}
                            </span>
                            <p className="text-[10px] text-emerald-700 font-semibold">
                              {user.farmerProfile?.cultivatedLandArea || 0} Cultivated
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div>
                            {user.farmerProfile?.hasBorewell ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                💧 Bore ({user.farmerProfile.borewellDepth ? `${user.farmerProfile.borewellDepth}ft` : 'Active'})
                              </span>
                            ) : null}
                            <p className="text-[11px] text-slate-600 mt-0.5 truncate max-w-[150px]">
                              {user.farmerProfile?.waterSources?.length ? user.farmerProfile.waterSources.join(', ') : 'Rainfed'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">
                              {user.farmerProfile?.soilType || 'Normal Soil'}
                              {user.farmerProfile?.soilTested && <span className="ml-1 text-[10px] text-emerald-600 font-black">✓ Tested</span>}
                            </p>
                            <div className="flex flex-wrap gap-1 max-w-[200px] mt-1">
                              {user.farmerProfile?.primaryCrops?.length ? (
                                user.farmerProfile.primaryCrops.slice(0, 3).map((crop: string) => (
                                  <span key={crop} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {crop}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px]">No crops listed</span>
                              )}
                              {(user.farmerProfile?.primaryCrops?.length || 0) > 3 && (
                                <span className="text-[10px] text-slate-500 font-bold">+{user.farmerProfile.primaryCrops.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {user.farmerProfile?.vehicles?.map((v: string) => (
                              <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                🚜 {v}
                              </span>
                            ))}
                            {Array.isArray(user.farmerProfile?.animals) && user.farmerProfile.animals.filter((a: any) => a.count > 0).map((a: any) => (
                              <span key={a.type || a.label} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                🐄 {a.count} {a.label || a.type}
                              </span>
                            ))}
                            {!user.farmerProfile?.vehicles?.length && (!user.farmerProfile?.animals || (Array.isArray(user.farmerProfile.animals) && user.farmerProfile.animals.length === 0)) && (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {role === 'SELLER' && (
                      <>
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                          {user.sellerProfile?.shopName || 'Commercial Agri Agency'}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                          {user.sellerProfile?.gstNumber ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                              {user.sellerProfile.gstNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600">
                          <span className="font-bold text-slate-900">
                            {user.sellerProfile?.products?.length || 0}
                          </span> products online
                        </td>
                      </>
                    )}

                    {role === 'SERVICEMAN' && (
                      <>
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                          {user.servicemanProfile?.vehicleType || 'Tractor Unit'}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px] text-slate-700">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-bold">
                            {user.servicemanProfile?.vehicleNumber || 'MH-12-XX-0000'}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-black text-slate-900">
                          ₹{user.servicemanProfile?.ratePerHour || 0}/hr
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-emerald-700">
                          ₹{user.servicemanProfile?.ratePerAcre || 0}/acre
                        </td>
                      </>
                    )}

                    {role === 'LABOUR' && (
                      <>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {user.labourProfile?.servicesOffered?.map((srv: string) => (
                              <span key={srv} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {srv}
                              </span>
                            )) || <span className="text-slate-400">General Labour</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-black text-slate-900">
                          ₹{user.labourProfile?.dailyRate || 500}/day
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600 font-bold">
                          ₹{user.labourProfile?.hourlyRate || 80}/hr
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-700 font-semibold">
                          {user.labourProfile?.experienceYears || 1} Yrs Experience
                        </td>
                      </>
                    )}

                    {role === 'ADMIN' && (
                      <>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {user.adminProfile?.adminRole || 'FRANCHISE_ADMIN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-semibold text-slate-700">
                          {user.region?.name || 'All Franchise Regions'}
                        </td>
                      </>
                    )}

                    {/* Status Pill */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        user.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        user.approvalStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                        user.approvalStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.approvalStatus === 'APPROVED' ? 'bg-emerald-500' :
                          user.approvalStatus === 'PENDING' ? 'bg-amber-500' :
                          user.approvalStatus === 'REJECTED' ? 'bg-red-500' :
                          'bg-slate-400'
                        }`} />
                        {user.approvalStatus}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono border-r border-slate-100">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Instant Quick Approval Buttons for Pending Sellers/Servicemen */}
                        {user.isActive !== false && user.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproval(user.id, 'APPROVED')}
                              disabled={actionLoadingId === user.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
                              title="Approve User"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleApproval(user.id, 'REJECTED')}
                              disabled={actionLoadingId === user.id}
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                              title="Reject User"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                          title="View Full Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Details
                        </button>

                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoadingId === user.id || user.isActive === false}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                          title="Edit profile"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                        </button>

                        {user.isActive !== false && user.approvalStatus === 'REJECTED' && (
                          <button
                            onClick={() => handleApproval(user.id, 'APPROVED')}
                            disabled={actionLoadingId === user.id}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Re-approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Re-Approve
                          </button>
                        )}

                        {user.isActive === false ? (
                          <button
                            onClick={() => handleRestore(user)}
                            disabled={actionLoadingId === user.id}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Restore profile"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(user)}
                            disabled={actionLoadingId === user.id}
                            className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Deactivate profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Showing <b>{filteredUsers.length}</b> of <b>{users.length}</b> users</span>
            <span>&bull;</span>
            <span>Region Filter: <b>{selectedRegionId ? 'Filtered Region' : 'All Regions'}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">PostgreSQL Engine Connected</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* ================= USER DETAILS / KYC DRAWER MODAL ================= */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedUser.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">+91 {selectedUser.account?.phoneNumber} &bull; {role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Approval Status</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black uppercase ${
                    selectedUser.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    selectedUser.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.approvalStatus}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Franchise Region</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{selectedUser.region?.name || 'Central'} District</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Address</p>
                <p className="text-xs text-slate-700 font-medium">{selectedUser.address || 'Address not provided'}</p>
              </div>

              {/* Specific Profile Details */}
              {role === 'FARMER' && selectedUser.farmerProfile && (
                <div className="space-y-3">
                  {/* Administrative & GPS Location */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Administrative & GPS Location
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                      <p><b>State:</b> {selectedUser.farmerProfile.state || selectedUser.state || 'Karnataka'}</p>
                      <p><b>District:</b> {selectedUser.farmerProfile.district || selectedUser.district || selectedUser.region?.name || 'N/A'}</p>
                      <p><b>Taluk:</b> {selectedUser.farmerProfile.taluk || selectedUser.taluk || 'N/A'}</p>
                      <p><b>Hobli:</b> {selectedUser.farmerProfile.hobli || selectedUser.hobli || 'N/A'}</p>
                      <p><b>Village:</b> {selectedUser.farmerProfile.village || selectedUser.village || 'N/A'}</p>
                      <p><b>Pincode:</b> {selectedUser.farmerProfile.pincode || selectedUser.pincode || 'N/A'}</p>
                    </div>
                    {selectedUser.latitude && selectedUser.longitude && (
                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-emerald-800 font-bold">
                          GPS: {Number(selectedUser.latitude).toFixed(4)}, {Number(selectedUser.longitude).toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedUser.latitude},${selectedUser.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] hover:bg-emerald-200 transition-colors"
                        >
                          Google Maps ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Land & Water Resources */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                    <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">📐 Land & Water Resources</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-800">
                      <p>
                        <b>Total Land:</b> {selectedUser.farmerProfile.totalLandArea || selectedUser.farmerProfile.landAreaAcres || 0} {selectedUser.farmerProfile.landUnit || 'Acres'}
                      </p>
                      <p>
                        <b>Cultivated Land:</b> {selectedUser.farmerProfile.cultivatedLandArea || 0} {selectedUser.farmerProfile.landUnit || 'Acres'}
                      </p>
                      <p>
                        <b>Borewell:</b>{' '}
                        {selectedUser.farmerProfile.hasBorewell
                          ? `Yes (${selectedUser.farmerProfile.borewellDepth ? `${selectedUser.farmerProfile.borewellDepth} ft` : 'Active'})`
                          : 'No Borewell'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-600 mb-1">Water Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.farmerProfile.waterSources?.length ? (
                          selectedUser.farmerProfile.waterSources.map((ws: string) => (
                            <span key={ws} className="px-2 py-0.5 bg-white text-cyan-800 rounded border border-cyan-200 text-xs font-bold">
                              💧 {ws}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Rainfed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Livestock & Farming Vehicles */}
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                    <p className="text-xs font-black text-amber-950 uppercase tracking-wide">🚜 Machinery & Livestock Holdings</p>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[11px] font-bold text-slate-600 mb-1">Vehicles & Equipment:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.farmerProfile.vehicles?.length ? (
                            selectedUser.farmerProfile.vehicles.map((v: string) => (
                              <span key={v} className="px-2 py-0.5 bg-white text-amber-900 rounded border border-amber-200 text-xs font-bold">
                                🚜 {v}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No machinery registered</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-600 mb-1">Livestock / Animals:</p>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(selectedUser.farmerProfile.animals) && selectedUser.farmerProfile.animals.filter((a: any) => a.count > 0).length ? (
                            selectedUser.farmerProfile.animals.filter((a: any) => a.count > 0).map((a: any) => (
                              <span key={a.type || a.label} className="px-2 py-0.5 bg-white text-purple-900 rounded border border-purple-200 text-xs font-bold">
                                🐄 {a.count} {a.label || a.type}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No livestock reported</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agronomy & Soil Details */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">🌱 Agronomy & Soil Testing</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-800">
                      <p><b>Soil Type:</b> {selectedUser.farmerProfile.soilType || 'N/A'}</p>
                      <p><b>Soil pH:</b> {selectedUser.farmerProfile.soilPh || 'Not tested'}</p>
                      <p>
                        <b>Soil Tested:</b>{' '}
                        {selectedUser.farmerProfile.soilTested ? (
                          <span className="text-emerald-700 font-black">✓ Certified Lab Tested</span>
                        ) : (
                          <span className="text-slate-500">Not Tested</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-600 mb-1">Crops Cultivated:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.farmerProfile.primaryCrops?.length ? (
                          selectedUser.farmerProfile.primaryCrops.map((c: string) => (
                            <span key={c} className="px-2 py-0.5 bg-white text-emerald-800 rounded border border-emerald-200 text-xs font-bold">
                              🌾 {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No crops added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'SELLER' && selectedUser.sellerProfile && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                  <p className="text-xs font-bold text-blue-900 uppercase">Shop & Commercial Profile</p>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><b>Registered Shop:</b> {selectedUser.sellerProfile.shopName}</p>
                    <p><b>GSTIN:</b> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200">{selectedUser.sellerProfile.gstNumber || 'Not Registered'}</span></p>
                    <p><b>Premises Address:</b> {selectedUser.sellerProfile.shopAddress}</p>
                    <p><b>Active Catalog Items:</b> {selectedUser.sellerProfile.products?.length || 0} products listed</p>
                  </div>
                </div>
              )}

              {role === 'SERVICEMAN' && selectedUser.servicemanProfile && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                  <p className="text-xs font-bold text-amber-900 uppercase">Machinery & Rates</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <p><b>Vehicle Type:</b> {selectedUser.servicemanProfile.vehicleType}</p>
                    <p><b>Plate Number:</b> <span className="font-mono font-bold">{selectedUser.servicemanProfile.vehicleNumber}</span></p>
                    <p><b>Hourly Rate:</b> ₹{selectedUser.servicemanProfile.ratePerHour}/hr</p>
                    <p><b>Acre Rate:</b> ₹{selectedUser.servicemanProfile.ratePerAcre}/acre</p>
                  </div>
                </div>
              )}

              {role === 'LABOUR' && selectedUser.labourProfile && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                  <p className="text-xs font-bold text-purple-900 uppercase">Workforce & Wages</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <p><b>Daily Rate:</b> ₹{selectedUser.labourProfile.dailyRate}/day</p>
                    <p><b>Hourly Rate:</b> ₹{selectedUser.labourProfile.hourlyRate}/hr</p>
                    <p><b>Experience:</b> {selectedUser.labourProfile.experienceYears} Years</p>
                    <p><b>Rating:</b> ⭐ {selectedUser.labourProfile.rating || 5.0}/5</p>
                  </div>
                </div>
              )}

              {/* Status Management Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Change User Status:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(selectedUser.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Set Approved
                  </button>
                  <button
                    onClick={() => handleApproval(selectedUser.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Set Rejected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit {role.toLowerCase()} profile</h3>
                <p className="text-xs text-slate-500">Updates are saved to the live backend profile tables</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Full Name" value={editForm.fullName} onChange={(value) => setEditForm({ ...editForm, fullName: value })} required />
                <Field label="Pincode" value={editForm.pincode} onChange={(value) => setEditForm({ ...editForm, pincode: value })} />
                <Field label="State" value={editForm.state} onChange={(value) => setEditForm({ ...editForm, state: value })} />
                <Field label="District" value={editForm.district} onChange={(value) => setEditForm({ ...editForm, district: value })} />
                <Field label="Taluk" value={editForm.taluk} onChange={(value) => setEditForm({ ...editForm, taluk: value })} />
                <Field label="Village" value={editForm.village} onChange={(value) => setEditForm({ ...editForm, village: value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Address</label>
                <textarea
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              {role === 'SELLER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Field label="Shop Name" value={editForm.shopName} onChange={(value) => setEditForm({ ...editForm, shopName: value })} />
                  <Field label="Shop Address" value={editForm.shopAddress} onChange={(value) => setEditForm({ ...editForm, shopAddress: value })} />
                  <Field label="GST Number" value={editForm.gstNumber} onChange={(value) => setEditForm({ ...editForm, gstNumber: value })} />
                  <Field label="License Number" value={editForm.licenseNumber} onChange={(value) => setEditForm({ ...editForm, licenseNumber: value })} />
                  <Field label="Delivery Radius Km" value={editForm.deliveryRadiusKm} onChange={(value) => setEditForm({ ...editForm, deliveryRadiusKm: value })} type="number" />
                </div>
              )}

              {role === 'SERVICEMAN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Field label="Vehicle Type" value={editForm.vehicleType} onChange={(value) => setEditForm({ ...editForm, vehicleType: value })} />
                  <Field label="Vehicle Number" value={editForm.vehicleNumber} onChange={(value) => setEditForm({ ...editForm, vehicleNumber: value })} />
                  <Field label="Rate Per Hour" value={editForm.ratePerHour} onChange={(value) => setEditForm({ ...editForm, ratePerHour: value })} type="number" />
                  <Field label="Rate Per Acre" value={editForm.ratePerAcre} onChange={(value) => setEditForm({ ...editForm, ratePerAcre: value })} type="number" />
                </div>
              )}

              {role === 'LABOUR' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Field label="Services Offered" value={editForm.servicesOffered} onChange={(value) => setEditForm({ ...editForm, servicesOffered: value })} />
                  <Field label="Daily Rate" value={editForm.dailyRate} onChange={(value) => setEditForm({ ...editForm, dailyRate: value })} type="number" />
                  <Field label="Hourly Rate" value={editForm.ratePerHour} onChange={(value) => setEditForm({ ...editForm, ratePerHour: value })} type="number" />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === editingUser.id}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoadingId === editingUser.id ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
      />
    </div>
  );
}
