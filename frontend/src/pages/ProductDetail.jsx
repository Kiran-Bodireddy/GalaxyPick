import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Share2, Bookmark, BatteryFull, Cpu, Camera, Monitor, Star } from 'lucide-react';
import { FaAmazon } from 'react-icons/fa';
import { Header } from '../components/Header';
import { useGalaxy } from '../context/GalaxyContext';

const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

const StoreMark = ({ name }) => {
  if (name === 'Amazon') return <FaAmazon className="w-8 h-8 text-black" />;
  const bg = name === 'Samsung' ? '#1428A0' : '#F0B90B';
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white text-sm" style={{ background: bg }}>
      {name[0]}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { API } = useGalaxy();
  const [phone, setPhone] = useState(null);
  const [tab, setTab] = useState('reviews');
  const [buyLinks, setBuyLinks] = useState([]);
  const [color, setColor] = useState(0);

  useEffect(() => {
    axios.get(`${API}/phones/${id}`).then(r => { setPhone(r.data); setColor(0); });
    axios.get(`${API}/buy-links/${id}`).then(r => setBuyLinks(r.data.stores));
  }, [id, API]);

  if (!phone) return <div className="min-h-screen bg-white"><Header variant="inner" /><div className="p-12 text-center text-gray-500">Loading…</div></div>;

  const specItems = [
    { icon: BatteryFull, label: phone.specs.battery, sub: 'Battery' },
    { icon: Cpu, label: phone.specs.processor, sub: 'Processor' },
    { icon: Camera, label: phone.specs.camera, sub: 'Camera' },
    { icon: Monitor, label: phone.specs.display, sub: 'Display' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header variant="inner" />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/recommendations" data-testid="back-to-results" className="text-sm text-gray-500 hover:text-black">← Back to results</Link>

        <div className="mt-6 grid lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="fade-up">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-gray-100 p-8 flex items-center justify-center h-96">
              <img src={phone.image} alt={phone.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {phone.colors.map((c, i) => (
                <button key={i} onClick={() => setColor(i)} data-testid={`color-${i}`}
                  className={`aspect-square rounded-2xl border-2 ${color === i ? 'border-[#1B4EFF]' : 'border-gray-100'} p-3 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white`}>
                  <div className="w-full h-full rounded-lg" style={{ background: c }} />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="fade-up fade-up-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <button className="inline-flex items-center gap-1.5 hover:text-black"><Share2 className="w-4 h-4" /> Share</button>
                <button className="inline-flex items-center gap-1.5 hover:text-black"><Bookmark className="w-4 h-4" /> Save</button>
              </div>
            </div>
            <h1 className="mt-2 font-display text-4xl lg:text-5xl font-extrabold text-black">{phone.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="bg-[#E8FAEE] text-[#00A344] text-xs font-extrabold px-2.5 py-1 rounded-full">98% Match</span>
              <span className="text-xs text-gray-500">Your best match</span>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-black">From {fmt(phone.price_inr)}<span className="text-[#1B4EFF]">*</span></div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />
              </div>
              4.6 (2,345 reviews)
            </div>

            <div className="mt-6">
              <div className="text-sm font-bold text-black mb-2">Why we recommend this</div>
              <div className="flex flex-wrap gap-2">
                {phone.features.map(f => (
                  <span key={f} className="bg-[#E8F0FE] text-[#1B4EFF] text-xs font-semibold px-3 py-1.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 border border-gray-100 rounded-2xl p-4">
              {specItems.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center">
                    <Icon className="w-5 h-5 text-[#1B4EFF] mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-black">{s.label}</div>
                    <div className="text-[10px] text-gray-500">{s.sub}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                data-testid="see-buy-options-btn"
                onClick={() => nav(`/buy/${id}`)}
                className="flex-1 bg-[#1B4EFF] hover:bg-[#1428A0] text-white rounded-full py-3 font-semibold btn-primary-glow transition-all"
              >
                See buy options
              </button>
              <button className="px-6 py-3 rounded-full border-2 border-gray-200 hover:border-[#1B4EFF] font-semibold text-sm">View full specs</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex items-center gap-6 border-b border-gray-100 overflow-x-auto">
            {['overview', 'specifications', 'reviews', 'gallery', 'compare'].map(t => (
              <button
                key={t}
                data-testid={`tab-${t}`}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-[#1B4EFF] border-b-2 border-[#1B4EFF]' : 'text-gray-500 hover:text-black'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === 'overview' && <div className="text-gray-700 leading-relaxed max-w-2xl">{phone.story}</div>}
            {tab === 'specifications' && (
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                {Object.entries(phone.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-100 py-3">
                    <span className="text-sm text-gray-500 capitalize">{k}</span>
                    <span className="text-sm font-semibold text-black">{v}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'reviews' && <ReviewsBlock />}
            {tab === 'gallery' && <GalleryBlock name={phone.name} />}
            {tab === 'compare' && <div className="text-gray-500 text-sm">Coming soon — compare with other Galaxy phones side-by-side.</div>}
          </div>
        </div>

        {/* Quick buy summary */}
        {buyLinks.length > 0 && (
          <div className="mt-16 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-gray-100 p-8">
            <div className="text-xl font-extrabold text-black">Ready to buy your {phone.name}?</div>
            <div className="text-sm text-gray-500">Choose your preferred store.</div>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {buyLinks.map((s, i) => {
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`buy-now-${s.name.toLowerCase()}-btn`}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all block"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">Buy on</div>
                        <div className="text-lg font-extrabold text-black">{s.name}</div>
                      </div>
                      <StoreMark name={s.name} />
                    </div>
                    <div className="mt-3 text-lg font-extrabold text-black">{fmt(s.price_inr)}</div>
                    <div className="mt-4 w-full bg-[#1B4EFF] hover:bg-[#1428A0] text-white rounded-full py-2.5 text-sm font-semibold text-center btn-primary-glow">
                      Buy Now
                    </div>
                  </a>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-gray-400">*Prices may vary based on offers and availability.</div>
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewsBlock() {
  const bars = [{ s: 5, v: 72 }, { s: 4, v: 20 }, { s: 3, v: 6 }, { s: 2, v: 1 }, { s: 1, v: 1 }];
  return (
    <div className="grid lg:grid-cols-2 gap-10 max-w-4xl">
      <div>
        <div className="text-sm font-bold text-black mb-2">Customer Reviews</div>
        <div className="text-5xl font-extrabold text-black">4.6 <span className="text-lg text-gray-500 font-semibold">out of 5</span></div>
        <div className="mt-1 flex items-center gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
        </div>
        <div className="text-sm text-gray-500 mt-1">(2,345 reviews)</div>
        <div className="mt-6 space-y-2">
          {bars.map(b => (
            <div key={b.s} className="flex items-center gap-3 text-sm">
              <span className="w-3 text-gray-500">{b.s}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#1B4EFF]" style={{ width: `${b.v}%` }} />
              </div>
              <span className="w-10 text-right text-gray-500">{b.v}%</span>
            </div>
          ))}
        </div>
        <button data-testid="write-review-btn" className="mt-6 px-5 py-2 rounded-full border-2 border-gray-200 hover:border-[#1B4EFF] text-sm font-semibold">Write a Review</button>
      </div>
      <GalleryBlock />
    </div>
  );
}

function GalleryBlock() {
  const imgs = [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=400&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&q=80',
  ];
  return (
    <div>
      <div className="text-sm font-bold text-black mb-3">User Photos</div>
      <div className="grid grid-cols-3 gap-3">
        {imgs.map((src, i) => (
          <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
            <img src={src} alt="user" className="w-full h-full object-cover" />
            {i === imgs.length - 1 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">+48<br />More</div>
            )}
          </div>
        ))}
      </div>
      <button data-testid="view-all-photos-btn" className="mt-4 text-sm font-semibold text-[#1B4EFF]">View All Photos →</button>
    </div>
  );
}
