import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings, 
  Bell, 
  ClipboardList, 
  Search, 
  Plus, 
  MessageSquare,
  ChevronDown,
  Tractor,
  Store,
  Shield,
  CreditCard,
  Star,
  CheckSquare,
  CalendarRange,
  HardHat,
  Truck,
  Wrench,
  AlertOctagon,
  MapPin,
  LogOut,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserPlus,
  Sliders,
  BellOff
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import JobAssignment from './pages/JobAssignment';
import UsersListPage from './pages/UsersListPage';
import ProductApprovalsPage from './pages/ProductApprovalsPage';
import PaymentsPage from './pages/PaymentsPage';
import VehicleServicesPage from './pages/VehicleServicesPage';
import LabourServicesPage from './pages/LabourServicesPage';
import SupportDeskPage from './pages/SupportDeskPage';
import ProductOrdersPage from './pages/ProductOrdersPage';
import PartnerOfferingsPage from './pages/PartnerOfferingsPage';
import OperationsReviewPage from './pages/OperationsReviewPage';
import CompliancePage from './pages/CompliancePage';
import NotFoundPage from './pages/NotFoundPage';
import { 
  autoLoginAdmin, 
  loginAdminApi, 
  fetchRegions, 
  getAuthToken, 
  setAuthToken,
  createRegionApi,
  createAdminUserApi 
} from './services/api';

