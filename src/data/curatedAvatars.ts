export interface CuratedAvatar {
  id: string;
  name: string;
  category: 'people' | 'nature' | 'buildings' | 'landmarks';
  svgDataUri: string;
}

// Helper to create clean, cartoonish, colorful SVG avatars
function createSvgDataUri(svgInner: string, viewBox = "0 0 100 100"): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100">${svgInner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

// 24 Curated Cartoonish Avatars across 4 rich categories
export const CURATED_AVATARS: CuratedAvatar[] = [
  // --- 1. CHARACTERS & PEOPLE (6) ---
  {
    id: 'person-zen',
    name: 'Zen Meditator',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-zen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#FDBA74"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-zen)"/>
      <circle cx="50" cy="50" r="40" fill="#FEF3C7" opacity="0.4"/>
      <!-- Robe -->
      <path d="M22 92 C26 68, 74 68, 78 92 Z" fill="#0D9488"/>
      <!-- Face -->
      <circle cx="50" cy="46" r="22" fill="url(#skin)"/>
      <!-- Hair/Beanie -->
      <path d="M28 44 C28 28, 72 28, 72 44 C66 34, 34 34, 28 44 Z" fill="#78350F"/>
      <!-- Peaceful Eyes (Curved Smiling Lines) -->
      <path d="M40 45 Q44 48 48 45" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M52 45 Q56 48 60 45" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Cheerful Smile -->
      <path d="M46 54 Q50 58 54 54" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Rosy Cheeks -->
      <circle cx="39" cy="51" r="3.5" fill="#F43F5E" opacity="0.35"/>
      <circle cx="61" cy="51" r="3.5" fill="#F43F5E" opacity="0.35"/>
      <!-- Lotus Crown Sparkle -->
      <circle cx="50" cy="20" r="2.5" fill="#FFFFFF"/>
      <circle cx="43" cy="23" r="1.8" fill="#FDE68A"/>
      <circle cx="57" cy="23" r="1.8" fill="#FDE68A"/>
    `)
  },
  {
    id: 'person-stargazer',
    name: 'Cosmos Explorer',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#312E81"/>
          <stop offset="100%" stop-color="#4C1D95"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-star)"/>
      <!-- Stars in background -->
      <circle cx="25" cy="25" r="1.5" fill="#FDE047"/>
      <circle cx="76" cy="28" r="2" fill="#FDE047"/>
      <circle cx="30" cy="70" r="1.2" fill="#FFFFFF"/>
      <circle cx="75" cy="65" r="1.5" fill="#FFFFFF"/>
      <!-- Character Hood/Beanie -->
      <circle cx="50" cy="46" r="26" fill="#F59E0B"/>
      <!-- Face -->
      <circle cx="50" cy="48" r="18" fill="#FFEDD5"/>
      <!-- Big anime curious eyes -->
      <circle cx="43" cy="48" r="4" fill="#1E1B4B"/>
      <circle cx="57" cy="48" r="4" fill="#1E1B4B"/>
      <circle cx="44.5" cy="46.5" r="1.5" fill="#FFFFFF"/>
      <circle cx="58.5" cy="46.5" r="1.5" fill="#FFFFFF"/>
      <!-- Cute smile -->
      <path d="M47 55 Q50 58 53 55" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Puffy Jacket -->
      <path d="M22 92 C26 72, 74 72, 78 92 Z" fill="#0284C7"/>
      <path d="M46 72 L46 92" stroke="#BAE6FD" stroke-width="2"/>
    `)
  },
  {
    id: 'person-reader',
    name: 'Thoughtful Scholar',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-read" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#CCFBF1"/>
          <stop offset="100%" stop-color="#14B8A6"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-read)"/>
      <!-- Sweater -->
      <path d="M24 92 C28 70, 72 70, 76 92 Z" fill="#D97706"/>
      <!-- Face -->
      <circle cx="50" cy="45" r="20" fill="#FEE2E2"/>
      <!-- Fluffy Hair -->
      <path d="M28 42 C26 24, 74 24, 72 42 C64 30, 36 30, 28 42 Z" fill="#451A03"/>
      <!-- Round Glasses -->
      <circle cx="42" cy="46" r="6.5" fill="none" stroke="#78350F" stroke-width="2"/>
      <circle cx="58" cy="46" r="6.5" fill="none" stroke="#78350F" stroke-width="2"/>
      <path d="M48.5 46 L51.5 46" stroke="#78350F" stroke-width="2"/>
      <!-- Eyes inside glasses -->
      <circle cx="42" cy="46" r="2.5" fill="#451A03"/>
      <circle cx="58" cy="46" r="2.5" fill="#451A03"/>
      <!-- Smile -->
      <path d="M46 54 Q50 57 54 54" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none"/>
    `)
  },
  {
    id: 'person-artist',
    name: 'Creative Painter',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-art" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FCE7F3"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-art)"/>
      <!-- Apron / Shirt -->
      <path d="M24 92 C28 68, 72 68, 76 92 Z" fill="#4F46E5"/>
      <!-- Face -->
      <circle cx="50" cy="46" r="20" fill="#FED7AA"/>
      <!-- French Beret hat tilted -->
      <ellipse cx="48" cy="27" rx="22" ry="9" fill="#E11D48" transform="rotate(-10 48 27)"/>
      <circle cx="48" cy="18" r="2" fill="#BE123C"/>
      <!-- Cute Eyes -->
      <circle cx="42" cy="46" r="3" fill="#1E293B"/>
      <circle cx="58" cy="46" r="3" fill="#1E293B"/>
      <!-- Paint smudge on cheek -->
      <circle cx="37" cy="52" r="2.5" fill="#06B6D4" opacity="0.8"/>
      <circle cx="62" cy="51" r="2.5" fill="#F59E0B" opacity="0.8"/>
      <!-- Smile -->
      <path d="M46 53 Q50 57 54 53" stroke="#451A03" stroke-width="2" stroke-linecap="round" fill="none"/>
    `)
  },
  {
    id: 'person-nature',
    name: 'Forest Friend',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-natp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#DCFCE7"/>
          <stop offset="100%" stop-color="#22C55E"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-natp)"/>
      <!-- Green Overalls -->
      <path d="M22 92 C26 68, 74 68, 78 92 Z" fill="#15803D"/>
      <!-- Face -->
      <circle cx="50" cy="46" r="20" fill="#FEF3C7"/>
      <!-- Hair with leaves -->
      <path d="M30 42 C28 26, 72 26, 70 42 C64 30, 36 30, 30 42 Z" fill="#854D0E"/>
      <!-- Flower Crown -->
      <circle cx="38" cy="27" r="3" fill="#F43F5E"/>
      <circle cx="50" cy="25" r="3.5" fill="#FBBF24"/>
      <circle cx="62" cy="27" r="3" fill="#38BDF8"/>
      <!-- Eyes & Smile -->
      <path d="M41 45 Q44 43 47 45" stroke="#451A03" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M53 45 Q56 43 59 45" stroke="#451A03" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M46 53 Q50 57 54 53" stroke="#451A03" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="38" cy="49" r="3" fill="#FB7185" opacity="0.4"/>
      <circle cx="62" cy="49" r="3" fill="#FB7185" opacity="0.4"/>
    `)
  },
  {
    id: 'person-monk',
    name: 'Mindful Monk',
    category: 'people',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="bg-monk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFEDD5"/>
          <stop offset="100%" stop-color="#F97316"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg-monk)"/>
      <circle cx="50" cy="50" r="41" fill="#FFFFFF" opacity="0.3"/>
      <!-- Robe in Saffron -->
      <path d="M22 92 C26 64, 74 64, 78 92 Z" fill="#EA580C"/>
      <path d="M30 68 L60 92" stroke="#C2410C" stroke-width="3"/>
      <!-- Shaved Head / Face -->
      <circle cx="50" cy="42" r="22" fill="#FED7AA"/>
      <!-- Soft Smiling Closed Eyes -->
      <path d="M39 42 Q43 46 47 42" stroke="#7C2D12" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M53 42 Q57 46 61 42" stroke="#7C2D12" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Smile -->
      <path d="M46 51 Q50 55 54 51" stroke="#7C2D12" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Gentle aura dot on forehead -->
      <circle cx="50" cy="34" r="2" fill="#E11D48"/>
    `)
  },

  // --- 2. NATURE & ELEMENTS (6) ---
  {
    id: 'nature-sun',
    name: 'Golden Sun & Hills',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="sky-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60A5FA"/>
          <stop offset="70%" stop-color="#BAE6FD"/>
          <stop offset="100%" stop-color="#FEF08A"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#sky-sun)"/>
      <!-- Cheerful Sun -->
      <circle cx="50" cy="36" r="16" fill="#FBBF24"/>
      <circle cx="50" cy="36" r="12" fill="#F59E0B"/>
      <!-- Sun rays -->
      <path d="M50 14 L50 18 M50 54 L50 58 M28 36 L32 36 M68 36 L72 36 M34 20 L37 23 M63 49 L66 52 M34 52 L37 49 M63 23 L66 20" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
      <!-- Smiling Face on Sun -->
      <circle cx="46" cy="34" r="1.5" fill="#78350F"/>
      <circle cx="54" cy="34" r="1.5" fill="#78350F"/>
      <path d="M47 38 Q50 41 53 38" stroke="#78350F" stroke-width="1.5" fill="none"/>
      <!-- Rolling Green Hills -->
      <path d="M-5 95 Q30 55 70 85 Q85 75 105 95 Z" fill="#22C55E"/>
      <path d="M20 95 Q55 68 105 85 L105 95 Z" fill="#16A34A"/>
    `)
  },
  {
    id: 'nature-moon',
    name: 'Moonlit Forest',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#night-sky)"/>
      <!-- Stars -->
      <circle cx="20" cy="25" r="1.5" fill="#FDE047"/>
      <circle cx="78" cy="22" r="1.5" fill="#FDE047"/>
      <circle cx="65" cy="40" r="1" fill="#FFFFFF"/>
      <circle cx="32" cy="45" r="1" fill="#FFFFFF"/>
      <!-- Glowing Crescent Moon -->
      <path d="M56 18 C46 18 38 26 38 36 C38 46 46 54 56 54 C51 51 48 44 48 36 C48 28 51 21 56 18 Z" fill="#FDE047"/>
      <!-- Cartoon Pines -->
      <polygon points="25,85 15,95 35,95" fill="#047857"/>
      <polygon points="25,75 17,85 33,85" fill="#059669"/>
      <polygon points="50,80 34,95 66,95" fill="#065F46"/>
      <polygon points="50,65 38,80 62,80" fill="#047857"/>
      <polygon points="50,52 42,65 58,65" fill="#10B981"/>
      <polygon points="75,82 63,95 87,95" fill="#047857"/>
      <polygon points="75,70 66,82 84,82" fill="#059669"/>
    `)
  },
  {
    id: 'nature-sakura',
    name: 'Cherry Blossom Bloom',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="spring-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0F2FE"/>
          <stop offset="100%" stop-color="#FCE7F3"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#spring-sky)"/>
      <!-- Grassy Mound -->
      <ellipse cx="50" cy="92" rx="45" ry="15" fill="#86EFAC"/>
      <!-- Tree Trunk -->
      <path d="M46 90 Q48 65 44 50 Q48 55 52 48 Q50 65 54 90 Z" fill="#78350F"/>
      <!-- Fluffy Pink Sakura Clouds -->
      <circle cx="36" cy="40" r="16" fill="#F472B6"/>
      <circle cx="64" cy="40" r="16" fill="#F472B6"/>
      <circle cx="50" cy="30" r="18" fill="#FB7185"/>
      <circle cx="48" cy="42" r="15" fill="#FDA4AF"/>
      <circle cx="38" cy="32" r="10" fill="#FBCFE8"/>
      <circle cx="60" cy="32" r="10" fill="#FBCFE8"/>
      <!-- Floating Petals -->
      <circle cx="25" cy="55" r="2.5" fill="#FB7185"/>
      <circle cx="72" cy="62" r="2.5" fill="#FB7185"/>
      <circle cx="68" cy="74" r="2" fill="#F472B6"/>
    `)
  },
  {
    id: 'nature-wave',
    name: 'Ocean Wave Crest',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="sunset-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDA4AF"/>
          <stop offset="50%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#BAE6FD"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#sunset-sea)"/>
      <!-- Sun on horizon -->
      <circle cx="65" cy="42" r="12" fill="#F43F5E"/>
      <!-- Main Curly Stylized Wave -->
      <path d="M-5 95 C20 95, 25 80, 45 70 C60 62, 75 52, 70 38 C65 26, 48 30, 45 42 C44 46, 48 52, 53 50 C58 48, 56 42, 52 42" fill="#0284C7"/>
      <path d="M-5 95 C15 90, 30 75, 48 68 C65 62, 75 50, 68 38 C64 30, 52 32, 48 40" stroke="#E0F2FE" stroke-width="4" stroke-linecap="round" fill="none"/>
      <!-- Sea Foam Dots -->
      <circle cx="73" cy="38" r="2.5" fill="#FFFFFF"/>
      <circle cx="66" cy="33" r="2" fill="#FFFFFF"/>
      <circle cx="58" cy="30" r="3" fill="#FFFFFF"/>
      <!-- Fore ocean layer -->
      <path d="M-5 95 Q30 75 60 88 Q80 82 105 95 Z" fill="#0369A1"/>
    `)
  },
  {
    id: 'nature-desert',
    name: 'Desert Oasis',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="desert-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#FB923C"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#desert-sky)"/>
      <!-- Distant Dunes -->
      <path d="M-5 85 Q35 60 75 78 Q90 70 105 85 Z" fill="#F59E0B"/>
      <!-- Foreground Dunes -->
      <path d="M-5 95 Q40 75 105 95 Z" fill="#D97706"/>
      <!-- Oasis Pond -->
      <ellipse cx="62" cy="85" rx="16" ry="6" fill="#38BDF8"/>
      <ellipse cx="62" cy="85" rx="12" ry="4" fill="#0284C7"/>
      <!-- Palm Tree Trunk -->
      <path d="M35 88 Q40 65 38 48" stroke="#78350F" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <!-- Palm Fronds -->
      <path d="M38 48 Q20 40 18 52" stroke="#16A34A" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M38 48 Q35 30 25 38" stroke="#22C55E" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M38 48 Q48 30 52 40" stroke="#16A34A" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M38 48 Q55 42 56 54" stroke="#22C55E" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Coconut -->
      <circle cx="37" cy="50" r="2" fill="#78350F"/>
    `)
  },
  {
    id: 'nature-aurora',
    name: 'Mystic Aurora',
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="aurora-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#aurora-sky)"/>
      <!-- Stars -->
      <circle cx="15" cy="20" r="1.2" fill="#FFFFFF"/>
      <circle cx="85" cy="25" r="1.5" fill="#FFFFFF"/>
      <circle cx="55" cy="12" r="1.2" fill="#FFFFFF"/>
      <!-- Aurora Wave Ribbons -->
      <path d="M-5 45 Q30 15 65 35 T105 20" stroke="#4ADE80" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.65"/>
      <path d="M-5 35 Q40 50 75 25 T105 35" stroke="#A855F7" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.6"/>
      <path d="M-5 40 Q25 25 60 45 T105 28" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <!-- Mountain Silhouette with Snow Cap -->
      <polygon points="50,48 15,95 85,95" fill="#1E293B"/>
      <polygon points="50,48 38,65 44,62 50,66 56,62 62,65" fill="#E2E8F0"/>
    `)
  },

  // --- 3. ARCHITECTURE & BUILDINGS (6) ---
  {
    id: 'building-cabin',
    name: 'Cozy Mountain Cabin',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="cabin-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FCD34D"/>
          <stop offset="100%" stop-color="#F472B6"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#cabin-sky)"/>
      <!-- Ground -->
      <ellipse cx="50" cy="92" rx="45" ry="12" fill="#15803D"/>
      <!-- Mountain background -->
      <polygon points="30,40 5,90 55,90" fill="#64748B" opacity="0.5"/>
      <polygon points="75,45 50,90 100,90" fill="#475569" opacity="0.5"/>
      <!-- Chimney with smoke -->
      <rect x="58" y="44" width="6" height="12" fill="#991B1B"/>
      <circle cx="61" cy="38" r="3" fill="#FFFFFF" opacity="0.7"/>
      <circle cx="64" cy="32" r="3.5" fill="#FFFFFF" opacity="0.5"/>
      <circle cx="67" cy="25" r="4" fill="#FFFFFF" opacity="0.3"/>
      <!-- A-frame Cabin -->
      <polygon points="50,45 28,85 72,85" fill="#92400E"/>
      <polygon points="50,49 33,83 67,83" fill="#FDE68A"/>
      <!-- Wooden Door -->
      <rect x="46" y="68" width="8" height="15" rx="1" fill="#78350F"/>
      <!-- Glowing Triangle Window -->
      <polygon points="50,56 45,63 55,63" fill="#F59E0B"/>
    `)
  },
  {
    id: 'building-lighthouse',
    name: 'Ocean Lighthouse',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="lh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#60A5FA"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#lh-sky)"/>
      <!-- Sun / Light Beam -->
      <polygon points="50,30 -5,15 -5,45" fill="#FEF08A" opacity="0.4"/>
      <polygon points="50,30 105,15 105,45" fill="#FEF08A" opacity="0.4"/>
      <!-- Cliff -->
      <path d="M30 95 L35 78 Q50 75 75 80 L80 95 Z" fill="#475569"/>
      <!-- Lighthouse Tower -->
      <polygon points="45,35 43,80 57,80 55,35" fill="#FFFFFF"/>
      <!-- Red Stripes -->
      <polygon points="44.2,46 43.6,56 56.4,56 55.8,46" fill="#DC2626"/>
      <polygon points="43.4,66 43,76 57,76 56.6,66" fill="#DC2626"/>
      <!-- Lantern Room -->
      <rect x="44" y="27" width="12" height="8" fill="#FDE047"/>
      <rect x="44" y="27" width="12" height="8" stroke="#1E293B" stroke-width="1.5" fill="none"/>
      <!-- Red Dome Roof -->
      <path d="M42 27 Q50 18 58 27 Z" fill="#DC2626"/>
      <!-- Sea Waves at bottom -->
      <path d="M-5 95 Q25 88 55 92 Q80 88 105 95 Z" fill="#0284C7"/>
    `)
  },
  {
    id: 'building-pagoda',
    name: 'Peaceful Pagoda',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="pago-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#FECDD3"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#pago-sky)"/>
      <!-- Green Hill -->
      <ellipse cx="50" cy="94" rx="45" ry="12" fill="#15803D"/>
      <!-- Tier 1 (Base) -->
      <rect x="38" y="72" width="24" height="15" fill="#78350F"/>
      <path d="M28 72 Q50 68 72 72 Q68 64 50 64 Q32 64 28 72 Z" fill="#DC2626"/>
      <!-- Tier 2 (Middle) -->
      <rect x="41" y="54" width="18" height="12" fill="#9A3412"/>
      <path d="M33 54 Q50 50 67 54 Q63 47 50 47 Q37 47 33 54 Z" fill="#DC2626"/>
      <!-- Tier 3 (Top) -->
      <rect x="44" y="40" width="12" height="9" fill="#78350F"/>
      <path d="M37 40 Q50 36 63 40 Q60 34 50 34 Q40 34 37 40 Z" fill="#DC2626"/>
      <!-- Spire / Finial -->
      <line x1="50" y1="34" x2="50" y2="22" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="22" r="2.5" fill="#F59E0B"/>
    `)
  },
  {
    id: 'building-castle',
    name: 'Fairytale Castle',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="castle-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#DDD6FE"/>
          <stop offset="100%" stop-color="#FCE7F3"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#castle-sky)"/>
      <!-- Castle Lawn -->
      <ellipse cx="50" cy="94" rx="45" ry="12" fill="#4ADE80"/>
      <!-- Central Wall -->
      <rect x="36" y="55" width="28" height="30" fill="#E2E8F0"/>
      <!-- Castle Door -->
      <path d="M45 85 L45 70 Q50 65 55 70 L55 85 Z" fill="#78350F"/>
      <!-- Battlements -->
      <rect x="36" y="50" width="6" height="5" fill="#CBD5E1"/>
      <rect x="47" y="50" width="6" height="5" fill="#CBD5E1"/>
      <rect x="58" y="50" width="6" height="5" fill="#CBD5E1"/>
      <!-- Left Tower -->
      <rect x="25" y="45" width="12" height="40" fill="#CBD5E1"/>
      <polygon points="31,25 23,45 39,45" fill="#8B5CF6"/>
      <!-- Right Tower -->
      <rect x="63" y="45" width="12" height="40" fill="#CBD5E1"/>
      <polygon points="69,25 61,45 77,45" fill="#8B5CF6"/>
      <!-- Center High Turret -->
      <polygon points="50,30 42,50 58,50" fill="#A855F7"/>
      <!-- Flags -->
      <polygon points="31,25 31,18 37,21.5" fill="#EC4899"/>
      <polygon points="69,25 69,18 75,21.5" fill="#EC4899"/>
    `)
  },
  {
    id: 'building-windmill',
    name: 'Sunny Windmill',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="wind-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#BAE6FD"/>
          <stop offset="100%" stop-color="#FEF08A"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#wind-sky)"/>
      <!-- Tulip Meadow -->
      <ellipse cx="50" cy="94" rx="45" ry="12" fill="#22C55E"/>
      <circle cx="25" cy="88" r="2.5" fill="#EF4444"/>
      <circle cx="35" cy="90" r="2.5" fill="#F59E0B"/>
      <circle cx="70" cy="89" r="2.5" fill="#EC4899"/>
      <circle cx="80" cy="88" r="2.5" fill="#EF4444"/>
      <!-- Mill Body -->
      <polygon points="42,48 37,86 63,86 58,48" fill="#78350F"/>
      <!-- Domed Mill Cap -->
      <ellipse cx="50" cy="48" rx="9" ry="6" fill="#451A03"/>
      <!-- Windmill Blades (4 Cross) -->
      <g transform="rotate(25 50 48)">
        <rect x="48.5" y="18" width="3" height="60" rx="1.5" fill="#D97706"/>
        <rect x="20" y="46.5" width="60" height="3" rx="1.5" fill="#D97706"/>
        <!-- Grids on blades -->
        <rect x="52" y="20" width="8" height="22" fill="#FED7AA" opacity="0.8"/>
        <rect x="40" y="56" width="8" height="22" fill="#FED7AA" opacity="0.8"/>
        <rect x="56" y="40" width="22" height="8" fill="#FED7AA" opacity="0.8"/>
        <rect x="22" y="52" width="22" height="8" fill="#FED7AA" opacity="0.8"/>
        <circle cx="50" cy="48" r="4" fill="#B45309"/>
      </g>
    `)
  },
  {
    id: 'building-cottage',
    name: 'Storybook Cottage',
    category: 'buildings',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="cot-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0E7FF"/>
          <stop offset="100%" stop-color="#FBCFE8"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#cot-sky)"/>
      <ellipse cx="50" cy="93" rx="45" ry="12" fill="#16A34A"/>
      <!-- Stone Wall Base -->
      <rect x="30" y="58" width="40" height="28" rx="2" fill="#E2E8F0"/>
      <!-- Round Hobbit Style Door -->
      <circle cx="50" cy="74" r="10" fill="#92400E"/>
      <circle cx="48" cy="74" r="1.5" fill="#FDE047"/>
      <!-- Round Cozy Windows -->
      <circle cx="37" cy="68" r="4" fill="#FEF08A"/>
      <circle cx="63" cy="68" r="4" fill="#FEF08A"/>
      <!-- Thatched Mushroom Roof -->
      <path d="M22 60 Q50 30 78 60 Q50 52 22 60 Z" fill="#B45309"/>
      <!-- Chimney -->
      <rect x="62" y="40" width="6" height="12" fill="#713F12"/>
      <circle cx="65" cy="34" r="2.5" fill="#FFFFFF" opacity="0.6"/>
      <circle cx="68" cy="28" r="3" fill="#FFFFFF" opacity="0.4"/>
    `)
  },

  // --- 4. WORLD LANDMARKS & FAMOUS PLACES (6) ---
  {
    id: 'landmark-fuji',
    name: 'Mount Fuji',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="fuji-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FBCFE8"/>
          <stop offset="60%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#BFDBFE"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#fuji-sky)"/>
      <!-- Rising Big Red Sun -->
      <circle cx="50" cy="42" r="18" fill="#EF4444"/>
      <!-- Mount Fuji Base -->
      <path d="M15 95 Q35 75 42 45 L58 45 Q65 75 85 95 Z" fill="#3B82F6"/>
      <!-- Snow Cap -->
      <path d="M42 45 L58 45 L62 58 Q58 54 54 58 Q50 54 46 58 Q42 54 38 58 Z" fill="#FFFFFF"/>
      <!-- Foreground Lake reflection & Cherry Branch -->
      <path d="M0 90 Q30 85 60 90 Q85 85 100 90 L100 100 L0 100 Z" fill="#1D4ED8"/>
      <!-- Cherry blossom branch -->
      <path d="M85 20 Q70 28 65 35" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="68" cy="32" r="3" fill="#F472B6"/>
      <circle cx="76" cy="26" r="3.5" fill="#F472B6"/>
      <circle cx="82" cy="22" r="3" fill="#F472B6"/>
    `)
  },
  {
    id: 'landmark-eiffel',
    name: 'Eiffel Tower',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="paris-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#A78BFA"/>
          <stop offset="60%" stop-color="#F472B6"/>
          <stop offset="100%" stop-color="#FDE68A"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#paris-sky)"/>
      <ellipse cx="50" cy="94" rx="45" ry="10" fill="#16A34A"/>
      <!-- Eiffel Tower -->
      <!-- Spire -->
      <line x1="50" y1="18" x2="50" y2="34" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Top Section -->
      <polygon points="48,34 52,34 53,50 47,50" fill="#64748B"/>
      <!-- First Platform -->
      <rect x="44" y="50" width="12" height="3" rx="1" fill="#334155"/>
      <!-- Middle Section -->
      <polygon points="46,53 54,53 58,72 42,72" fill="#64748B"/>
      <!-- Second Platform -->
      <rect x="38" y="72" width="24" height="4" rx="1" fill="#334155"/>
      <!-- Lower Legs with Arch -->
      <path d="M40 76 L32 94 L38 94 L44 76 Z" fill="#64748B"/>
      <path d="M60 76 L68 94 L62 94 L56 76 Z" fill="#64748B"/>
      <path d="M42 94 Q50 82 58 94 Z" fill="#FDE68A"/>
    `)
  },
  {
    id: 'landmark-pyramids',
    name: 'Pyramids of Giza',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="giza-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1E1B4B"/>
          <stop offset="60%" stop-color="#4338CA"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#giza-sky)"/>
      <!-- Glowing full moon / evening star -->
      <circle cx="75" cy="25" r="8" fill="#FEF08A"/>
      <circle cx="25" cy="22" r="1.5" fill="#FFFFFF"/>
      <circle cx="45" cy="18" r="1.2" fill="#FFFFFF"/>
      <!-- Great Pyramid (Center/Left) -->
      <polygon points="42,42 12,90 68,90" fill="#FBBF24"/>
      <polygon points="42,42 68,90 42,90" fill="#D97706"/>
      <!-- Second Pyramid (Right) -->
      <polygon points="68,52 46,90 92,90" fill="#F59E0B"/>
      <polygon points="68,52 92,90 68,90" fill="#B45309"/>
      <!-- Dunes in Foreground -->
      <path d="M-5 95 Q35 80 105 92 L105 100 L-5 100 Z" fill="#D97706"/>
    `)
  },
  {
    id: 'landmark-taj',
    name: 'Taj Mahal',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="taj-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#BAE6FD"/>
          <stop offset="60%" stop-color="#E0F2FE"/>
          <stop offset="100%" stop-color="#FED7AA"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#taj-sky)"/>
      <!-- Water Garden Terrace -->
      <rect x="0" y="86" width="100" height="14" fill="#0284C7"/>
      <rect x="42" y="86" width="16" height="14" fill="#38BDF8"/>
      <!-- Plinth -->
      <rect x="24" y="80" width="52" height="6" fill="#F1F5F9"/>
      <!-- Main Dome Structure -->
      <rect x="34" y="54" width="32" height="26" fill="#FFFFFF"/>
      <!-- Center Arch Portal -->
      <path d="M43 80 L43 66 Q50 60 57 66 L57 80 Z" fill="#0369A1"/>
      <!-- Big Onion Dome -->
      <path d="M40 54 Q40 40 50 32 Q60 40 60 54 Z" fill="#FFFFFF"/>
      <line x1="50" y1="32" x2="50" y2="24" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="24" r="1.5" fill="#F59E0B"/>
      <!-- Left Minaret -->
      <line x1="20" y1="42" x2="20" y2="82" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="20" cy="40" r="2" fill="#F1F5F9"/>
      <!-- Right Minaret -->
      <line x1="80" y1="42" x2="80" y2="82" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="80" cy="40" r="2" fill="#F1F5F9"/>
    `)
  },
  {
    id: 'landmark-gate',
    name: 'Golden Gate Bridge',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="60%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#FBCFE8"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#sf-sky)"/>
      <!-- Fluffy Fog layer -->
      <path d="M-5 65 Q25 55 55 60 Q80 52 105 65 L105 100 L-5 100 Z" fill="#E2E8F0" opacity="0.6"/>
      <!-- Blue Bay Water -->
      <rect x="0" y="80" width="100" height="20" fill="#0284C7"/>
      <!-- Bridge Deck -->
      <line x1="0" y1="68" x2="100" y2="68" stroke="#EA580C" stroke-width="4"/>
      <!-- Main Orange Suspension Tower -->
      <rect x="42" y="30" width="5" height="52" fill="#C2410C"/>
      <rect x="53" y="30" width="5" height="52" fill="#C2410C"/>
      <rect x="42" y="42" width="16" height="3" fill="#EA580C"/>
      <rect x="42" y="55" width="16" height="3" fill="#EA580C"/>
      <!-- Suspension Cables -->
      <path d="M0 45 Q42 68 45 30" stroke="#EA580C" stroke-width="2.5" fill="none"/>
      <path d="M55 30 Q65 65 100 50" stroke="#EA580C" stroke-width="2.5" fill="none"/>
      <!-- Vertical suspender lines -->
      <line x1="20" y1="56" x2="20" y2="68" stroke="#EA580C" stroke-width="1"/>
      <line x1="30" y1="62" x2="30" y2="68" stroke="#EA580C" stroke-width="1"/>
      <line x1="72" y1="58" x2="72" y2="68" stroke="#EA580C" stroke-width="1"/>
      <line x1="86" y1="54" x2="86" y2="68" stroke="#EA580C" stroke-width="1"/>
    `)
  },
  {
    id: 'landmark-colosseum',
    name: 'Roman Colosseum',
    category: 'landmarks',
    svgDataUri: createSvgDataUri(`
      <defs>
        <linearGradient id="rome-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="60%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#rome-sky)"/>
      <ellipse cx="50" cy="94" rx="45" ry="10" fill="#15803D"/>
      <!-- Colosseum Outer Wall Silhouette -->
      <path d="M18 85 L18 52 Q22 46 38 46 L38 52 L56 52 L56 58 L82 58 L82 85 Z" fill="#D97706"/>
      <!-- Arches Top Tier -->
      <path d="M22 62 L22 55 Q25 52 28 55 L28 62 Z" fill="#78350F"/>
      <path d="M32 62 L32 55 Q35 52 38 55 L38 62 Z" fill="#78350F"/>
      <!-- Arches Middle Tier -->
      <path d="M22 74 L22 66 Q25 63 28 66 L28 74 Z" fill="#78350F"/>
      <path d="M32 74 L32 66 Q35 63 38 66 L38 74 Z" fill="#78350F"/>
      <path d="M42 74 L42 66 Q45 63 48 66 L48 74 Z" fill="#78350F"/>
      <path d="M52 74 L52 66 Q55 63 58 66 L58 74 Z" fill="#78350F"/>
      <path d="M62 74 L62 66 Q65 63 68 66 L68 74 Z" fill="#78350F"/>
      <path d="M72 74 L72 66 Q75 63 78 66 L78 74 Z" fill="#78350F"/>
      <!-- Ground shadow -->
      <ellipse cx="50" cy="87" rx="35" ry="4" fill="#92400E" opacity="0.6"/>
    `)
  }
];
