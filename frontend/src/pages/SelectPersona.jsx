import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Camera, Gamepad2, Plane, TrendingUp, Users, Cpu } from 'lucide-react';
import { Header } from '../components/Header';
import { useGalaxy } from '../context/GalaxyContext';

const PERSONAS = [
  { id: 'student', title: 'Student', body: 'Study, learn and stay entertained', icon: GraduationCap, color: 'from-blue-100 to-blue-50' },
  { id: 'professional', title: 'Professional', body: 'Work, multitask and stay productive', icon: Briefcase, color: 'from-slate-100 to-slate-50' },
  { id: 'creator', title: 'Creator', body: 'Capture, create and inspire', icon: Camera, color: 'from-purple-100 to-white' },
  { id: 'gamer', title: 'Gamer', body: 'Play hard, win big and enjoy more', icon: Gamepad2, color: 'from-red-100 to-orange-50' },
  { id: 'traveller', title: 'Traveller', body: 'Explore more, travel better', icon: Plane, color: 'from-sky-100 to-white' },
  { id: 'business_executive', title: 'Business Executive', body: 'Lead, manage and stay ahead', icon: TrendingUp, color: 'from-emerald-100 to-white' },
  { id: 'family', title: 'Parent / Family', body: "For your family's needs", icon: Users, color: 'from-amber-100 to-white' },
  { id: 'tech_enthusiast', title: 'Tech Enthusiast', body: 'Explore the latest technology', icon: Cpu, color: 'from-indigo-100 to-white' },
];

export default function SelectPersona() {
  const nav = useNavigate();
  const { persona, setPersona, setUserName } = useGalaxy();

  const pick = (p) => {
    setPersona(p.id);
    setUserName(p.title.split(' ')[0]);
    setTimeout(() => nav('/needs'), 220);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="inner" />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="text-center mb-12 fade-up">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black">Who are you?</h2>
          <p className="mt-3 text-gray-500">This helps us personalize your recommendations.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {PERSONAS.map((p, i) => {
            const Icon = p.icon;
            const active = persona === p.id;
            return (
              <button
                key={p.id}
                data-testid={`persona-card-${p.id}`}
                onClick={() => pick(p)}
                className={`fade-up text-center bg-white rounded-3xl p-5 lg:p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(27,78,255,0.10)] ${active ? 'border-[#1B4EFF] shadow-[0_10px_28px_rgba(27,78,255,0.18)]' : 'border-gray-100'}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-12 h-12 text-[#1B4EFF]" />
                </div>
                <div className="font-bold text-black">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">{p.body}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
