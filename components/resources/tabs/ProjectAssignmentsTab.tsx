import React, { useEffect, useState } from "react";
import { Briefcase, UserPlus, Trash2 } from "lucide-react";
import type { Profile, Project } from "@/types";
import { getAllAssignmentsWithDetails, getTeamMembers, createResourceAllocation } from "@/services/resourceService";
import { removeMemberFromProject } from "@/services/projectResourceService";
import { getProjects } from "@/services/projectService";
import { FunctionalRoleCombobox } from "@/components/resources/FunctionalRoleCombobox";

interface EnhancedAllocation {
  id: string;
  project_id: string;
  user_id: string;
  functional_role: string;
  workload_share: string | null;
  is_active?: boolean;
  profile?: Profile | null;
  project?: Project | null;
}

interface ProjectAssignmentsTabProps {
  profile: Profile;
}

export function ProjectAssignmentsTab({ profile }: ProjectAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<EnhancedAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  
  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [workload, setWorkload] = useState("Full-time");

  // Offboard states
  const [offboardModalOpen, setOffboardModalOpen] = useState(false);
  const [allocationToOffboard, setAllocationToOffboard] = useState<any>(null);

  const canManage = profile.role === 'pmo' || profile.role === 'administrator' || profile.role === 'project_manager';

  const loadData = async () => {
    setLoading(true);
    const { data } = await getAllAssignmentsWithDetails();
    if (data) setAssignments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = async () => {
    setIsSubmitting(true);
    const [projRes, memRes] = await Promise.all([
      getProjects(profile.id, profile.role),
      getTeamMembers()
    ]);
    if (projRes.data) setProjects(projRes.data.filter(p => p.status !== 'Canceled' && p.status !== 'Completed'));
    if (memRes.data) setMembers(memRes.data.filter(m => m.status !== 'INACTIVE'));
    
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedUserId || !selectedRole) return;
    
    setIsSubmitting(true);
    const { error } = await createResourceAllocation({
      project_id: selectedProjectId,
      user_id: selectedUserId,
      functional_role: selectedRole,
      workload_share: workload,
      is_active: true
    }, { performerId: profile.id });

    setIsSubmitting(false);
    
    if (error) {
      alert("Failed to assign member: " + error.message);
    } else {
      setShowModal(false);
      setSelectedProjectId("");
      setSelectedUserId("");
      setSelectedRole("");
      setWorkload("Full-time");
      await loadData();
    }
  };

  const confirmOffboard = async () => {
    if (!allocationToOffboard) return;
    setIsSubmitting(true);
    
    const { success, error } = await removeMemberFromProject(
      allocationToOffboard.id,
      allocationToOffboard.project_id,
      allocationToOffboard.user_id,
      { performerId: profile.id }
    );

    setIsSubmitting(false);

    if (!success) {
      alert("Failed to offboard member: " + (error?.message || "Unknown error"));
    } else {
      setOffboardModalOpen(false);
      setAllocationToOffboard(null);
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Loading assignments...</div>;
  }

  // Group assignments by project
  const grouped = assignments.reduce((acc, curr) => {
    const projName = curr.project?.name || "Unknown Project";
    if (!acc[projName]) acc[projName] = [];
    acc[projName].push(curr);
    return acc;
  }, {} as Record<string, EnhancedAllocation[]>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Project Assignments</h3>
          <p className="text-sm text-stone-500">Manage who is working on what project.</p>
        </div>
        {canManage && (
          <button 
            onClick={openAssignModal}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition disabled:opacity-50"
          >
            <UserPlus size={16} /> Assign Member
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50">
            <Briefcase size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-stone-500 font-medium">No active assignments found.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([projectName, allocs]) => (
            <div key={projectName} className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-stone-50 px-5 py-3 border-b border-stone-200">
                <h4 className="font-bold text-stone-800">{projectName}</h4>
              </div>
              <table className="w-full text-left bg-white">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Consultant</th>
                    <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Role</th>
                    <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Workload</th>
                    {canManage && <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {(allocs as EnhancedAllocation[]).map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-stone-50/50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-stone-800 text-sm">{alloc.profile?.full_name || 'Unknown'}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">
                        {alloc.functional_role}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">
                        {alloc.workload_share || '-'}
                      </td>
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setAllocationToOffboard(alloc);
                              setOffboardModalOpen(true);
                            }}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Offboard Member"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* Assign Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold text-stone-800">Assign Member to Project</h3>
            <form onSubmit={handleAssign} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Project *</label>
                <select 
                  required
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className={`w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${!selectedProjectId ? 'text-stone-500 font-medium' : 'text-stone-900 font-semibold'}`}
                >
                  <option value="" disabled>Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Consultant *</label>
                <select 
                  required
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className={`w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${!selectedUserId ? 'text-stone-500 font-medium' : 'text-stone-900 font-semibold'}`}
                >
                  <option value="" disabled>Select Team Member...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.role.replace('_',' ')})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Functional Role *</label>
                <FunctionalRoleCombobox 
                  value={selectedRole}
                  onChange={(_, roleData) => setSelectedRole(roleData.name)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Workload Share *</label>
                <select 
                  required
                  value={workload}
                  onChange={e => setWorkload(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="Full-time">Full-time (100%)</option>
                  <option value="Half-time">Half-time (50%)</option>
                  <option value="Quarter-time">Quarter-time (25%)</option>
                  <option value="As-needed">As Needed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-stone-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !selectedRole}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 shadow-lg shadow-amber-200"
                >
                  {isSubmitting ? 'Saving...' : 'Assign Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offboard Member Modal */}
      {offboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold text-stone-800">Offboard Member</h3>
            <p className="text-stone-600 text-sm">
              Are you sure you want to remove <span className="font-bold text-stone-900">{allocationToOffboard?.profile?.full_name}</span> from <span className="font-bold text-stone-900">{allocationToOffboard?.project?.name}</span>? 
            </p>
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-100 mt-2">
              <strong>Smart Removal Logic:</strong> If this member has already logged hours for this project, they will be archived (soft-delete) instead of permanently deleted, preserving time logs and governance history.
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => setOffboardModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-stone-600 font-medium hover:bg-stone-50 border border-stone-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmOffboard}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition shadow-lg shadow-rose-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Yes, Offboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
