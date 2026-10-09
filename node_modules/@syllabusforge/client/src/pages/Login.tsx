import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Mail, ArrowRight, Shield, UserCheck, BookOpen, Award } from 'lucide-react';
import { TceLogo } from '../components/TceLogo';

export const Login: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'FACULTY' | 'HOD' | 'ADMIN') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D0709] via-[#7B1113] to-[#091A2A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0F2942]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl relative z-10 border-t-4 border-[#C59B27]">
        {/* TCE Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <TceLogo variant="full" />
          </div>
          <div className="mt-2 text-xs font-bold text-[#7B1113] uppercase tracking-wider bg-[#FAF7F2] py-1 px-3 rounded-full inline-block border border-[#C59B27]/40">
            Regulation 2026 Curriculum Portal
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Outcome Based Education (OBE) & Syllabus Formulation Engine
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="faculty@tce.edu"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#7B1113] focus:border-[#7B1113]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#7B1113] focus:border-[#7B1113]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#7B1113] hover:bg-[#560B0D] text-white font-bold text-xs shadow-md shadow-[#7B1113]/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-[#C59B27]/40"
          >
            <span>{loading ? 'Authenticating with TCE...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4 text-[#E2BF53]" />
          </button>
        </form>

        {/* Demo Personas */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Institutional Personas (One-Click Sign In)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuick('FACULTY')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-[#7B1113] hover:bg-[#FAF2F3] text-center transition-all group"
            >
              <BookOpen className="w-4 h-4 text-[#7B1113] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 block">Faculty</span>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Sharmila</span>
            </button>

            <button
              onClick={() => handleQuick('HOD')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0F2942] hover:bg-[#F0F4F8] text-center transition-all group"
            >
              <UserCheck className="w-4 h-4 text-[#0F2942] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 block">HoD</span>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Suresh</span>
            </button>

            <button
              onClick={() => handleQuick('ADMIN')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-[#C59B27] hover:bg-[#FDF9EE] text-center transition-all group"
            >
              <Shield className="w-4 h-4 text-[#9C7A1D] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 block">Admin</span>
              <span className="text-[10px] text-slate-400 block truncate">Dean (Academics)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
