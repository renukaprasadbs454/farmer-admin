import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Wrench, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchLabourJobs, fetchUsersBySegment, assignLabourToJobApi } from '../services/api';

export default function JobAssignment({ selectedRegionId }: { selectedRegionId?: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const loadJobsAndLabours = async () => {
    setLoading(true);
    try {
      // 1. Fetch live jobs from backend
      const jobsRes = await fetchLabourJobs(selectedRegionId);
      if (jobsRes.success) {
        setJobs(jobsRes.data);
      }

      // 2. Fetch live registered labours from backend
      const laboursRes = await fetchUsersBySegment('LABOUR', 'ALL', selectedRegionId);
      if (laboursRes.success) {
        setLabours(laboursRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load jobs and labours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobsAndLabours();
  }, [selectedRegionId]);

  const pendingJobs = jobs.filter((req) => req.status === 'PENDING');
  const selectedJob = jobs.find((req) => req.id === selectedJobId);

  const handleAssign = async (labourProfileId: string) => {
    if (!selectedJobId) return;
    try {
      await assignLabourToJobApi(selectedJobId, labourProfileId);
      setSelectedJobId(null);
      loadJobsAndLabours();
    } catch (err: any) {
      alert(err.message || 'Failed to assign labour');
    }
  };

  return (
    <div className="flex h-full gap-6 max-w-[1200px] mx-auto pb-12">
      {/* Requests List */}
      <div className="w-1/3 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Labour Jobs</h2>
            <p className="text-xs text-slate-500">{pendingJobs.length} farmers waiting for assignment</p>
          </div>
          <button 
            onClick={loadJobsAndLabours}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {pendingJobs.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedJobId(req.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedJobId === req.id 
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                  : 'border-slate-100 hover:border-slate-300 bg-white text-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm">{req.farmerProfile?.userProfile?.fullName || 'Farmer'}</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedJobId === req.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {req.id.substring(0, 8)}
                </span>
              </div>
              <div className="space-y-1 text-xs opacity-90">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Wrench className="w-3.5 h-3.5" />
                  {req.serviceTitle} ({req.workersNeeded} Workers)
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {req.region?.name || 'Pune'} City
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(req.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {pendingJobs.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No pending labour requests.
            </div>
          )}
        </div>
      </div>

      {/* Assignment Panel */}
      <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {selectedJob ? (
          <>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Dispatch Labour Assignment</h2>
              <p className="text-xs text-slate-500">
                Select an available registered labour team for {selectedJob.farmerProfile?.userProfile?.fullName}'s request.
              </p>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
                Registered Labour Workforce
                <span className="text-xs font-normal text-slate-500">({labours.length} available)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {labours.map((labour) => (
                  <div key={labour.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{labour.fullName}</h4>
                          <p className="text-xs text-slate-500">+91 {labour.account?.phoneNumber}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          ₹{labour.labourProfile?.dailyRate || 500}/day
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-slate-600 font-semibold mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {labour.labourProfile?.servicesOffered?.map((skill: string) => (
                            <span key={skill} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAssign(labour.labourProfile?.id)}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-full text-xs font-bold transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Dispatch Assignment
                    </button>
                  </div>
                ))}
                
                {labours.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No registered labours found in this city region.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Search className="w-12 h-12 mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700 mb-1">Select a Pending Job Request</h3>
            <p className="text-xs text-slate-500 max-w-sm">Choose a farmer's request from the left list to assign labour workers and dispatch the job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
