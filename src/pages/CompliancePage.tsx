import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';

type PageKind = 'privacy' | 'cookie' | 'terms' | 'error';

const copy: Record<PageKind, { title: string; subtitle: string; sections: { title: string; body: string }[] }> = {
  privacy: {
    title: 'Admin Privacy Policy',
    subtitle: 'How Farmer Mate admin handles user, seller, provider and marketplace data.',
    sections: [
      { title: 'Data access', body: 'Admins can view farmer, seller, labour, machinery, product, order, payment and support data only for operational control and assigned region responsibilities.' },
      { title: 'Location and address data', body: 'State, district, taluk, village, pincode and GPS coordinates are used for zone routing, assignment, fraud checks and marketplace support.' },
      { title: 'Operational controls', body: 'Approval, suspension, edits and assignment actions are restricted by RBAC and region scope where applicable.' },
    ],
  },
  cookie: {
    title: 'Cookie & Data Use',
    subtitle: 'Admin portal session and device-storage policy.',
    sections: [
      { title: 'Session storage', body: 'The portal stores the admin JWT in browser local storage under fm_admin_token so the dashboard remains signed in between refreshes.' },
      { title: 'Local preferences', body: 'Region filters, search terms and modal state are UI-only preferences unless explicitly submitted to backend APIs.' },
      { title: 'Security', body: 'Sign out clears the admin token. Production deployments should use HTTPS and a strict CORS_ORIGINS allowlist.' },
    ],
  },
  terms: {
    title: 'Admin Terms of Use',
    subtitle: 'Operational responsibilities for platform control.',
    sections: [
      { title: 'Marketplace control', body: 'Admins approve products, manage service catalogs, review partner offerings and keep pricing and fulfilment consistent with platform rules.' },
      { title: 'RBAC', body: 'Super Admin has global control. Zone or franchise admins operate only inside assigned zones unless backend permissions are expanded.' },
      { title: 'Audit discipline', body: 'Admin actions should be used only for verified business operations, dispute resolution, support and compliance.' },
    ],
  },
  error: {
    title: 'Admin Error Recovery',
    subtitle: 'Safe fallback if an admin workflow fails.',
    sections: [
      { title: 'Immediate recovery', body: 'Refresh the module, verify the backend health endpoint, and retry the action once. Avoid repeating payment or approval actions blindly.' },
      { title: 'Data safety', body: 'The portal writes through backend APIs and database constraints. If a request fails, check the module list before re-submitting.' },
      { title: 'Support path', body: 'Use Support Desk for farmer conversations and keep operational disputes inside admin-managed records.' },
    ],
  },
};

export default function CompliancePage({ kind }: { kind: PageKind }) {
  const page = copy[kind];
  const Icon = kind === 'error' ? AlertTriangle : kind === 'privacy' ? ShieldCheck : FileText;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{page.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{page.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          {page.sections.map((section) => (
            <section key={section.title} className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <h2 className="text-sm font-black text-slate-900">{section.title}</h2>
              <p className="text-sm text-slate-600 leading-6 mt-2">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
          <Link to="/" className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Dashboard</Link>
          <Link to="/support" className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Support Desk</Link>
        </div>
      </div>
    </div>
  );
}
