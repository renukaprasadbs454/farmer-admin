import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  Coins,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  fetchCropCommodities,
  createCropCommodityApi,
  updateCropPriceApi,
  fetchInvestAdminOverviewApi
} from '../services/api';

export default function CropInvestPage() {
  const [commodities, setCommodities] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({
    totalTrades: 0,
    totalInvestedAmount: 0,
    currentPortfolioValuation: 0,
    totalRealizedFarmerProfits: 0,
    tradableCropsCount: 0,
  });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedCropForPrice, setSelectedCropForPrice] = useState<any | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [priceRemark, setPriceRemark] = useState<string>('');
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New crop state
  const [newCrop, setNewCrop] = useState({
    cropName: '',
    category: 'Vegetables',
    variety: '',
    unit: 'Quintal',
    currentPrice: '1500',
    minInvestmentUnits: '1',
    maxInvestmentUnits: '100',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cropsRes, overviewRes] = await Promise.all([
        fetchCropCommodities(categoryFilter, searchQuery),
        fetchInvestAdminOverviewApi()
      ]);
      setCommodities(cropsRes.data || []);
      if (overviewRes.overview) {
        setOverview(overviewRes.overview);
      }
      if (overviewRes.recentTrades) {
        setRecentTrades(overviewRes.recentTrades);
      }
    } catch (err) {
      console.error('Failed to load crop invest data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenPriceModal = (crop: any) => {
    setSelectedCropForPrice(crop);
    setNewPriceInput(String(crop.currentPrice));
    setPriceRemark('APMC Mandi spot auction adjustment');
  };

  const handlePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropForPrice) return;
    const priceNum = parseFloat(newPriceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setActionLoading(true);
    try {
      await updateCropPriceApi(selectedCropForPrice.id, priceNum, priceRemark);
      setSelectedCropForPrice(null);
      loadData();
      alert(`Spot price for ${selectedCropForPrice.cropName} updated to ₹${priceNum}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createCropCommodityApi({
        ...newCrop,
        currentPrice: parseFloat(newCrop.currentPrice),
        minInvestmentUnits: parseFloat(newCrop.minInvestmentUnits),
        maxInvestmentUnits: parseFloat(newCrop.maxInvestmentUnits),
      });
      setShowAddCropModal(false);
      loadData();
      alert('Tradable crop commodity listed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create crop');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-amber-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/30 backdrop-blur-md rounded-full text-xs font-semibold text-amber-200 mb-3 border border-amber-400/30">
            <Coins className="w-3.5 h-3.5" /> Mandi Commodity Trading & Price Control Desk
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Crop Investment & Stock Market</h1>
          <p className="text-amber-100/90 text-sm leading-relaxed">
            Create tradable agricultural commodities, set spot prices (e.g. Onion from ₹10 to ₹30), and monitor farmer investments and realized gains.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tradable Commodities</span>
          <div className="text-2xl font-black text-slate-900">{overview.tradableCropsCount || commodities.length}</div>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> High Liquidity Crops
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Farmer Investment</span>
          <div className="text-2xl font-black text-slate-900 font-mono">₹{overview.totalInvestedAmount?.toLocaleString()}</div>
          <span className="text-xs text-slate-500 font-semibold mt-1 inline-flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> Capital Deployed
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Portfolio Valuation</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">₹{overview.currentPortfolioValuation?.toLocaleString()}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Spot Mandi Value
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Realized Farmer Profits</span>
          <div className="text-2xl font-black text-blue-700 font-mono">₹{overview.totalRealizedFarmerProfits?.toLocaleString()}</div>
          <span className="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Wealth Created
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-slate-900">Live Crop Mandi Prices</h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Live APMC Sync</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop..."
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 shadow-sm w-40"
            />
          </form>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <option value="ALL">All Crop Categories</option>
            <option value="Vegetables">Vegetables (Onion, Tomato, Potato)</option>
            <option value="Grains">Grains (Wheat, Paddy, Maize)</option>
            <option value="Cash Crops">Cash Crops (Cotton, Sugarcane)</option>
            <option value="Spices">Spices & Oilseeds (Chilli, Soyabean)</option>
          </select>

          <button
            onClick={() => setShowAddCropModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Tradable Crop
          </button>

          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tradable Crop Commodity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {commodities.map((crop) => {
          const isPositive = crop.changePercent >= 0;
          return (
            <div
              key={crop.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {crop.category}
                  </span>
                  <div className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
                    isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{crop.changePercent}%
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-lg mb-0.5 leading-snug">{crop.cropName}</h3>
                <p className="text-xs text-slate-400 font-medium mb-4">{crop.variety || 'Standard Mandi Grade'}</p>

                {/* Spot Price Display */}
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Spot Market Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">₹{crop.currentPrice?.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ {crop.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Day High</span>
                      <span className="font-bold text-slate-700 font-mono">₹{crop.dayHigh?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Day Low</span>
                      <span className="font-bold text-slate-700 font-mono">₹{crop.dayLow?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {crop.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{crop.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-semibold">
                  {crop._count?.investments || 0} Open Positions
                </span>
                <button
                  onClick={() => handleOpenPriceModal(crop)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Spot Price
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Farmer Trading Desk / Activity */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Farmer Trading Desk (Positions & Trades)</h2>
          <span className="text-xs text-slate-400 font-semibold">{recentTrades.length} Recorded Trades</span>
        </div>

        {recentTrades.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
            No farmer investments placed yet. When farmers buy crop units in the mobile app, trades will show here.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Farmer / Phone</th>
                    <th className="px-6 py-4">Crop Commodity</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Buy Price</th>
                    <th className="px-6 py-4">Current Value</th>
                    <th className="px-6 py-4">Gain / Loss</th>
                    <th className="px-6 py-4">Position Status</th>
                    <th className="px-6 py-4">Trade Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTrades.map((trade) => {
                    const isHolding = trade.status === 'HOLDING';
                    const liveValue = isHolding
                      ? trade.unitsPurchased * (trade.commodity?.currentPrice || trade.unitPriceAtBuy)
                      : trade.currentValue;
                    const pnl = isHolding
                      ? liveValue - trade.totalInvestedAmount
                      : trade.realizedProfitLoss || 0;
                    const isProfitable = pnl >= 0;

                    return (
                      <tr key={trade.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{trade.farmerName}</div>
                          <div className="text-xs text-slate-400 font-mono">{trade.farmerPhone}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {trade.cropName}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {trade.unitsPurchased} {trade.commodity?.unit || 'Units'}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          ₹{trade.unitPriceAtBuy?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          ₹{liveValue?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          <span className={`inline-flex items-center gap-1 ${
                            isProfitable ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isProfitable ? '+' : ''}₹{pnl?.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                            isHolding ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isHolding ? 'Holding Active' : 'Sold & Settled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Spot Price Modal */}
      {selectedCropForPrice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Update Spot Market Price</h3>
                <p className="text-xs text-slate-400">{selectedCropForPrice.cropName}</p>
              </div>
              <button onClick={() => setSelectedCropForPrice(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePriceUpdate} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 uppercase font-bold">Current Price:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedCropForPrice.currentPrice} / {selectedCropForPrice.unit}</span>
                </div>
                {newPriceInput && !isNaN(parseFloat(newPriceInput)) && (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                    <span className="text-slate-400 uppercase font-bold">Calculated Price Shift:</span>
                    <span className={`font-mono font-bold ${
                      parseFloat(newPriceInput) >= selectedCropForPrice.currentPrice ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {parseFloat(newPriceInput) >= selectedCropForPrice.currentPrice ? '+' : ''}
                      {(
                        ((parseFloat(newPriceInput) - selectedCropForPrice.currentPrice) /
                          selectedCropForPrice.currentPrice) *
                        100
                      ).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Spot Price (₹ per {selectedCropForPrice.unit}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. 2400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandi / Market Remark</label>
                <input
                  type="text"
                  value={priceRemark}
                  onChange={(e) => setPriceRemark(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="e.g. Lasalgaon Mandi peak supply constraint"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Note: Updating this spot price immediately recalculates portfolio returns for all farmers currently invested in {selectedCropForPrice.cropName}.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCropForPrice(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Publish New Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Tradable Crop Modal */}
      {showAddCropModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">List New Tradable Crop Commodity</h3>
              <button onClick={() => setShowAddCropModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Crop Commodity Name *</label>
                <input
                  type="text"
                  required
                  value={newCrop.cropName}
                  onChange={(e) => setNewCrop({ ...newCrop, cropName: e.target.value })}
                  placeholder="e.g. Nashik Red Onion (Mandi Grade A)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCrop.category}
                    onChange={(e) => setNewCrop({ ...newCrop, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Grains">Grains</option>
                    <option value="Cash Crops">Cash Crops</option>
                    <option value="Spices">Spices & Oilseeds</option>
                    <option value="Pulses">Pulses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Variety / Grade</label>
                  <input
                    type="text"
                    value={newCrop.variety}
                    onChange={(e) => setNewCrop({ ...newCrop, variety: e.target.value })}
                    placeholder="e.g. Gavran Red / Grade A"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trading Unit *</label>
                  <select
                    value={newCrop.unit}
                    onChange={(e) => setNewCrop({ ...newCrop, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Quintal">Quintal (100 kg)</option>
                    <option value="Kg">Kg</option>
                    <option value="50kg Bag">50kg Bag</option>
                    <option value="Metric Ton">Metric Ton</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Spot Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newCrop.currentPrice}
                    onChange={(e) => setNewCrop({ ...newCrop, currentPrice: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Units</label>
                  <input
                    type="number"
                    value={newCrop.minInvestmentUnits}
                    onChange={(e) => setNewCrop({ ...newCrop, minInvestmentUnits: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Order Units</label>
                  <input
                    type="number"
                    value={newCrop.maxInvestmentUnits}
                    onChange={(e) => setNewCrop({ ...newCrop, maxInvestmentUnits: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Market Description</label>
                <textarea
                  rows={2}
                  value={newCrop.description}
                  onChange={(e) => setNewCrop({ ...newCrop, description: e.target.value })}
                  placeholder="e.g. Traded in primary APMC yards with strong seasonal price volatility..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCropModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Listing...' : 'List on Market'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
