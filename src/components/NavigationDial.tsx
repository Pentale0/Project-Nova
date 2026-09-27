import React from 'react';
import {
  Activity,
  GraduationCap,
  Dumbbell,
  Compass,
  Camera,
  Users,
  MessageSquare,
  User,
  Zap,
  Code,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../utils/audio';

export type TabId =
  | 'overview'
  | 'academics'
  | 'vitality'
  | 'culture'
  | 'memories'
  | 'social'
  | 'chat'
  | 'profile'
  | 'creator';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keyNum: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'OVERVIEW', icon: Activity, keyNum: '1' },
  { id: 'academics', label: 'ACADEMICS', icon: GraduationCap, keyNum: '2' },
  { id: 'vitality', label: 'VITALITY', icon: Dumbbell, keyNum: '3' },
  { id: 'culture', label: 'CULTURE', icon: Compass, keyNum: '4' },
  { id: 'memories', label: 'MEMORIES', icon: Camera, keyNum: '5' },
  { id: 'social', label: 'INTEREST DECK', icon: Users, keyNum: '6' },
  { id: 'chat', label: 'COMM CHAT', icon: MessageSquare, keyNum: '7' },
  { id: 'profile', label: 'DOSSIER', icon: User, keyNum: '8' },
  { id: 'creator', label: 'CREATOR', icon: Code, keyNum: '9' },
];

interface NavigationDialProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const NavigationDial: React.FC<NavigationDialProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const handleSelect = (id: TabId) => {
    playSelectSound();
    onSelectTab(id);
  };

  return (
    <nav className="w-full mb-5">
      {/* Horizontal scrollable tabs with triangles and lightning */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none px-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              onMouseEnter={playHoverSound}
              className={`relative group flex items-center gap-2 px-3.5 py-2 transition-all cursor-pointer select-none shrink-0 font-p3r text-xs tracking-wide border-2 ${
                isActive
                  ? 'bg-white text-[#002D80] border-[#001F5C] shadow-[4px_4px_0px_#001F5C] -translate-y-0.5 font-black'
                  : 'bg-[#002D80] text-white hover:bg-white hover:text-[#002D80] border-white/70 shadow-[2px_2px_0px_#001F5C]'
              }`}
            >
              {/* Corner triangle on active button */}
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FF0055] rotate-45 pointer-events-none"></div>
              )}

              <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="font-extrabold">{item.label}</span>

              {/* Lightning accent on active tab */}
              {isActive ? (
                <span className="flex items-center bg-[#FF0055] text-white px-1 py-0.5 text-[10px] font-mono font-black">
                  <Zap className="w-2.5 h-2.5 fill-white" />
                  {item.keyNum}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1 py-0.2 bg-[#001F5C] text-white font-bold group-hover:bg-[#002D80]">
                  {item.keyNum}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
