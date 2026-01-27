"use client";

import { EFFECT_LIST, EffectType } from "@/lib/effects";

interface EffectSelectorProps {
  selected: EffectType;
  onSelect: (effect: EffectType) => void;
}

export default function EffectSelector({ selected, onSelect }: EffectSelectorProps) {
  return (
    <div className="space-y-0.5">
      {EFFECT_LIST.map((effect) => {
        const isActive = selected === effect.id;
        return (
          <button
            key={effect.id}
            onClick={() => onSelect(effect.id)}
            className={`
              flex items-center gap-2 w-full text-left px-1 py-1 text-sm transition-colors rounded-sm
              ${isActive ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}
            `}
          >
            <span
              className={`
                w-1.5 h-1.5 rounded-full flex-shrink-0
                ${isActive ? "bg-zinc-100" : "border border-zinc-600"}
              `}
            />
            <span className={isActive ? "font-medium" : ""}>{effect.label}</span>
          </button>
        );
      })}
    </div>
  );
}
