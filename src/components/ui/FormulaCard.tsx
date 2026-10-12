import React from 'react';
import { BookOpen } from 'lucide-react';

interface FormulaCardProps {
  title: string;
  formula: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
  liveResult?: { label: string; value: string };
  principle?: string;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  formula,
  variables,
  liveResult,
  principle
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-semibold text-slate-200">{title}</h4>
        </div>
        {liveResult && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">{liveResult.label}</span>
            <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
              {liveResult.value}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-slate-950 p-2.5 text-center border border-slate-800/80">
        <code className="text-sm font-semibold text-cyan-300 font-mono tracking-wide">
          {formula}
        </code>
      </div>

      {principle && (
        <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-cyan-500/40 pl-2.5">
          {principle}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
        {variables.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="font-mono font-medium text-cyan-400 italic shrink-0">{v.symbol}</span>
            <span className="text-slate-400">=</span>
            <span className="text-slate-300 truncate">{v.meaning} {v.unit ? `(${v.unit})` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
