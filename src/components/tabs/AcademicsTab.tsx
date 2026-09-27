import React, { useState } from 'react';
import { StatInfo, AcademicResource, QuizQuestion } from '../../types';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Brain,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';
import { fetchStudyCoach, AiError } from '../../utils/api';

interface AcademicsTabProps {
  stat: StatInfo;
  resources: AcademicResource[];
  onLogHours: (hours: number) => void;
  onAddResource: (title: string, subject: string, content: string) => void;
  onDeleteResource: (id: string) => void;
}

export const AcademicsTab: React.FC<AcademicsTabProps> = ({
  stat,
  resources,
  onLogHours,
  onAddResource,
  onDeleteResource,
}) => {
  const [studyHours, setStudyHours] = useState<number>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newContent, setNewContent] = useState('');

  // AI Teacher State
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    resources[0]?.id || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState<{
    summaryNotes: string[];
    conceptGraph: string;
    quizzes: QuizQuestion[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({});

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();
    onLogHours(studyHours);
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    playSelectSound();
    onAddResource(newTitle.trim(), newSubject.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
  };

  const handleRunAiTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeRes = resources.find((r) => r.id === selectedResourceId);
    if (!activeRes) return;

    playSelectSound();
    setIsGenerating(true);
    setAiError(null);

    try {
      const output = await fetchStudyCoach({
        title: activeRes.title,
        subject: activeRes.subject,
        content: activeRes.content,
      });
      setAiOutput(output);
      setRevealedQuiz({});
    } catch (err) {
      setAiOutput(null);
      setAiError(
        err instanceof AiError
          ? err.message
          : 'Could not reach the AI server. Is it running? Start it with "npm run dev".'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuiz = (idx: number) => {
    playSelectSound();
    setRevealedQuiz((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - High Contrast with Corner Triangles & Lightning */}
      <div className="relative p-5 bg-[#002673] border-3 border-white shadow-[6px_6px_0px_#001F5C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 overflow-hidden">
        {/* Decorative corner triangles */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rotate-45 pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 flex items-center justify-center bg-white text-[#002673] text-2xl font-black font-p3r border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] relative">
            {stat.rankName}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF0055] rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-sky-200 tracking-widest uppercase font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#FF0055] text-[#FF0055]" />
                <span>ACADEMICS FACULTY // INTELLECT & MASTERY</span>
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
              HOURS:
            </label>
            <select
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="bg-transparent text-white font-black text-sm outline-none cursor-pointer"
            >
              {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                <option key={h} value={h} className="bg-[#002673] text-white font-bold">
                  {h} Hour{h > 1 ? 's' : ''} (+{h * 4} XP)
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
            <span>LOG STUDY (+{studyHours * 4} XP)</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Custom Syllabus Vault */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rotate-45 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 border-b-2 border-white/40 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-white" />
                <h3 className="text-base font-black tracking-wide text-white uppercase font-p3r">
                  YOUR SYLLABUS & RESOURCES
                </h3>
              </div>
              <span className="text-xs text-white font-mono font-extrabold bg-[#001740] px-2.5 py-0.5 border border-white/40">
                {resources.length} STORED
              </span>
            </div>

            {/* Add Resource Form */}
            <form onSubmit={handleCreateResource} className="mb-5 space-y-3 bg-[#001740] p-4 border-2 border-white shadow-[3px_3px_0px_#001F5C]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus"
                    className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                    Field / Subject
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Systems Architecture"
                    className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                  Textbook Notes / Syllabus Text
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste textbook excerpts, definitions, lecture notes, or theorems..."
                  rows={3}
                  className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-mono placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>ADD RESOURCE TO SYLLABUS</span>
              </button>
            </form>

            {/* List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {resources.length === 0 ? (
                <div className="text-center py-8 text-xs text-white font-mono font-bold bg-[#001740] p-4 border border-white/30">
                  No resources uploaded yet. Add syllabus notes above.
                </div>
              ) : (
                resources.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedResourceId(item.id)}
                    className={`p-3.5 transition-colors cursor-pointer border-2 flex justify-between items-start gap-3 shadow-[3px_3px_0px_#001F5C] ${
                      selectedResourceId === item.id
                        ? 'bg-white text-[#002673] border-[#001F5C]'
                        : 'bg-[#001740] text-white border-white/60 hover:border-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black px-2 py-0.5 border ${
                          selectedResourceId === item.id
                            ? 'bg-[#002673] text-white border-[#001F5C]'
                            : 'bg-white text-[#002673] border-white'
                        }`}>
                          {item.subject}
                        </span>
                        <h4 className="font-extrabold text-sm uppercase tracking-wide">
                          {item.title}
                        </h4>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 font-medium ${
                        selectedResourceId === item.id ? 'text-[#001740]' : 'text-white'
                      }`}>
                        {item.content}
                      </p>
                      <div className="text-[11px] font-mono font-bold opacity-80">
                        {item.createdAt}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSelectSound();
                        onDeleteResource(item.id);
                      }}
                      className="p-1 hover:text-[#FF0055] transition-colors cursor-pointer"
                      title="Delete resource"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Grounded AI Teacher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-white/40 relative z-10">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-white" />
                <h3 className="font-black text-base text-white tracking-wide uppercase font-p3r">
                  ACADEMIC AI TEACHER // GROUNDED IN YOUR SYLLABUS
                </h3>
              </div>
              <span className="text-xs text-white font-mono bg-[#FF0055] px-2 py-0.5 font-black uppercase">
                STRICT GROUNDING
              </span>
            </div>

            <form onSubmit={handleRunAiTeacher} className="space-y-3 mb-4 relative z-10">
              <div>
                <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                  Selected Grounding Resource:
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#001740] border-2 border-white text-xs text-white font-bold focus:outline-none"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#002673] text-white font-bold">
                      {r.title} ({r.subject})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating || resources.length === 0}
                onMouseEnter={playHoverSound}
                className="w-full py-2.5 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <Sparkles className="w-4 h-4 animate-spin stroke-[2.5]" />
                ) : (
                  <Zap className="w-4 h-4 fill-current stroke-[2.5]" />
                )}
                <span>
                  {isGenerating
                    ? 'READING YOUR SYLLABUS...'
                    : 'GENERATE NOTES, DIAGRAM & 5 QUIZ QUESTIONS'}
                </span>
              </button>
            </form>

            {aiError && (
              <div className="mb-4 p-3.5 bg-[#001740] border-2 border-[#FF0055] text-xs text-white font-mono font-bold relative z-10 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF0055] shrink-0 stroke-[3] mt-px" />
                <div>
                  <div className="text-[#FF0055] mb-1">AI TEACHER UNAVAILABLE</div>
                  <div className="text-sky-100 leading-relaxed">{aiError}</div>
                </div>
              </div>
            )}

            {/* Generated Output */}
            {aiOutput && (
              <div className="space-y-4 pt-2 border-t-2 border-white/30 relative z-10">
                {/* 1. Summary Notes */}
                <div className="p-4 bg-[#001740] border-2 border-white shadow-[3px_3px_0px_#001F5C]">
                  <h4 className="text-xs font-black text-sky-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-p3r">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>STRUCTURED STUDY NOTES</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-white font-medium">
                    {aiOutput.summaryNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#FF0055] font-black text-sm">▶</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Conceptual Architecture Graph */}
                <div className="p-3 bg-[#001740] border-2 border-white">
                  <h4 className="text-xs font-black text-sky-200 uppercase tracking-wider mb-1 font-p3r">
                    CONCEPTUAL KNOWLEDGE GRAPH
                  </h4>
                  <pre className="font-mono text-[11px] text-white font-bold overflow-x-auto whitespace-pre leading-tight">
                    {aiOutput.conceptGraph}
                  </pre>
                </div>

                {/* 3. 5 Quiz Questions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-p3r">
                    5 COMPREHENSION QUIZ QUESTIONS
                  </h4>
                  {aiOutput.quizzes.map((quiz, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#001740] border-2 border-white/60 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-white">
                          <strong className="text-sky-200">Q{idx + 1}.</strong> {quiz.question}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleQuiz(idx)}
                          className="px-2.5 py-1 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white text-[10px] font-black font-p3r uppercase transition-colors shrink-0 flex items-center gap-1 border border-[#001F5C]"
                        >
                          {revealedQuiz[idx] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{revealedQuiz[idx] ? 'HIDE' : 'REVEAL'}</span>
                        </button>
                      </div>

                      {revealedQuiz[idx] && (
                        <div className="pt-2 border-t border-white/30 text-xs space-y-1 bg-[#002673] p-2.5 border border-white">
                          <div className="text-white font-black">
                            Answer: {quiz.answer}
                          </div>
                          <div className="text-[11px] text-sky-100 font-medium italic">
                            Grounding: {quiz.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
