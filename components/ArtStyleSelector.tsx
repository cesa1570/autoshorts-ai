
import React from 'react';
import { Palette, X, Check, Zap, Layers, Info, Camera, Monitor, Film } from 'lucide-react';

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  dna: string[];
  image: string;
  technicalHint: string;
}

export const STYLES: StyleOption[] = [
  {
    id: 'Cinematic',
    name: 'Cinematic Master',
    description: 'High-end Hollywood aesthetics with professional depth of field and color grading.',
    dna: ['Anamorphic Lens', 'Golden Hour', 'Shallow Focus', '8K Raw'],
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'cinematic shot, 35mm anamorphic lens, f/1.4 shallow depth of field, golden hour lighting, dramatic shadows, color graded, film grain, 8K resolution, professional cinematography, movie still, ARRI Alexa camera'
  },
  {
    id: 'Anime',
    name: 'Neo Anime',
    description: 'Vibrant cel-shaded visuals inspired by modern Makoto Shinkai animation.',
    dna: ['Saturated Colors', 'Expressive Lines', 'Stylized Sky', 'Hand-drawn feel'],
    image: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'anime style, Makoto Shinkai, cel shaded, vibrant saturated colors, detailed sky with volumetric clouds, soft glow lighting, expressive linework, digital painting, your name movie aesthetic, 4K anime keyframe'
  },
  {
    id: 'Cyberpunk',
    name: 'Cyberpunk Edgy',
    description: 'Dystopian future aesthetics with high-contrast neon and rainy reflections.',
    dna: ['Neon Glow', 'Chromatic Aberration', 'Volumetric Fog', 'Night City'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'cyberpunk 2077 style, neon pink blue lights, rainy night street, wet reflections, holographic ads, chromatic aberration, volumetric fog, high contrast, blade runner aesthetic, dystopian cityscape, 8K cinematic'
  },
  {
    id: 'Horror',
    name: 'Atmospheric Horror',
    description: 'Eerie, desaturated, and high-tension compositions for mystery and suspense.',
    dna: ['Chiaroscuro', 'Heavy Grain', 'Shadow Play', 'Creepy Details'],
    image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'dark horror atmosphere, chiaroscuro lighting, heavy film grain, desaturated color palette, deep shadows, fog and mist, eerie unsettling mood, low-key side lighting, creepy details, psychological terror, 35mm horror film'
  },
  {
    id: 'Documentary',
    name: 'NatGeo Reality',
    description: 'Realistic, high-fidelity textures with neutral, natural lighting.',
    dna: ['Natural Light', 'Macro Detail', 'True Color', 'Clean Frame'],
    image: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'National Geographic photo, photorealistic, natural lighting, high fidelity textures, neutral color profile, macro detail, clean composition, professional DSLR shot, 8K resolution, documentary photography, ultra realistic'
  },
  {
    id: 'Unreal',
    name: 'Unreal Engine 5',
    description: 'Hyper-realistic 3D rendering with advanced global illumination and ray tracing.',
    dna: ['Lumen', 'Nanite', 'Ray Tracing', '8K Render'],
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    technicalHint: 'Unreal Engine 5 render, Lumen global illumination, Nanite geometry, ray tracing reflections, photorealistic 3D, 8K resolution, physically based rendering, subsurface scattering, AAA game graphics, hyperrealistic CGI'
  },
  {
    id: 'Lego',
    name: 'Brick Construction',
    description: 'The world reimagined as plastic bricks with stunning macro details and gloss.',
    dna: ['Plastic Texture', 'Studs', 'Tilt-shift', 'Toy Photography'],
    image: '/images/lego.jpeg',
    technicalHint: 'LEGO brick style, everything made of plastic LEGO bricks, visible studs, glossy plastic material, tilt-shift photography, macro lens, toy miniature aesthetic, vibrant primary colors, studio lighting, minifigure scale'
  },
  {
    id: 'Disney',
    name: 'Pixar Magic',
    description: 'Heartwarming 3D animation style with soft lighting, big eyes, and magical vibes.',
    dna: ['Pixar Style', 'Soft Light', 'Expressive', '3D Render'],
    image: '/images/disney.jpg',
    technicalHint: 'Pixar Disney 3D animation, soft subsurface scattering skin, big expressive eyes, cute character design, dreamy soft lighting, smooth rounded shapes, Octane render, Cinema 4D, heartwarming atmosphere, modern Disney movie still'
  },
  {
    id: 'Minecraft',
    name: 'Minecraft Voxel',
    description: 'A blocky, voxel-based aesthetic inspired by the iconic sandbox game.',
    dna: ['Voxel Art', 'Blocky', '8-Bit 3D', 'Sandbox'],
    image: '/images/minecraft.jpg',
    technicalHint: 'Minecraft video game style, voxel art, blocky cube-based world, pixelated 16x16 textures, isometric view, RTX shaders, volumetric lighting, cubic characters, dirt grass blocks, sandbox game aesthetic'
  },
  {
    id: 'Roblox',
    name: 'Roblox Adventure',
    description: 'Blocky characters and simple environments inspired by the creative world of Roblox.',
    dna: ['R6/R15 Characters', 'Low Poly', 'BloxStyle', 'Vibrant Icons'],
    image: '/images/roblox.jpg',
    technicalHint: 'Roblox game style, blocky R15 avatar, simple low poly 3D, bright saturated colors, plastic smooth textures, game lobby aesthetic, flat shading, user-generated content look, cartoony proportions'
  },
  {
    id: 'Baki',
    name: 'Baki Hanma Unleashed',
    description: 'Hyper-muscular characters with intense facial expressions and gritty action lines.',
    dna: ['Hyper-Musculature', 'Intense Anatomy', 'Gritty Shading', 'Action Lines'],
    image: '/images/baki.jpg',
    technicalHint: 'Baki The Grappler anime style, hyper-detailed muscular anatomy, veins and tendons visible, intense shadowing, gritty crosshatch shading, dramatic action lines, fierce expression, martial arts pose, dark atmospheric background, manga panel aesthetic'
  },
  {
    id: 'JoJo',
    name: 'JoJo Bizarre Edge',
    description: 'Flamboyant poses, bold outlines, and psychedelic colors inspired by Araki\'s masterpiece.',
    dna: ['Flamboyant Poses', 'Bold Hatching', 'Psychedelic Colors', 'Dramatic Onomatopoeia'],
    image: '/images/jojo.jpg',
    technicalHint: 'JoJo Bizarre Adventure style, Hirohiko Araki art, flamboyant dramatic pose, bold black ink outlines, crosshatch shading, psychedelic vibrant color palette, fashion model aesthetic, menacing aura, Japanese onomatopoeia effects, muscular proportions'
  },
];

interface ArtStyleSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ArtStyleSelector: React.FC<ArtStyleSelectorProps> = ({ selectedId, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-7xl rounded-[4rem] p-12 relative shadow-3xl overflow-hidden ring-1 ring-white/5">

        {/* Background Blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C5A059]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-10 right-10 text-neutral-600 hover:text-white transition p-2 active:scale-90 z-20">
          <X size={32} />
        </button>

        {/* Header */}
        <div className="mb-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-[#C5A059]/20 rounded-2xl flex items-center justify-center text-[#C5A059] border border-[#C5A059]/20">
                <Palette size={24} />
              </div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Artistic Direction</h3>
            </div>
            <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.3em] ml-1">Select visual parameters for the Neural Generation Engine</p>
          </div>
          <div className="px-6 py-2 bg-neutral-900 rounded-full flex items-center gap-3 border border-white/5">
            <Layers size={14} className="text-[#C5A059]" />
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{STYLES.length} Multi-Spectral Style Kernels</span>
          </div>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => { onSelect(style.id); onClose(); }}
              className={`group relative flex flex-col text-left rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden active:scale-95 h-full ${selectedId === style.id
                ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-[0_0_50px_rgba(197,160,89,0.2)]'
                : 'border-white/5 bg-black hover:border-white/20'
                }`}
            >
              {/* Visual Preview Container */}
              <div className="h-48 w-full relative overflow-hidden transition-transform duration-700">
                <img
                  src={style.image}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={style.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                {/* DNA Tags Overlay */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {style.dna.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[7px] font-black uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[#C5A059] border border-[#C5A059]/20">
                      {tag}
                    </span>
                  ))}
                </div>

                {selectedId === style.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center shadow-2xl ring-4 ring-[#C5A059]/20 animate-in zoom-in duration-300">
                    <Check size={18} className="text-black" />
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className={`text-lg font-black uppercase tracking-tight transition-colors mb-1 ${selectedId === style.id ? 'text-[#C5A059]' : 'text-white group-hover:text-[#C5A059]'}`}>
                    {style.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                    <Camera size={10} /> Lens Core Active
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed font-medium font-kanit italic mb-6 line-clamp-2">
                  {style.description}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="p-3 bg-neutral-900 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Monitor size={10} className="text-blue-400" />
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Engine Parameters</span>
                    </div>
                    <p className="text-[9px] text-neutral-400 leading-tight italic font-mono uppercase tracking-tighter line-clamp-2">
                      {style.technicalHint}
                    </p>
                  </div>

                  <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedId === style.id ? 'bg-[#C5A059] text-black' : 'bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700 group-hover:text-neutral-300'
                    }`}>
                    <Film size={12} /> {selectedId === style.id ? 'Selected Pattern' : 'Select Pattern'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-neutral-600" />
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Hardware Acceleration: V4 Cluster Active</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-[#C5A059]" fill="currentColor" />
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Style Transfer Optimization: On</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-12 py-5 bg-[#C5A059] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#d4af37] transition shadow-xl active:scale-95"
          >
            Deploy Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtStyleSelector;
