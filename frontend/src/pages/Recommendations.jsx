import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, GitCompareArrows } from 'lucide-react';
import { Header } from '../components/Header';
import { useGalaxy } from '../context/GalaxyContext';
import { useSaved } from '../hooks/useSaved';

const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function Recommendations() {
  const nav = useNavigate();
  const { recommendations, fetchRecommendations, userName, needs, budget, persona } = useGalaxy();
  const { toggle, isSaved } = useSaved();

  useEffect(() => {
    if (!recommendations || recommendations.length === 0) fetchRecommendations();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header variant="inner" />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 fade-up">
            <div className="sticky top-24">
              <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-black leading-tight">
                {userName}, here are your <span className="text-[#1B4EFF]">perfect matches!</span> <span>✨</span>
              </h3>
              <p className="text-sm text-gray-500 mt-3">Based on your needs and preferences.</p>
              <div className="mt-6 space-y-3">
                {needs.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Needs</div>
                    <div className="text-sm text-black">{needs.map(n => n.replace('_', ' ')).join(', ')}</div>
                  </div>
                )}
                {budget && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Budget</div>
                    <div className="text-sm text-black">Under ₹{budget.toLocaleString('en-IN')}</div>
                  </div>
                )}
                {persona && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Persona</div>
                    <div className="text-sm text-black capitalize">{persona.replace('_', ' ')}</div>
                  </div>
                )}
              </div>
              <button
                data-testid="compare-all-btn"
                onClick={() => nav(`/compare?ids=${recommendations.slice(0, 3).map(p => p.id).join(',')}`)}
                disabled={recommendations.length === 0}
                className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#1B4EFF] hover:text-[#1428A0] disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <GitCompareArrows className="w-4 h-4" /> Compare All
              </button>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recommendations.map((p, i) => (
                <div
                  key={p.id}
                  data-testid={`recommendation-card-${i}`}
                  className={`fade-up bg-white rounded-3xl border-2 ${p.best_match ? 'border-[#1B4EFF]' : 'border-gray-100'} overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(27,78,255,0.14)] hover:-translate-y-1 transition-all`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative p-6 bg-gradient-to-br from-slate-50 to-white">
                    {p.best_match && (
                      <span className="absolute top-4 left-4 bg-[#1B4EFF] text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full">
                        Best Match
                      </span>
                    )}
                    <button
                      data-testid={`recommendation-save-${p.id}`}
                      aria-label={isSaved(p.id) ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                      onClick={() => toggle(p.id)}
                      className={`absolute top-4 right-4 transition-colors ${isSaved(p.id) ? 'text-[#1B4EFF]' : 'text-gray-300 hover:text-[#1B4EFF]'}`}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved(p.id) ? 'fill-[#1B4EFF]' : ''}`} />
                    </button>
                    <img src={p.image} alt={p.name} className="w-full h-48 object-contain" />
                  </div>
                  <div className="p-5">
                    <div className="text-lg font-extrabold text-black">{p.name}</div>
                    <div className="mt-1">
                      <span className="inline-block bg-[#E8FAEE] text-[#00A344] text-xs font-extrabold px-2.5 py-1 rounded-full">
                        {p.match}% Match
                      </span>
                    </div>
                    <ul className="mt-4 space-y-1.5">
                      {p.features.slice(0, 4).map(f => (
                        <li key={f} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[#1B4EFF]" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-sm text-gray-500">From <span className="text-xl font-extrabold text-black">{fmt(p.price_inr)}</span></div>
                    <button
                      data-testid={`view-details-${p.id}`}
                      onClick={() => nav(`/product/${p.id}`)}
                      className="mt-4 w-full bg-[#1B4EFF] hover:bg-[#1428A0] text-white rounded-full py-2.5 text-sm font-semibold btn-primary-glow inline-flex items-center justify-center gap-1 transition-all"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <Link to="/needs" data-testid="refine-btn" className="text-sm text-gray-500 hover:text-black font-semibold">← Refine your picks</Link>
              <Link to="/chat" data-testid="try-chat-btn" className="text-sm font-semibold text-[#1B4EFF] hover:text-[#1428A0]">Chat with Galaxy AI instead →</Link>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
