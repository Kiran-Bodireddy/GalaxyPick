import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export const Header = ({ variant = 'default', onBack, showAbout = false }) => {
  const nav = useNavigate();
  const loc = useLocation();
  const showBack = variant === 'inner' && loc.pathname !== '/';

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {variant === 'default' && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-black">SAMSUNG</span>
            </div>
          )}
          <Link to="/" data-testid="brand-logo" className="flex items-center gap-1">
            <span className="text-lg font-extrabold tracking-tight text-black">Galaxy</span>
            <span className="text-lg font-extrabold tracking-tight text-[#1B4EFF]">Pick</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {showBack ? (
            <button
              data-testid="header-back-btn"
              onClick={() => (onBack ? onBack() : nav(-1))}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : showAbout ? (
            <button data-testid="about-btn" className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors">
              About GalaxyPick <HelpCircle className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
