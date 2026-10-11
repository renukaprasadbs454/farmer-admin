import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-5">
          <SearchX className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Page not found</h1>
        <p className="text-sm text-slate-500 mt-2">This admin route is not available. Use the dashboard navigation to continue.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/" className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Dashboard</Link>
          <Link to="/support" className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Support Desk</Link>
        </div>
      </div>
    </div>
  );
}
