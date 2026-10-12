import React from 'react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  symbol?: string;
  onChange: (value: number) => void;
  description?: string;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  symbol,
  onChange,
  description
}) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {symbol && (
            <span className="font-mono italic font-semibold text-cyan-400">
              {symbol}
            </span>
          )}
          <span className="font-medium text-slate-300">{label}</span>
        </div>
        <span className="font-mono font-semibold tabular-nums text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {typeof value === 'number' && !Number.isInteger(step) ? value.toFixed(2) : value}{' '}
          <span className="text-slate-400 font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
      />
      {description && (
        <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
      )}
    </div>
  );
};