function Sidebar() {
  const location = useLocation();
  
  const menuSections = [
    {
      title: 'Users & Approvals',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Farmers', path: '/users/farmers', icon: Users },
        { name: 'Sellers', path: '/users/sellers', icon: Store },
        { name: 'Service Men', path: '/users/servicers', icon: Tractor },
        { name: 'Labours', path: '/users/labours', icon: HardHat },
        { name: 'Admin Users', path: '/users/admins', icon: Shield },
      ]
    },
    {
      title: 'Sales & Dispatch',
      items: [
        { name: 'Service Requests', path: '/sales/requests', icon: ClipboardList },
        { name: 'Product Orders', path: '/sales/orders', icon: ShoppingBag },
        { name: 'Payments', path: '/sales/payments', icon: CreditCard },
        { name: 'Job Issues & Proof', path: '/sales/issues', icon: AlertOctagon },
      ]
    },
    {
      title: 'Catalog & Settings',
      items: [
        { name: 'Vehicle Services', path: '/catalog/vehicles', icon: Truck },
        { name: 'Labour Services', path: '/catalog/labour', icon: Wrench },
        { name: 'Vehicle Offerings', path: '/catalog/vehicle-offerings', icon: Tractor },
        { name: 'Labour Offerings', path: '/catalog/labour-offerings', icon: HardHat },
        { name: 'Product Approvals', path: '/catalog/approvals', icon: CheckSquare },
        { name: 'Subscriptions', path: '/catalog/subscriptions', icon: CalendarRange },
      ]
    },
    {
      title: 'Community & Support',
      items: [
        { name: 'Reviews & Ratings', path: '/reviews', icon: Star },
        { name: 'Agri Help Desk', path: '/support', icon: MessageSquare },
      ]
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 pt-8 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">FARMER MATE</h1>
        <p className="text-xs text-slate-500 font-medium">Franchise Admin Portal</p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
                const isExactActive = location.pathname === item.path;
                const active = item.path === '/' ? isExactActive : isActive;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all text-sm font-semibold ${
                      active 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HeaderProps {
  regions: any[];
  selectedRegionId: string;
  setSelectedRegionId: (id: string) => void;
  onLogout: () => void;
  onRefreshRegions: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  path: string;
  unread: boolean;
  type: 'warning' | 'info' | 'success';
}

function Header({ 
  regions, 
  selectedRegionId, 
  setSelectedRegionId,
  onLogout,
  onRefreshRegions
}: HeaderProps) {
  const navigate = useNavigate();

  // Dropdown & Modal states
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchableModules = [
    { name: 'Dashboard & Platform Stats', path: '/', category: 'Overview', desc: 'Real-time platform statistics & live metrics' },
    { name: 'Farmers Registry', path: '/users/farmers', category: 'Users', desc: 'Auto-approved registered farmers' },
    { name: 'Agri Shop Sellers', path: '/users/sellers', category: 'Users', desc: 'Sellers and shops needing KYC approval' },
    { name: 'Service Providers & Machinery', path: '/users/servicers', category: 'Users', desc: 'Tractors, harvesters, drone sprayers' },
    { name: 'Labour Workforce & Skills', path: '/users/labours', category: 'Users', desc: 'Skilled agricultural labour teams' },
    { name: 'Admin Users & Franchise RBAC', path: '/users/admins', category: 'Users', desc: 'Franchise administrators and staff' },
    { name: 'Service Requests & Dispatch', path: '/sales/requests', category: 'Sales', desc: 'Dispatch and assign labour/machinery jobs' },
    { name: 'Product Orders & Transactions', path: '/sales/orders', category: 'Sales', desc: 'Orders, buying, and selling listings' },
    { name: 'Payments & Franchise Ledger', path: '/sales/payments', category: 'Finance', desc: 'Commission earnings and payments' },
    { name: 'Vehicle Services & Machinery Rates', path: '/catalog/vehicles', category: 'Catalog', desc: 'Create & manage machinery, tractor, and sprayer pricing' },
    { name: 'Labour Services & Wage Matrix', path: '/catalog/labour', category: 'Catalog', desc: 'Create & manage labour tasks, daily wages, and team sizes' },
    { name: 'Product Approvals & Catalog', path: '/catalog/approvals', category: 'Catalog', desc: 'Review seller catalog listings' },
    { name: 'Agri Help Desk & Support', path: '/support', category: 'Support', desc: 'Farmer issues and franchise tickets' },
    { name: 'Privacy Policy', path: '/privacy', category: 'Compliance', desc: 'Admin data access and privacy policy' },
    { name: 'Cookie & Data Use', path: '/cookie-policy', category: 'Compliance', desc: 'Admin portal session storage and browser data' },
    { name: 'Terms of Use', path: '/terms', category: 'Compliance', desc: 'Admin operating responsibilities and platform rules' },
    { name: 'Error Recovery', path: '/error', category: 'System', desc: 'Admin fallback and recovery guidance' },
  ];

  const searchResults = searchQuery.trim()
    ? searchableModules.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Pending Seller Approval',
      desc: 'Agri Shop "Cauvery Fertilizers" submitted business license for verification.',
      time: '4m ago',
      path: '/users/sellers',
      unread: true,
      type: 'warning',
    },
    {
      id: '2',
      title: 'New Service Job Request',
      desc: 'Anandarao Patil requested Harvesting & Threshing (4 workers) in Mandya.',
      time: '18m ago',
      path: '/sales/requests',
      unread: true,
      type: 'info',
    },
    {
      id: '3',
      title: 'Product Catalog Review',
      desc: '2 new fertilizer/seed items awaiting admin approval.',
      time: '1h ago',
      path: '/catalog/approvals',
      unread: true,
      type: 'info',
    },
    {
      id: '4',
      title: 'Gross Franchise Volume',
      desc: '₹23,300 total platform sales recorded across franchise regions.',
      time: '3h ago',
      path: '/sales/payments',
      unread: false,
      type: 'success',
    },
    {
      id: '5',
      title: 'System Diagnostics Healthy',
      desc: 'PostgreSQL (port 5439) & Redis (port 6389) active with zero downtime.',
      time: 'Today',
      path: '/',
      unread: false,
      type: 'success',
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    setShowNotifications(false);
    navigate(item.path);
  };

  // Add Region Form State
  const [regionForm, setRegionForm] = useState({
    name: '',
    state: 'Karnataka',
    district: '',
    pincodes: '',
    franchiseOwnerName: '',
    franchiseContact: '',
    commissionPercentage: '5.0',
  });
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [regionSuccess, setRegionSuccess] = useState<string | null>(null);

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegionLoading(true);
    setRegionError(null);
    setRegionSuccess(null);

    try {
      const pincodeArray = regionForm.pincodes
        ? regionForm.pincodes.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const res: any = await createRegionApi({
        name: regionForm.name.trim(),
        state: regionForm.state.trim(),
        district: regionForm.district.trim(),
        pincodes: pincodeArray,
        franchiseOwnerName: regionForm.franchiseOwnerName.trim() || undefined,
        franchiseContact: regionForm.franchiseContact.trim() || undefined,
        commissionPercentage: parseFloat(regionForm.commissionPercentage) || 5.0,
      });

      if (res?.success && res?.data?.id) {
        setRegionSuccess(`Region "${res.data.name}" added successfully!`);
        onRefreshRegions();
        setSelectedRegionId(res.data.id);
        setTimeout(() => {
          setShowAddRegionModal(false);
          setRegionSuccess(null);
          setRegionForm({
            name: '',
            state: 'Karnataka',
            district: '',
            pincodes: '',
            franchiseOwnerName: '',
            franchiseContact: '',
            commissionPercentage: '5.0',
          });
        }, 1200);
      } else {
        setRegionError(res?.message || 'Failed to create region');
      }
    } catch (err: any) {
      setRegionError(err.message || 'Error communicating with server');
    } finally {
      setRegionLoading(false);
    }
  };

  // Add Admin User Form State
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    phoneNumber: '',
    adminRole: 'FRANCHISE_ADMIN' as 'FRANCHISE_ADMIN' | 'MODERATOR',
    regionId: '',
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const res: any = await createAdminUserApi({
        fullName: adminForm.fullName.trim(),
        phoneNumber: adminForm.phoneNumber.trim().replace(/\D/g, ''),
        adminRole: adminForm.adminRole,
        regionId: adminForm.regionId || undefined,
      });

      if (res?.success) {
        setAdminSuccess(`Admin user "${adminForm.fullName}" registered!`);
        setTimeout(() => {
          setShowAddAdminModal(false);
          setAdminSuccess(null);
          setAdminForm({
            fullName: '',
            phoneNumber: '',
            adminRole: 'FRANCHISE_ADMIN',
            regionId: '',
          });
          navigate('/users/admins');
        }, 1200);
      } else {
        setAdminError(res?.message || 'Failed to register admin user');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error communicating with server');
    } finally {
      setAdminLoading(false);
    }
  };

  // Settings Modal State
  const [settingsTab, setSettingsTab] = useState<'rules' | 'system' | 'profile'>('rules');
  const [autoApproveFarmers, setAutoApproveFarmers] = useState(true);
  const [autoDispatchLabour, setAutoDispatchLabour] = useState(true);
  const [commissionRate, setCommissionRate] = useState('5.0');
  const [landUnit, setLandUnit] = useState('Acre / Guntha');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const handleSaveSettings = () => {
    setSettingsSavedToast(true);
    setTimeout(() => {
      setSettingsSavedToast(false);
      setShowSettings(false);
    }, 1200);
  };

  return (
    <>
      <header className="h-20 bg-[#F4F5F7] flex items-center justify-between px-8 sticky top-0 z-30">
        {/* Search Input with Live Dropdown */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex items-center w-full h-11 rounded-full bg-white border border-slate-200 px-4 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search across users, services, orders..." 
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Results Palette */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-13 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 py-2">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Modules & Pages
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.path}
                  onMouseDown={() => {
                    navigate(item.path);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* City / Region Selector Dropdown (Franchise Model) */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-400 uppercase">City Region:</span>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="">All Regions (Super Admin View)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.district})
                </option>
              ))}
            </select>
          </div>

          {/* + ADD Button with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowAddMenu(!showAddMenu);
                setShowNotifications(false);
                setShowDropdown(false);
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add
              <ChevronDown className={`w-4 h-4 opacity-70 ml-0.5 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
            </button>

            {showAddMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowAddMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowAddRegionModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Create Franchise Region</p>
                      <p className="text-[10px] text-slate-400 font-normal">Add new city or district coverage</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowAddAdminModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Register Admin / Staff</p>
                      <p className="text-[10px] text-slate-400 font-normal">Franchise admin & moderator access</p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      navigate('/sales/requests');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Assign Service Job</p>
                      <p className="text-[10px] text-slate-400 font-normal">Labour & machinery dispatch</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      navigate('/catalog/vehicles');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Vehicle & Machinery Service</p>
                      <p className="text-[10px] text-slate-400 font-normal">Add machine catalog & hourly/acre pricing</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      navigate('/catalog/labour');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Labour Service & Wage Matrix</p>
                      <p className="text-[10px] text-slate-400 font-normal">Define labour tasks & benchmark wages</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      navigate('/catalog/approvals');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Review Product Catalog</p>
                      <p className="text-[10px] text-slate-400 font-normal">Seller product approvals</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      navigate('/users/farmers');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-xs font-bold text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Farmers Registry</p>
                      <p className="text-[10px] text-slate-400 font-normal">View & manage registered farmers</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Action Icons: Bell & Settings */}
          <div className="flex items-center gap-2 ml-1">
            {/* Notification Bell Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowAddMenu(false);
                  setShowDropdown(false);
                }}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                  showNotifications 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-88 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-slate-500 hover:text-slate-900 font-bold transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                              n.unread ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'warning' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1" />
                              )}
                              {n.type === 'info' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1" />
                              )}
                              {n.type === 'success' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs ${n.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/sales/requests');
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        View All Platform Activity &rarr;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings Gear Button */}
            <button 
              onClick={() => {
                setShowSettings(true);
                setShowAddMenu(false);
                setShowNotifications(false);
                setShowDropdown(false);
              }}
              className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Profile & Logout Dropdown */}
          <div className="relative">
            <div 
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowAddMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 ml-3 pl-4 border-l border-slate-300 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                SA
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-slate-700">System Admin</p>
                <p className="text-[11px] font-medium text-slate-500">Superadmin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">System Super Admin</p>
                    <p className="text-[10px] text-slate-500">ID: admin &bull; +91 9999999999</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/users/admins');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Admin Staff & Roles
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSettings(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Franchise Settings
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout Admin Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MODAL: ADD FRANCHISE REGION ================= */}
      {showAddRegionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Franchise Region</h3>
                  <p className="text-xs text-slate-500">Expand Farmer Mate operations to a new district</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddRegionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRegion} className="p-6 space-y-4">
              {regionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {regionError}
                </div>
              )}
              {regionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {regionSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Region / City Name *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.name}
                    onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                    placeholder="e.g. Mysuru Central"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.district}
                    onChange={(e) => setRegionForm({ ...regionForm, district: e.target.value })}
                    placeholder="e.g. Mysuru"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.state}
                    onChange={(e) => setRegionForm({ ...regionForm, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={regionForm.commissionPercentage}
                    onChange={(e) => setRegionForm({ ...regionForm, commissionPercentage: e.target.value })}
                    placeholder="5.0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Postal Pincodes (Comma separated)</label>
                <input
                  type="text"
                  value={regionForm.pincodes}
                  onChange={(e) => setRegionForm({ ...regionForm, pincodes: e.target.value })}
                  placeholder="570001, 570002, 570003"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Franchise Owner</label>
                  <input
                    type="text"
                    value={regionForm.franchiseOwnerName}
                    onChange={(e) => setRegionForm({ ...regionForm, franchiseOwnerName: e.target.value })}
                    placeholder="Owner / Lead Partner"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Owner Contact Phone</label>
                  <input
                    type="text"
                    value={regionForm.franchiseContact}
                    onChange={(e) => setRegionForm({ ...regionForm, franchiseContact: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddRegionModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {regionLoading ? 'Creating Region...' : 'Save & Activate Region'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ADMIN / STAFF ================= */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Admin / Franchise Staff</h3>
                  <p className="text-xs text-slate-500">Provide staff dashboard access</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {adminError}
                </div>
              )}
              {adminSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {adminSuccess}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  placeholder="e.g. Suresh Patil"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  placeholder="e.g. 9845112233"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Admin Access Role *</label>
                <select
                  value={adminForm.adminRole}
                  onChange={(e: any) => setAdminForm({ ...adminForm, adminRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="FRANCHISE_ADMIN">FRANCHISE_ADMIN (Full Regional Ops & Approvals)</option>
                  <option value="MODERATOR">MODERATOR (Catalog & Verification Staff)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Assigned Region</label>
                <select
                  value={adminForm.regionId}
                  onChange={(e) => setAdminForm({ ...adminForm, regionId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Default Region / All Regions</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {adminLoading ? 'Registering...' : 'Register Admin User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FRANCHISE SETTINGS ================= */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Franchise & Platform Settings</h3>
                  <p className="text-xs text-slate-500">Configure global business logic & regional parameters</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Tabs */}
            <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/30 gap-6">
              <button
                onClick={() => setSettingsTab('rules')}
                className={`py-3 text-xs font-bold border-b-2 transition-all ${
                  settingsTab === 'rules' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Platform Rules
              </button>
              <button
                onClick={() => setSettingsTab('system')}
                className={`py-3 text-xs font-bold border-b-2 transition-all ${
                  settingsTab === 'system' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Database & API Status
              </button>
              <button
                onClick={() => setSettingsTab('profile')}
                className={`py-3 text-xs font-bold border-b-2 transition-all ${
                  settingsTab === 'profile' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Super Admin Security
              </button>
            </div>

            <div className="p-6">
              {settingsSavedToast && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Platform preferences updated successfully!
                </div>
              )}

              {settingsTab === 'rules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Auto-Approve Farmers</p>
                      <p className="text-[11px] text-slate-500">Farmers can list produce and book labour immediately after OTP verification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApproveFarmers(!autoApproveFarmers)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${autoApproveFarmers ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoApproveFarmers ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Auto-Dispatch Labour Requests</p>
                      <p className="text-[11px] text-slate-500">Automatically broadcast requests to available labour providers in the district</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoDispatchLabour(!autoDispatchLabour)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${autoDispatchLabour ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoDispatchLabour ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Franchise Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Standard Land Unit</label>
                      <select
                        value={landUnit}
                        onChange={(e) => setLandUnit(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                      >
                        <option value="Acre / Guntha">Acre / Guntha (South India)</option>
                        <option value="Bigha">Bigha (North/Central India)</option>
                        <option value="Hectare">Hectare (Standard metric)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'system' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        DB
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">PostgreSQL Relational Engine</p>
                        <p className="text-[11px] text-slate-500">Port 5439 &bull; Schema: public &bull; Connection Pool Active</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      CONNECTED
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                        RD
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Redis In-Memory Cache</p>
                        <p className="text-[11px] text-slate-500">Port 6389 &bull; Rate limiting & OTP verification store</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ONLINE
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        API
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Modular Express API Server</p>
                        <p className="text-[11px] text-slate-500">Port 9443 &bull; Version 1.0 &bull; CORS Allowed</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      HEALTHY
                    </span>
                  </div>
                </div>
              )}

              {settingsTab === 'profile' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Authenticated Super Admin</p>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p><span className="font-semibold text-slate-500">Username:</span> admin</p>
                      <p><span className="font-semibold text-slate-500">Primary Contact:</span> +91 9999999999</p>
                      <p><span className="font-semibold text-slate-500">Role:</span> SYSTEM SUPER_ADMIN (Level 1 Root Access)</p>
                      <p><span className="font-semibold text-slate-500">Default Region:</span> Mandya Central (Karnataka)</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    <p className="font-bold">Password Management:</p>
                    <p className="text-[11px] mt-0.5">Admin password is securely configured on the backend environment.</p>
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Save Platform Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(getAuthToken()));
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  
  // Login modal state
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await loginAdminApi(adminId, adminPassword);
      if (res?.token) {
        setIsAuthenticated(true);
        loadRegions();
      } else {
        setLoginError('Admin authorization failed');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fm_admin_token');
    setAuthToken('');
    setIsAuthenticated(false);
  };

  const loadRegions = () => {
    fetchRegions()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setRegions(res.data);
        }
      })
      .catch((err) => console.error('Failed to load regions:', err));
  };

  useEffect(() => {
    // Attempt auto login on mount
    autoLoginAdmin().then((res) => {
      if (res?.token) {
        setIsAuthenticated(true);
        loadRegions();
      }
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-200 shadow-xl p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto mb-6 shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 text-center tracking-tight">FARMER MATE</h1>
          <p className="text-xs text-slate-500 font-medium text-center mt-1">Super Admin & Franchise Login</p>

          {loginError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Admin ID / Username</label>
              <input 
                type="text" 
                value={adminId} 
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-slate-900" 
                placeholder="Enter Admin ID (e.g. admin)"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Admin Password</label>
              <input 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm outline-none focus:border-slate-900" 
                placeholder="Enter password"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-md mt-2"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Super Admin: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">admin</code> &bull; Pass: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Admin@123</code>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#F4F5F7] font-sans text-slate-900">
        <Sidebar />
        
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header 
            regions={regions} 
            selectedRegionId={selectedRegionId} 
            setSelectedRegionId={setSelectedRegionId} 
            onLogout={handleAdminLogout}
            onRefreshRegions={loadRegions}
          />
          
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              {/* Users & Approvals */}
              <Route path="/" element={<Dashboard selectedRegionId={selectedRegionId} />} />
              <Route 
                path="/users/farmers" 
                element={
                  <UsersListPage 
                    role="FARMER" 
                    title="Farmers Registry" 
                    subtitle="Farmers registered in the region (Auto-approved)" 
                    selectedRegionId={selectedRegionId} 
                  />
                } 
              />
              <Route 
                path="/users/sellers" 
                element={
                  <UsersListPage 
                    role="SELLER" 
                    title="Agri Shop Sellers (Needs Approval)" 
                    subtitle="Sellers and shops requiring admin review to go online" 
                    selectedRegionId={selectedRegionId} 
                  />
                } 
              />
              <Route 
                path="/users/servicers" 
                element={
                  <UsersListPage 
                    role="SERVICEMAN" 
                    title="Machinery & Service Providers (Needs Approval)" 
                    subtitle="Tractor, harvester, and drone sprayer providers" 
                    selectedRegionId={selectedRegionId} 
                  />
                } 
              />
              <Route 
                path="/users/labours" 
                element={
                  <UsersListPage 
                    role="LABOUR" 
                    title="Labour Workforce" 
                    subtitle="Agricultural labour teams and skill availability" 
                    selectedRegionId={selectedRegionId} 
                  />
                } 
              />
              <Route 
                path="/users/admins" 
                element={
                  <UsersListPage 
                    role="ADMIN" 
                    title="Franchise & Admin RBAC" 
                    subtitle="Regional franchise managers and system administrators" 
                    selectedRegionId={selectedRegionId} 
                  />
                } 
              />

              {/* Sales & Dispatch */}
              <Route path="/sales/requests" element={<JobAssignment selectedRegionId={selectedRegionId} />} />
              <Route path="/sales/orders" element={<ProductOrdersPage selectedRegionId={selectedRegionId} />} />
              <Route path="/sales/payments" element={<PaymentsPage selectedRegionId={selectedRegionId} />} />
              <Route path="/sales/issues" element={<OperationsReviewPage selectedRegionId={selectedRegionId} mode="ISSUES" />} />

              {/* Catalog & Settings */}
              <Route path="/catalog/vehicles" element={<VehicleServicesPage selectedRegionId={selectedRegionId} />} />
              <Route path="/catalog/labour" element={<LabourServicesPage selectedRegionId={selectedRegionId} />} />
              <Route path="/catalog/vehicle-offerings" element={<PartnerOfferingsPage selectedRegionId={selectedRegionId} category="VEHICLE" />} />
              <Route path="/catalog/labour-offerings" element={<PartnerOfferingsPage selectedRegionId={selectedRegionId} category="LABOUR" />} />
              <Route path="/catalog/approvals" element={<ProductApprovalsPage selectedRegionId={selectedRegionId} />} />
              <Route path="/catalog/subscriptions" element={<OperationsReviewPage selectedRegionId={selectedRegionId} mode="SUBSCRIPTIONS" />} />

              {/* Community & Support */}
              <Route path="/reviews" element={<OperationsReviewPage selectedRegionId={selectedRegionId} mode="REVIEWS" />} />
              <Route path="/support" element={<SupportDeskPage />} />
              <Route path="/privacy" element={<CompliancePage kind="privacy" />} />
              <Route path="/cookie-policy" element={<CompliancePage kind="cookie" />} />
              <Route path="/terms" element={<CompliancePage kind="terms" />} />
              <Route path="/error" element={<CompliancePage kind="error" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
