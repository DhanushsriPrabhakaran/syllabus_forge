import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CourseType } from '@syllabusforge/shared';
import {
  FileText,
  PlusCircle,
  ShieldCheck,
  CheckSquare,
  LogOut,
  User as UserIcon,
  Layers,
  ChevronDown,
  Award,
  BookOpen,
  LayoutDashboard,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { TceLogo } from './TceLogo';

interface NavbarProps {
  onNewCourse?: (type: CourseType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewCourse }) => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTypeModal, setShowTypeModal] = useState(false);

  const handleSelectType = (type: CourseType) => {
    setShowTypeModal(false);
    if (onNewCourse) {
      onNewCourse(type);
    } else {
      navigate(`/courses/new?type=${type}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 shadow-md">
        {/* Top Utility Bar (Matches tce.edu top header) */}
        <div className="bg-[#091A2A] text-slate-300 px-4 sm:px-6 lg:px-8 py-1.5 text-xs border-b border-[#C59B27]/40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            {/* Left accreditation info */}
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="font-semibold text-[#E2BF53] flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-[#E2BF53]" />
                <span>NAAC 'A+' Grade</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="hidden sm:inline text-slate-300">Autonomous Institution Affiliated to Anna University</span>
              <span className="text-slate-500 hidden md:inline">•</span>
              <span className="hidden md:inline text-slate-300">Estd. 1957</span>
            </div>

            {/* Right: Quick Role Switcher Pill & Live User */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                <span className="text-slate-400 mr-1">Switch:</span>
                <button
                  onClick={() => quickLogin('FACULTY')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    user?.role === 'FACULTY' ? 'bg-[#7B1113] text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => quickLogin('HOD')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    user?.role === 'HOD' ? 'bg-[#C59B27] text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  HoD
                </button>
                <button
                  onClick={() => quickLogin('ADMIN')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    user?.role === 'ADMIN' ? 'bg-[#7B1113] text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              </div>

              {/* User Identity Chip */}
              {user && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-300 pl-2 border-l border-slate-700">
                  <span className="font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C59B27]/20 text-[#E2BF53] border border-[#C59B27]/40">
                    {user.role}
                  </span>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1 hover:text-rose-400 rounded transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Branding Header Bar (White / Ivory with TCE Logo) */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            {/* Official TCE Logo & App Identity */}
            <Link to="/" className="flex items-center group">
              <TceLogo variant="full" />
            </Link>

            {/* Right Action Bar */}
            <div className="flex items-center space-x-3">
              {/* Regulation Badge */}
              <div className="hidden lg:flex flex-col items-end text-right pr-3 border-r border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Curriculum Engine</span>
                <span className="text-xs font-bold text-[#7B1113] bg-[#7B1113]/10 px-2 py-0.5 rounded border border-[#7B1113]/20">
                  Regulation 2026 (OBE)
                </span>
              </div>

              {/* Create Syllabus Button (TCE Maroon with Gold Hover) */}
              <button
                onClick={() => setShowTypeModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#7B1113] hover:bg-[#560B0D] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all border border-[#C59B27]/30 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-[#E2BF53]" />
                <span>New Syllabus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Ribbon (TCE Maroon Bar with Gold Underline) */}
        <div className="bg-[#7B1113] text-white border-b-4 border-[#C59B27]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11">
            <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 ${
                  isActive('/')
                    ? 'bg-[#560B0D] text-[#E2BF53] shadow-inner font-bold'
                    : 'text-white/90 hover:bg-[#8B1E2D] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              {(user?.role === 'HOD' || user?.role === 'ADMIN') && (
                <Link
                  to="/reviews"
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 ${
                    isActive('/reviews')
                      ? 'bg-[#560B0D] text-[#E2BF53] shadow-inner font-bold'
                      : 'text-white/90 hover:bg-[#8B1E2D] hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#E2BF53]" />
                  <span>Review Queue</span>
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 ${
                    isActive('/admin')
                      ? 'bg-[#560B0D] text-[#E2BF53] shadow-inner font-bold'
                      : 'text-white/90 hover:bg-[#8B1E2D] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E2BF53]" />
                  <span>Admin & ACM</span>
                </Link>
              )}
            </nav>

            {/* Quick Link to official TCE website */}
            <a
              href="https://www.tce.edu/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1 text-[11px] font-medium text-white/80 hover:text-[#E2BF53] transition-colors"
            >
              <span>TCE Official Website</span>
              <ExternalLink className="w-3 h-3 text-[#E2BF53]" />
            </a>
          </div>
        </div>
      </header>

      {/* New Course Type Chooser Modal (TCE Academic Styling) */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border-t-4 border-[#7B1113] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#FAF7F2] p-5 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-[#7B1113] mb-1">
                <BookOpen className="w-5 h-5 text-[#C59B27]" />
                <h3 className="text-lg font-bold font-tce">Create New University Syllabus</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select the course delivery category for <strong>Regulation 2026</strong>. The wizard will automatically configure institutional guidelines, contact hours, TPS outcomes and assessment schemes.
              </p>
            </div>

            {/* Modal Options */}
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {/* 1. Theory */}
              <button
                onClick={() => handleSelectType('THEORY')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#7B1113] hover:bg-[#FAF2F3] transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#7B1113]/10 text-[#7B1113] flex items-center justify-center font-bold text-sm group-hover:bg-[#7B1113] group-hover:text-white transition-all flex-shrink-0">
                  TH
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#7B1113] text-sm">
                    1. Theory Course
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Classroom lecture & tutorial format (e.g., 3-1-0 or 3-0-0). 6–8 Course Outcomes, CATs + Assignments + Terminal Exam, modules and book recency checks.
                  </div>
                </div>
              </button>

              {/* 2. Practical */}
              <button
                onClick={() => handleSelectType('PRACTICAL')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#0F2942] hover:bg-[#F0F4F8] transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0F2942]/10 text-[#0F2942] flex items-center justify-center font-bold text-sm group-hover:bg-[#0F2942] group-hover:text-white transition-all flex-shrink-0">
                  PR
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#0F2942] text-sm">
                    2. Practical (Laboratory) Course
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    L=0, T=0, credits = P/2. General CO Pool (Cognitive, Affective, Psychomotor), 13 lab objectives, Schwab/Herron openness levels, Annexure 1 course plan.
                  </div>
                </div>
              </button>

              {/* 3. TCP */}
              <button
                onClick={() => handleSelectType('TCP')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#C59B27] hover:bg-[#FDF9EE] transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#C59B27]/15 text-[#9C7A1D] flex items-center justify-center font-bold text-sm group-hover:bg-[#C59B27] group-hover:text-white transition-all flex-shrink-0">
                  TCP
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#9C7A1D] text-sm">
                    3. Theory cum Practical (TCP)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Integrated lecture & laboratory contact hours. TCP-T or TCP-P examination type, split continuous assessment matrix, combined PO6–PO11 mapping.
                  </div>
                </div>
              </button>

              {/* 4. Audit Course */}
              <button
                onClick={() => handleSelectType('AUDIT')}
                className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm group-hover:bg-amber-700 group-hover:text-white transition-all flex-shrink-0">
                  AU
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-800 text-sm">
                    4. Audit Course (Zero Credit)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    No academic credits assigned (Credits: 0). Mandatory institutional non-CGPA courses evaluated exclusively via Continuous Assessment (CA).
                  </div>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
