import React, { useEffect, useState, useMemo } from "react";
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Profile, ResourceAllocation } from "@/types";
import { getAllResourceAllocations, getTeamMembers } from "@/services/resourceService";

interface CapacityUtilizationTabProps {
  profile: Profile;
}

interface ConsultantCapacity {
  profile: Profile;
  allocations: ResourceAllocation[];
  totalPercentage: number;
}

export function CapacityUtilizationTab({ profile }: CapacityUtilizationTabProps) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [membersRes, allocRes] = await Promise.all([
        getTeamMembers(),
        getAllResourceAllocations()
      ]);
      if (membersRes.data) setMembers(membersRes.data.filter(m => m.status !== 'INACTIVE'));
      if (allocRes.data) setAllocations(allocRes.data.filter(a => a.is_active !== false));
      setLoading(false);
    }
    loadData();
  }, []);

  const capacities = useMemo(() => {
    const map = new Map<string, ConsultantCapacity>();
    
    members.forEach(member => {
      map.set(member.id, {
        profile: member,
        allocations: [],
        totalPercentage: 0
      });
    });

    allocations.forEach(alloc => {
      if (map.has(alloc.user_id)) {
        const cap = map.get(alloc.user_id)!;
        cap.allocations.push(alloc);
        
        let percentage = 0;
        const share = alloc.workload_share?.toLowerCase() || '';
        if (share.includes('full')) percentage = 100;
        else if (share.includes('half')) percentage = 50;
        else if (share.includes('quarter')) percentage = 25;
        else if (share.includes('%')) {
          const num = parseInt(share.replace(/[^0-9]/g, ''));
          if (!isNaN(num)) percentage = num;
        } else if (share.includes('as-needed')) percentage = 10;
        
        cap.totalPercentage += percentage;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalPercentage - a.totalPercentage);
  }, [members, allocations]);

  const totalConsultants = capacities.length;
  const availableConsultants = capacities.filter(c => c.totalPercentage < 50).length;
  const optimalConsultants = capacities.filter(c => c.totalPercentage >= 50 && c.totalPercentage <= 100).length;
  const overAllocatedConsultants = capacities.filter(c => c.totalPercentage > 100).length;

  const benchRate = totalConsultants > 0 ? Math.round((availableConsultants / totalConsultants) * 100) : 0;

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Loading capacity data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
            <Users size={16} /> Total Consultants
          </div>
          <div className="text-3xl font-bold text-amber-950">{totalConsultants}</div>
        </div>
        
        <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-900 font-medium text-sm">
            <TrendingUp size={16} /> Available (Bench Rate)
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-sky-950">{benchRate}%</div>
            <div className="text-sm text-sky-700">{availableConsultants} members</div>
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-900 font-medium text-sm">
            <CheckCircle2 size={16} /> Optimal Allocation
          </div>
          <div className="text-3xl font-bold text-emerald-950">{optimalConsultants}</div>
        </div>
        
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-rose-900 font-medium text-sm">
            <AlertTriangle size={16} /> Over-Allocated Alerts
          </div>
          <div className="text-3xl font-bold text-rose-950">{overAllocatedConsultants}</div>
        </div>
      </div>

      {/* Utilization Matrix Table */}
      <div className="mt-4">
        <h3 className="text-lg font-bold text-stone-800 mb-4">Utilization Matrix</h3>
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="p-4 text-sm font-semibold text-stone-600">Consultant Name</th>
                <th className="p-4 text-sm font-semibold text-stone-600">Role Type</th>
                <th className="p-4 text-sm font-semibold text-stone-600">Active Projects</th>
                <th className="p-4 text-sm font-semibold text-stone-600">Total Capacity</th>
                <th className="p-4 text-sm font-semibold text-stone-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {capacities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-500">
                    No data available.
                  </td>
                </tr>
              ) : (
                capacities.map(cap => {
                  let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  let statusText = "Optimal";
                  
                  if (cap.totalPercentage < 50) {
                    badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
                    statusText = "Available";
                  } else if (cap.totalPercentage > 100) {
                    badgeClass = "bg-rose-100 text-rose-800 font-bold border-rose-200";
                    statusText = "Overload";
                  } else if (cap.totalPercentage >= 80) {
                    badgeClass = "bg-amber-100 text-amber-900 border-amber-200";
                    statusText = "Heavy";
                  }

                  return (
                    <tr key={cap.profile.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-stone-800">{cap.profile.full_name || 'Unnamed'}</div>
                        <div className="text-xs text-stone-500">{cap.profile.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium">
                          {cap.profile.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-stone-600">
                        {cap.allocations.length} project(s)
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full max-w-[120px] bg-stone-100 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${cap.totalPercentage > 100 ? 'bg-rose-500' : cap.totalPercentage >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${Math.min(cap.totalPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-stone-700">{cap.totalPercentage}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${badgeClass}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
