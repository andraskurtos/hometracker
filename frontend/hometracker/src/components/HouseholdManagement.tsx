import { Home, Copy, Check, ArrowLeft, Users, Shield } from 'lucide-react';
import { useState } from 'react';
import type { Household } from '../services/householdService';

interface HouseholdManagementProps {
  household: Household;
  onBack: () => void;
}

export default function HouseholdManagement({ household, onBack }: HouseholdManagementProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(household.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors group w-fit"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Launchpad</span>
      </button>

      {/* Hero Section */}
      <div className="p-8 bg-neutral-900/40 border border-neutral-800/60 rounded-[2.5rem] backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-neutral-800 opacity-10">
          <Home size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Home size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-100">{household.name}</h1>
              <p className="text-neutral-500">{household.description || "No description provided"}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Shield size={12} /> {household.role.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-400">
              {household.base_currency}
            </span>
          </div>
        </div>
      </div>

      {/* Join Code Card */}
      <div className="p-8 bg-neutral-900/40 border border-neutral-800/60 rounded-3xl backdrop-blur-md">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Household Join Code</h3>
        <div className="flex items-center gap-4 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800">
          <code className="text-4xl font-mono font-bold tracking-widest text-emerald-400 flex-1">
            {household.join_code}
          </code>
          <button 
            onClick={copyToClipboard}
            className={`p-4 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'}`}
          >
            {copied ? <Check size={24} /> : <Copy size={24} />}
          </button>
        </div>
        <p className="text-sm text-neutral-500 mt-4 ml-1">
          Share this code with your roommates or family members so they can join this household.
        </p>
      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-neutral-900/40 border border-neutral-800/60 rounded-3xl backdrop-blur-md flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase font-semibold">Status</p>
            <p className="text-neutral-200">Active</p>
          </div>
        </div>
        <div className="p-6 bg-neutral-900/40 border border-neutral-800/60 rounded-3xl backdrop-blur-md flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase font-semibold">Joined At</p>
            <p className="text-neutral-200">{new Date(household.joined_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}