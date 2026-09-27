import React, { useState } from 'react';
import { StatInfo } from '../../types';
import { Dumbbell, Flame, HeartPulse, Send, Timer, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';
import { fetchVitalityCoach, AiError } from '../../utils/api';

interface VitalityTabProps {
  stat: StatInfo;
  onLogSessions: (sessions: number) => void;
}

interface WorkoutLog {
  id: string;
  name: string;
  category: 'Gym' | 'Cardio' | 'Recovery' | 'Sport';
  duration: string;
  notes: string;
  date: string;
}

export const VitalityTab: React.FC<VitalityTabProps> = ({
  stat,
  onLogSessions,
}) => {
  const [sessions, setSessions] = useState<number>(1);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([
    {
      id: '1',
      name: 'High-Volume Push/Pull Strength Split',
      category: 'Gym',
      duration: '50 mins',
      notes: 'Focused on progressive overload and eccentric control.',
      date: 'Today',
    },
    {
      id: '2',
      name: 'Zone 2 Aerobic Running & Mobility',
      category: 'Cardio',
      duration: '40 mins',
      notes: 'Kept heart rate below 145 bpm for optimal mitochondrial density.',
      date: 'Yesterday',
    },
    {
      id: '3',
      name: 'Cold Shower & 8h Deep Sleep Recovery Protocol',
      category: 'Recovery',
      duration: 'Overnight',
      notes: '100% adherence to no screens 45 mins prior to sleep.',
      date: '2 days ago',
    },
  ]);

  // Coach State
  const [coachDomain, setCoachDomain] = useState<'workout' | 'sleep' | 'recovery' | 'sports'>('workout');
  const [coachQuery, setCoachQuery] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<{
    headline: string;
    protocol: string[];
    workoutPlan?: {
      warmup: string;
      mainRoutine: string;
      cooldown: string;
    };
  } | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();
    onLogSessions(sessions);

    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      name: `Physical Training Block (${sessions} unit${sessions > 1 ? 's' : ''})`,
      category: 'Gym',
      duration: `${sessions * 35} mins`,
      notes: 'Consistency logged. + ' + sessions * 6 + ' Vitality XP granted.',
      date: 'Just now',
    };
    setWorkoutLogs([newLog, ...workoutLogs]);
  };

  const handleConsultCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuery.trim()) return;
    playSelectSound();
    setCoachLoading(true);
    setCoachError(null);

    try {
      const advice = await fetchVitalityCoach({
        domain: coachDomain,
        query: coachQuery.trim(),
        stat: { rank: stat.rank, title: stat.title, xp: stat.xp },
        recentSessions: workoutLogs.length,
      });
      setCoachAdvice(advice);
    } catch (err) {
      setCoachAdvice(null);
      setCoachError(
        err instanceof AiError
          ? err.message
          : 'Could not reach the AI server. Is it running? Start it with "npm run dev".'
      );
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - High Contrast with Corner Triangles & Lightning */}
      <div className="relative p-5 bg-[#002673] border-3 border-white shadow-[6px_6px_0px_#001F5C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 overflow-hidden">
        {/* Corner Triangles */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rotate-45 pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 flex items-center justify-center bg-[#FF0055] text-white text-2xl font-black font-p3r border-2 border-white shadow-[3px_3px_0px_#001F5C] relative">
            {stat.rankName}
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-sky-200 tracking-widest uppercase font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#FF0055] text-[#FF0055]" />
                <span>VITALITY FACULTY // PHYSICAL VIGOR & REST</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase font-p3r">
              RANK {stat.rank} — {stat.title}
            </h2>
            <div className="text-xs text-white font-mono font-bold">
              Progress: <span className="bg-[#FF0055] px-1.5 py-0.2 text-white">{stat.xp}</span> / {stat.nextThreshold} XP ({stat.percent}%) · <span className="text-sky-200">{stat.counterLabel}</span>
            </div>
          </div>
        </div>

        {/* Quick Log Form */}
        <form onSubmit={handleLog} className="relative z-10 flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-[#001740] border-2 border-white px-3 py-1.5 shadow-[2px_2px_0px_#001F5C]">
            <label className="text-xs uppercase font-extrabold text-white mr-2">
              SESSIONS:
            </label>
            <select
              value={sessions}
              onChange={(e) => setSessions(Number(e.target.value))}
              className="bg-transparent text-white font-black text-sm outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s} className="bg-[#002673] text-white font-bold">
                  {s} Session{s > 1 ? 's' : ''} (+{s * 6} XP)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            onMouseEnter={playHoverSound}
            className="px-4 py-2 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>LOG WORKOUT (+{sessions * 6} XP)</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Conditioning History */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rotate-45 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 border-b-2 border-white/40 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-white" />
                <h3 className="text-base font-black tracking-wide text-white uppercase font-p3r">
                  TRAINING & RECOVERY ARCHIVE
                </h3>
              </div>
              <span className="text-xs text-white font-mono font-extrabold bg-[#001740] px-2.5 py-0.5 border border-white/40">
                {workoutLogs.length} LOGS
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {workoutLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-[#001740] border-2 border-white shadow-[3px_3px_0px_#001F5C] flex justify-between items-center gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black px-2 py-0.5 bg-white text-[#002673] border border-white">
                        {log.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-white uppercase tracking-wide">
                        {log.name}
                      </h4>
                    </div>
                    <p className="text-xs text-sky-100 font-medium leading-relaxed">
                      {log.notes}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-white/90">
                      <Timer className="w-3.5 h-3.5 text-sky-300" />
                      <span>{log.duration}</span>
                      <span>·</span>
                      <span className="text-white bg-[#002673] px-1">{log.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Health, Sleep, Recovery & Sports Coach */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-white/40 relative z-10">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-white" />
                <h3 className="font-black text-base text-white tracking-wide uppercase font-p3r">
                  VITALITY & HEALTH ADVISOR
                </h3>
              </div>
              <span className="text-xs text-white font-mono bg-[#FF0055] px-2 py-0.5 font-black uppercase">
                SCIENCE-BACKED
              </span>
            </div>

            {/* Domain Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-4 bg-[#001740] p-1 border-2 border-white">
              {(['workout', 'sleep', 'recovery', 'sports'] as const).map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setCoachDomain(dom)}
                  className={`py-1.5 text-xs font-p3r font-black uppercase transition-colors cursor-pointer border ${
                    coachDomain === dom
                      ? 'bg-white text-[#002673] border-[#001F5C]'
                      : 'text-white hover:text-white hover:bg-[#002673] border-transparent'
                  }`}
                >
                  {dom === 'workout' ? 'Workouts' : dom === 'sleep' ? 'Sleep' : dom === 'recovery' ? 'Recovery' : 'Sports'}
                </button>
              ))}
            </div>

            <form onSubmit={handleConsultCoach} className="space-y-3 mb-4 relative z-10">
              <div>
                <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                  Query or Goal:
                </label>
                <input
                  type="text"
                  value={coachQuery}
                  onChange={(e) => setCoachQuery(e.target.value)}
                  placeholder={
                    coachDomain === 'sleep'
                      ? 'e.g. Waking up groggy, optimizing REM sleep...'
                      : coachDomain === 'recovery'
                      ? 'e.g. Relieving hamstring soreness, hydration timing...'
                      : 'e.g. 30-min upper body hypertrophy, building 5km stamina...'
                  }
                  className="w-full px-3 py-2 bg-[#001740] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={coachLoading || !coachQuery.trim()}
                onMouseEnter={playHoverSound}
                className="w-full py-2.5 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center justify-center gap-2"
              >
                {coachLoading ? (
                  <Zap className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                )}
                <span>{coachLoading ? 'BUILDING PROTOCOL...' : 'CONSULT VITALITY COACH'}</span>
              </button>
            </form>

            {coachError && (
              <div className="mb-4 p-3.5 bg-[#001740] border-2 border-[#FF0055] text-xs text-white font-mono font-bold relative z-10 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF0055] shrink-0 stroke-[3] mt-px" />
                <div>
                  <div className="text-[#FF0055] mb-1">COACH UNAVAILABLE</div>
                  <div className="text-sky-100 leading-relaxed">{coachError}</div>
                </div>
              </div>
            )}

            {/* Output */}
            {coachAdvice && (
              <div className="p-4 bg-[#001740] border-2 border-white shadow-[3px_3px_0px_#001F5C] space-y-3 relative z-10">
                <div className="text-xs font-black text-sky-200 tracking-wider uppercase flex items-center gap-1.5 font-p3r">
                  <ShieldCheck className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>{coachAdvice.headline}</span>
                </div>

                <ul className="space-y-2 text-xs text-white font-medium">
                  {coachAdvice.protocol.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#FF0055] font-black text-sm">▶</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>

                {coachAdvice.workoutPlan && (
                  <div className="pt-2 border-t border-white/30 space-y-2 text-xs bg-[#002673] p-3 border border-white">
                    <div className="text-sky-200 font-black">Warmup:</div>
                    <p className="text-white text-xs font-medium">{coachAdvice.workoutPlan.warmup}</p>
                    <div className="text-sky-200 font-black">Main Session:</div>
                    <p className="text-white text-xs font-medium">{coachAdvice.workoutPlan.mainRoutine}</p>
                    <div className="text-sky-200 font-black">Cooldown:</div>
                    <p className="text-white text-xs font-medium">{coachAdvice.workoutPlan.cooldown}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
