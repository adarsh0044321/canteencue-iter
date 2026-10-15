import React from "react";
import { CUTE_AVATARS } from "../data/avatars";

export const AvatarGraphic: React.FC<{
  avatarId: string;
  size?: number;
  className?: string;
}> = ({ avatarId, size = 36, className = "" }) => {
  const meta = CUTE_AVATARS.find((a) => a.id === avatarId) || CUTE_AVATARS[0];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", borderRadius: "50%", flexShrink: 0 }}
      role="img"
      aria-label={meta.name}
    >
      {/* Background Circle */}
      <circle cx="40" cy="40" r="38" fill={meta.bgColor} />

      {/* Render Character Details based on avatarId */}
      {meta.id === "boba-cat" && (
        <g>
          {/* Cat Ears */}
          <polygon points="22,34 30,14 40,28" fill="#fda4af" />
          <polygon points="26,30 32,18 38,26" fill="#f43f5e" />
          <polygon points="58,34 50,14 40,28" fill="#fda4af" />
          <polygon points="54,30 48,18 42,26" fill="#f43f5e" />
          {/* Head */}
          <circle cx="40" cy="38" r="21" fill="#fff1f2" />
          {/* Cheeks */}
          <circle cx="28" cy="44" r="4.5" fill="#f43f5e" opacity="0.4" />
          <circle cx="52" cy="44" r="4.5" fill="#f43f5e" opacity="0.4" />
          {/* Happy Eyes */}
          <path d="M30 36 Q34 32 37 36" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M43 36 Q46 32 50 36" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Nose & Mouth */}
          <polygon points="38.5,41 41.5,41 40,43" fill="#fb7185" />
          <path d="M36.5 44 Q40 47 40 44 Q40 47 43.5 44" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Boba Cup */}
          <rect x="33" y="50" width="14" height="19" rx="3" fill="#cbd5e1" opacity="0.9" />
          <rect x="34.5" y="58" width="11" height="9" rx="1.5" fill="#78350f" opacity="0.8" />
          <line x1="39" y1="47" x2="39" y2="60" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          <circle cx="37" cy="64" r="1.5" fill="#1e293b" />
          <circle cx="42" cy="63" r="1.5" fill="#1e293b" />
          <circle cx="40" cy="66" r="1.5" fill="#1e293b" />
        </g>
      )}

      {meta.id === "ramen-panda" && (
        <g>
          {/* Panda Ears */}
          <circle cx="23" cy="22" r="8" fill="#1e293b" />
          <circle cx="57" cy="22" r="8" fill="#1e293b" />
          {/* Head */}
          <circle cx="40" cy="38" r="22" fill="#ffffff" />
          {/* Eye Patches */}
          <ellipse cx="30" cy="36" rx="6" ry="7.5" fill="#1e293b" transform="rotate(-15 30 36)" />
          <ellipse cx="50" cy="36" rx="6" ry="7.5" fill="#1e293b" transform="rotate(15 50 36)" />
          {/* Eyes Sparkle */}
          <circle cx="31" cy="35" r="2.2" fill="#ffffff" />
          <circle cx="49" cy="35" r="2.2" fill="#ffffff" />
          {/* Cheeks */}
          <circle cx="24" cy="44" r="3.5" fill="#fca5a5" opacity="0.7" />
          <circle cx="56" cy="44" r="3.5" fill="#fca5a5" opacity="0.7" />
          {/* Nose */}
          <ellipse cx="40" cy="42" rx="3.5" ry="2.2" fill="#1e293b" />
          <path d="M40 44.5 Q40 47 42 47" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          {/* Ramen Bowl */}
          <path d="M26 53 Q40 50 54 53 L51 68 Q40 71 29 68 Z" fill="#ef4444" />
          <ellipse cx="40" cy="53" rx="14" ry="4" fill="#fbbf24" />
          {/* Steam & Chopsticks */}
          <path d="M22 45 L50 49" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 48 Q37 44 35 40" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M44 48 Q46 44 44 40" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      )}

      {meta.id === "chai-fox" && (
        <g>
          {/* Fox Ears */}
          <polygon points="18,36 26,12 38,28" fill="#ea580c" />
          <polygon points="22,32 28,17 35,26" fill="#fef08a" />
          <polygon points="62,36 54,12 42,28" fill="#ea580c" />
          <polygon points="58,32 52,17 45,26" fill="#fef08a" />
          {/* Head */}
          <path d="M20 38 Q40 26 60 38 Q60 52 40 60 Q20 52 20 38 Z" fill="#f97316" />
          {/* White Snout/Cheeks */}
          <path d="M25 42 Q40 38 40 58 Q40 38 55 42 Q40 62 25 42 Z" fill="#ffffff" />
          {/* Eyes */}
          <circle cx="32" cy="38" r="2.8" fill="#1e293b" />
          <circle cx="48" cy="38" r="2.8" fill="#1e293b" />
          <circle cx="33" cy="37" r="1" fill="#ffffff" />
          <circle cx="49" cy="37" r="1" fill="#ffffff" />
          {/* Nose */}
          <circle cx="40" cy="49" r="2.4" fill="#1e293b" />
          {/* Cutting Chai Glass */}
          <path d="M34 56 L35 70 L45 70 L46 56 Z" fill="#cbd5e1" opacity="0.85" />
          <path d="M35.5 61 L36 69 L44 69 L44.5 61 Z" fill="#b45309" />
          <line x1="33" y1="56" x2="47" y2="56" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {meta.id === "burger-pup" && (
        <g>
          {/* Pup Floppy Ears */}
          <ellipse cx="20" cy="34" rx="7" ry="14" fill="#b45309" transform="rotate(-20 20 34)" />
          <ellipse cx="60" cy="34" rx="7" ry="14" fill="#b45309" transform="rotate(20 60 34)" />
          {/* Head */}
          <circle cx="40" cy="36" r="21" fill="#fde047" />
          <ellipse cx="40" cy="44" rx="11" ry="8" fill="#ffffff" />
          {/* Eyes */}
          <circle cx="32" cy="34" r="3" fill="#1e293b" />
          <circle cx="48" cy="34" r="3" fill="#1e293b" />
          <circle cx="33" cy="33" r="1.2" fill="#ffffff" />
          <circle cx="49" cy="33" r="1.2" fill="#ffffff" />
          {/* Nose & Tongue */}
          <ellipse cx="40" cy="42" rx="3.5" ry="2.5" fill="#1e293b" />
          <path d="M40 45 Q40 48 43 48" stroke="#1e293b" strokeWidth="1.8" fill="none" />
          <path d="M37 47 Q40 53 43 47" fill="#f43f5e" />
          {/* Burger */}
          <path d="M28 60 Q40 52 52 60 Z" fill="#d97706" />
          <rect x="29" y="60" width="22" height="3" rx="1.5" fill="#22c55e" />
          <rect x="28" y="63" width="24" height="4" rx="2" fill="#78350f" />
          <rect x="29" y="67" width="22" height="3" rx="1.5" fill="#d97706" />
        </g>
      )}

      {meta.id === "samosa-monkey" && (
        <g>
          {/* Monkey Ears */}
          <circle cx="18" cy="35" r="9" fill="#92400e" />
          <circle cx="18" cy="35" r="5" fill="#fde68a" />
          <circle cx="62" cy="35" r="9" fill="#92400e" />
          <circle cx="62" cy="35" r="5" fill="#fde68a" />
          {/* Head */}
          <circle cx="40" cy="35" r="20" fill="#92400e" />
          <path d="M28 34 Q34 26 40 32 Q46 26 52 34 Q54 46 40 46 Q26 46 28 34 Z" fill="#fde68a" />
          {/* Eyes */}
          <circle cx="35" cy="35" r="2.5" fill="#1e293b" />
          <circle cx="45" cy="35" r="2.5" fill="#1e293b" />
          {/* Nose & Smile */}
          <ellipse cx="40" cy="40" rx="2" ry="1.4" fill="#92400e" />
          <path d="M35 43 Q40 47 45 43" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Golden Samosa */}
          <polygon points="40,51 27,70 53,70" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="40" y1="53" x2="40" y2="68" stroke="#d97706" strokeWidth="1.2" />
        </g>
      )}

      {meta.id === "matcha-bunny" && (
        <g>
          {/* Bunny Long Ears */}
          <ellipse cx="28" cy="18" rx="6" ry="15" fill="#ffffff" transform="rotate(-10 28 18)" />
          <ellipse cx="28" cy="18" rx="3.5" ry="10" fill="#86efac" transform="rotate(-10 28 18)" />
          <ellipse cx="52" cy="18" rx="6" ry="15" fill="#ffffff" transform="rotate(10 52 18)" />
          <ellipse cx="52" cy="18" rx="3.5" ry="10" fill="#86efac" transform="rotate(10 52 18)" />
          {/* Head */}
          <circle cx="40" cy="40" r="21" fill="#ffffff" />
          {/* Cheeks */}
          <circle cx="27" cy="46" r="4" fill="#fca5a5" opacity="0.6" />
          <circle cx="53" cy="46" r="4" fill="#fca5a5" opacity="0.6" />
          {/* Eyes */}
          <circle cx="32" cy="38" r="3" fill="#1e293b" />
          <circle cx="48" cy="38" r="3" fill="#1e293b" />
          <circle cx="33" cy="37" r="1.2" fill="#ffffff" />
          <circle cx="49" cy="37" r="1.2" fill="#ffffff" />
          {/* Nose & Mouth */}
          <polygon points="38.5,43 41.5,43 40,45" fill="#f43f5e" />
          <path d="M37 46 Q40 49 43 46" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Matcha Cup */}
          <path d="M33 55 L35 69 L45 69 L47 55 Z" fill="#15803d" />
          <ellipse cx="40" cy="55" rx="7" ry="2.5" fill="#4ade80" />
        </g>
      )}

      {meta.id === "pizza-bear" && (
        <g>
          {/* Bear Round Ears */}
          <circle cx="24" cy="22" r="8" fill="#78350f" />
          <circle cx="24" cy="22" r="4.5" fill="#fcd34d" />
          <circle cx="56" cy="22" r="8" fill="#78350f" />
          <circle cx="56" cy="22" r="4.5" fill="#fcd34d" />
          {/* Head */}
          <circle cx="40" cy="37" r="21" fill="#92400e" />
          <ellipse cx="40" cy="43" rx="10" ry="7" fill="#fde68a" />
          {/* Eyes */}
          <circle cx="32" cy="35" r="2.8" fill="#1e293b" />
          <circle cx="48" cy="35" r="2.8" fill="#1e293b" />
          {/* Nose & Smile */}
          <ellipse cx="40" cy="41" rx="3.5" ry="2.2" fill="#1e293b" />
          <path d="M36 45 Q40 49 44 45" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Pizza Slice */}
          <polygon points="40,50 25,69 55,69" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <path d="M25 69 Q40 72 55 69" stroke="#b45309" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="62" r="2.5" fill="#dc2626" />
          <circle cx="45" cy="59" r="2" fill="#dc2626" />
          <circle cx="42" cy="66" r="2" fill="#16a34a" />
        </g>
      )}

      {meta.id === "chef-penguin" && (
        <g>
          {/* Penguin Head */}
          <ellipse cx="40" cy="44" rx="20" ry="22" fill="#0f172a" />
          {/* White Belly/Face */}
          <ellipse cx="40" cy="48" rx="13" ry="17" fill="#ffffff" />
          {/* Cheeks */}
          <circle cx="28" cy="49" r="3" fill="#fca5a5" opacity="0.8" />
          <circle cx="52" cy="49" r="3" fill="#fca5a5" opacity="0.8" />
          {/* Eyes */}
          <circle cx="33" cy="44" r="2.8" fill="#0f172a" />
          <circle cx="47" cy="44" r="2.8" fill="#0f172a" />
          <circle cx="34" cy="43" r="1" fill="#ffffff" />
          <circle cx="48" cy="43" r="1" fill="#ffffff" />
          {/* Orange Beak */}
          <polygon points="36,48 44,48 40,54" fill="#f97316" />
          {/* Chef Hat */}
          <path d="M28 28 Q22 18 32 15 Q40 8 48 15 Q58 18 52 28 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
          <rect x="28" y="27" width="24" height="6" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        </g>
      )}

      {meta.id === "taco-tiger" && (
        <g>
          {/* Tiger Ears */}
          <polygon points="21,32 26,16 36,28" fill="#ea580c" />
          <polygon points="24,28 28,20 33,26" fill="#fef08a" />
          <polygon points="59,32 54,16 44,28" fill="#ea580c" />
          <polygon points="56,28 52,20 47,26" fill="#fef08a" />
          {/* Head */}
          <circle cx="40" cy="37" r="21" fill="#f97316" />
          {/* Stripes */}
          <polygon points="40,19 38,25 42,25" fill="#431407" />
          <polygon points="23,34 29,36 29,38" fill="#431407" />
          <polygon points="57,34 51,36 51,38" fill="#431407" />
          {/* Cheeks */}
          <ellipse cx="40" cy="44" rx="10" ry="6" fill="#ffffff" />
          {/* Eyes */}
          <circle cx="32" cy="35" r="3" fill="#1e293b" />
          <circle cx="48" cy="35" r="3" fill="#1e293b" />
          {/* Nose */}
          <polygon points="38.5,41 41.5,41 40,43" fill="#dc2626" />
          {/* Taco */}
          <path d="M25 64 Q40 50 55 64 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <path d="M27 63 Q40 55 53 63" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="60" r="2" fill="#ef4444" />
          <circle cx="44" cy="59" r="2" fill="#ef4444" />
        </g>
      )}

      {meta.id === "coffee-koala" && (
        <g>
          {/* Big Koala Fluffy Ears */}
          <circle cx="19" cy="30" r="11" fill="#94a3b8" />
          <circle cx="19" cy="30" r="6.5" fill="#f1f5f9" />
          <circle cx="61" cy="30" r="11" fill="#94a3b8" />
          <circle cx="61" cy="30" r="6.5" fill="#f1f5f9" />
          {/* Head */}
          <circle cx="40" cy="39" r="20" fill="#94a3b8" />
          {/* Cheeks */}
          <circle cx="28" cy="45" r="3.5" fill="#fca5a5" opacity="0.6" />
          <circle cx="52" cy="45" r="3.5" fill="#fca5a5" opacity="0.6" />
          {/* Eyes */}
          <circle cx="31" cy="36" r="2.8" fill="#1e293b" />
          <circle cx="49" cy="36" r="2.8" fill="#1e293b" />
          <circle cx="32" cy="35" r="1" fill="#ffffff" />
          <circle cx="50" cy="35" r="1" fill="#ffffff" />
          {/* Large Oval Nose */}
          <ellipse cx="40" cy="42" rx="5.5" ry="7.5" fill="#1e293b" />
          {/* Coffee Mug */}
          <rect x="32" y="55" width="16" height="15" rx="3" fill="#0284c7" />
          <path d="M48 58 Q53 58 53 62 Q53 66 48 66" stroke="#0284c7" strokeWidth="2.5" fill="none" />
          <ellipse cx="40" cy="55" rx="8" ry="2.5" fill="#78350f" />
        </g>
      )}

      {meta.id === "donut-otter" && (
        <g>
          {/* Otter Ears */}
          <circle cx="23" cy="26" r="5" fill="#78350f" />
          <circle cx="57" cy="26" r="5" fill="#78350f" />
          {/* Head */}
          <ellipse cx="40" cy="37" rx="20" ry="18" fill="#a16207" />
          <ellipse cx="40" cy="43" rx="11" ry="8" fill="#fef08a" />
          {/* Eyes */}
          <circle cx="32" cy="36" r="2.8" fill="#1e293b" />
          <circle cx="48" cy="36" r="2.8" fill="#1e293b" />
          {/* Nose & Whiskers */}
          <ellipse cx="40" cy="41" rx="3.5" ry="2.2" fill="#1e293b" />
          <line x1="26" y1="42" x2="33" y2="43" stroke="#78350f" strokeWidth="1.2" />
          <line x1="47" y1="43" x2="54" y2="42" stroke="#78350f" strokeWidth="1.2" />
          {/* Pink Donut */}
          <circle cx="40" cy="61" r="9" fill="#d97706" />
          <circle cx="40" cy="61" r="7.5" fill="#f43f5e" />
          <circle cx="40" cy="61" r="3.2" fill={meta.bgColor} />
          {/* Sprinkles */}
          <line x1="36" y1="58" x2="38" y2="58" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="57" x2="44" y2="58" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="43" y1="64" x2="45" y2="63" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {meta.id === "dosa-elephant" && (
        <g>
          {/* Elephant Big Ears */}
          <ellipse cx="18" cy="36" rx="9" ry="13" fill="#2dd4bf" />
          <ellipse cx="18" cy="36" rx="5" ry="8" fill="#99f6e4" />
          <ellipse cx="62" cy="36" rx="9" ry="13" fill="#2dd4bf" />
          <ellipse cx="62" cy="36" rx="5" ry="8" fill="#99f6e4" />
          {/* Head */}
          <circle cx="40" cy="36" r="19" fill="#0d9488" />
          {/* Eyes */}
          <circle cx="32" cy="33" r="2.8" fill="#ffffff" />
          <circle cx="48" cy="33" r="2.8" fill="#ffffff" />
          <circle cx="33" cy="33" r="1.5" fill="#134e4a" />
          <circle cx="47" cy="33" r="1.5" fill="#134e4a" />
          {/* Cute Trunk */}
          <path d="M40 37 Q40 48 35 49 Q31 50 31 46" stroke="#0d9488" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* Dosa Roll */}
          <rect x="24" y="59" width="32" height="9" rx="4.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
          <line x1="28" y1="61" x2="31" y2="66" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="38" y1="61" x2="41" y2="66" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="48" y1="61" x2="51" y2="66" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};
