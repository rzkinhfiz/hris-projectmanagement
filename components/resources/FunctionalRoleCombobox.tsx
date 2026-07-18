"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X, Plus, Loader2 } from "lucide-react";
import type { FunctionalRole } from "@/types";
import { getActiveFunctionalRoles, createFunctionalRole } from "@/services/resourceService";
import { useAuth } from "@/hooks/useAuth";

interface FunctionalRoleComboboxProps {
  value: string;
  onChange: (roleId: string, roleData: FunctionalRole) => void;
  disabled?: boolean;
}

export function FunctionalRoleCombobox({ value, onChange, disabled = false }: FunctionalRoleComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roles, setRoles] = useState<FunctionalRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  
  const canManageRoles = profile?.role === 'administrator' || profile?.role === 'pmo';

  useEffect(() => {
    async function loadRoles() {
      const { data } = await getActiveFunctionalRoles();
      if (data) setRoles(data);
      setLoading(false);
    }
    loadRoles();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const exactMatchExists = roles.some(role => role.name.toLowerCase() === search.toLowerCase());

  const handleCreateNewRole = async () => {
    if (!search.trim() || isCreating) return;
    setIsCreating(true);
    
    const { data, error } = await createFunctionalRole({
      name: search.trim(),
    });
    
    if (error) {
      alert("Gagal menambahkan peran baru: " + error.message);
      setIsCreating(false);
      return;
    }
    
    if (data) {
      setRoles(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.id, data);
      setSearch("");
      setIsOpen(false);
    }
    setIsCreating(false);
  };

  const selectedRole = roles.find(r => r.id === value || r.name === value);
  const displayValue = selectedRole ? selectedRole.name : (value || "Pilih peran...");

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center justify-between w-full bg-[#fcfbfa] border border-stone-200 rounded-2xl px-4 py-3 cursor-pointer transition ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:border-amber-300'} ${isOpen ? 'ring-2 ring-orange-100 border-amber-400' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${!selectedRole && !value ? 'text-stone-400' : 'text-stone-700 font-medium'}`}>
          {loading ? "Memuat..." : displayValue}
        </span>
        <ChevronDown size={18} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-[#fcfbfa] border border-stone-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-80">
          <div className="p-3 border-b border-stone-100 flex items-center gap-2 bg-white">
            <Search size={16} className="text-stone-400" />
            <input 
              type="text"
              className="w-full bg-transparent border-none outline-none text-sm text-stone-700 placeholder:text-stone-400"
              placeholder="Cari peran fungsional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <X size={16} className="text-stone-400 cursor-pointer hover:text-stone-600" onClick={() => setSearch('')} />
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            {filteredRoles.length > 0 && filteredRoles.map(role => (
              <div 
                key={role.id}
                className={`px-3 py-2.5 rounded-xl cursor-pointer text-sm flex flex-col transition ${
                  (selectedRole?.id === role.id) 
                    ? 'bg-orange-50 text-amber-900 font-semibold' 
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
                onClick={() => {
                  onChange(role.id, role);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <span>{role.name}</span>
                {role.department && (
                  <span className="text-[10px] text-stone-400 font-normal uppercase tracking-wider">{role.department}</span>
                )}
              </div>
            ))}
            
            {search.trim() && !exactMatchExists && canManageRoles && (
              <div 
                onClick={handleCreateNewRole}
                className="px-3 py-2.5 mt-1 rounded-xl cursor-pointer text-sm flex items-center gap-2 text-amber-700 hover:bg-orange-50 bg-orange-50/50 border border-orange-100 border-dashed transition"
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span className="font-medium">Tambah peran "{search}"</span>
              </div>
            )}
            
            {filteredRoles.length === 0 && (!search.trim() || !canManageRoles) ? (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-stone-500 font-medium mb-1">Peran tidak ditemukan.</p>
                {!canManageRoles && (
                  <p className="text-xs text-stone-400">Hubungi PMO untuk menambahkan peran baru.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
