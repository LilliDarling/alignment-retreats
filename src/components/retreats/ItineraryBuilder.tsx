"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import type { ScheduleDay } from "@/lib/constants/retreat";
import { createEmptyDay, TIME_BLOCKS } from "@/lib/constants/retreat";

interface ItineraryBuilderProps {
  days: ScheduleDay[];
  onChange: (days: ScheduleDay[]) => void;
}

export default function ItineraryBuilder({ days, onChange }: ItineraryBuilderProps) {
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  const updateDay = (index: number, updates: Partial<ScheduleDay>) => {
    const next = [...days];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const updateBlock = (dayIndex: number, blockIndex: number, description: string) => {
    const next = [...days];
    const blocks = [...next[dayIndex].blocks];
    blocks[blockIndex] = { ...blocks[blockIndex], description };
    next[dayIndex] = { ...next[dayIndex], blocks };
    onChange(next);
  };

  const addDay = () => {
    onChange([...days, createEmptyDay(days.length + 1)]);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    const next = days.filter((_, i) => i !== index);
    onChange(next);
    // Clean up collapsed state
    setCollapsedDays((prev) => {
      const s = new Set<number>();
      prev.forEach((i) => {
        if (i < index) s.add(i);
        else if (i > index) s.add(i - 1);
      });
      return s;
    });
  };

  const moveDay = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= days.length) return;
    const next = [...days];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const toggleCollapse = (index: number) => {
    setCollapsedDays((prev) => {
      const s = new Set(prev);
      if (s.has(index)) s.delete(index);
      else s.add(index);
      return s;
    });
  };

  const addCustomBlock = (dayIndex: number) => {
    const next = [...days];
    const blocks = [...next[dayIndex].blocks];
    blocks.push({ time: "", description: "" });
    next[dayIndex] = { ...next[dayIndex], blocks };
    onChange(next);
  };

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    const next = [...days];
    const blocks = next[dayIndex].blocks.filter((_, i) => i !== blockIndex);
    next[dayIndex] = { ...next[dayIndex], blocks };
    onChange(next);
  };

  const updateBlockTime = (dayIndex: number, blockIndex: number, time: string) => {
    const next = [...days];
    const blocks = [...next[dayIndex].blocks];
    blocks[blockIndex] = { ...blocks[blockIndex], time };
    next[dayIndex] = { ...next[dayIndex], blocks };
    onChange(next);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => {
        const isCollapsed = collapsedDays.has(dayIndex);
        const hasContent = day.subtitle || day.outcome || day.blocks.some((b) => b.description);

        return (
          <div
            key={dayIndex}
            className="border border-border rounded-xl overflow-hidden"
          >
            {/* Day Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveDay(dayIndex, -1)}
                  disabled={dayIndex === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDay(dayIndex, 1)}
                  disabled={dayIndex === days.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <button
                type="button"
                onClick={() => toggleCollapse(dayIndex)}
                className="flex-1 flex items-center gap-3 text-left cursor-pointer"
              >
                <span className="text-xs font-bold text-primary uppercase tracking-wider shrink-0">
                  Day {dayIndex + 1}
                </span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {day.title !== `Day ${dayIndex + 1}` ? day.title : ""}
                </span>
                {day.subtitle && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    {day.subtitle}
                  </span>
                )}
                {isCollapsed && hasContent && (
                  <span className="text-xs text-green-600 ml-auto shrink-0">
                    {day.blocks.filter((b) => b.description).length} blocks
                  </span>
                )}
              </button>
              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(dayIndex)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                  title="Remove day"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Day Content */}
            {!isCollapsed && (
              <div className="px-4 py-4 space-y-4">
                {/* Day Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Day Title
                    </label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateDay(dayIndex, { title: e.target.value })}
                      className={inputClass}
                      placeholder={`Day ${dayIndex + 1}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Theme / Subtitle
                    </label>
                    <input
                      type="text"
                      value={day.subtitle}
                      onChange={(e) => updateDay(dayIndex, { subtitle: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Stabilize internally before building externally"
                    />
                  </div>
                </div>

                {/* Time Blocks */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Schedule
                  </label>
                  {day.blocks.map((block, blockIndex) => {
                    const isDefault = (TIME_BLOCKS as readonly string[]).includes(block.time);
                    return (
                      <div key={blockIndex} className="flex gap-2 items-start">
                        <div className="w-28 shrink-0">
                          {isDefault ? (
                            <span className="inline-block px-3 py-2 text-xs font-semibold text-primary bg-primary/10 rounded-lg w-full text-center">
                              {block.time}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={block.time}
                              onChange={(e) => updateBlockTime(dayIndex, blockIndex, e.target.value)}
                              className={`${inputClass} text-xs font-semibold text-center`}
                              placeholder="Time"
                            />
                          )}
                        </div>
                        <textarea
                          value={block.description}
                          onChange={(e) => updateBlock(dayIndex, blockIndex, e.target.value)}
                          className={`${inputClass} resize-none flex-1`}
                          rows={2}
                          placeholder={`What happens during ${block.time || "this block"}...`}
                        />
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => removeBlock(dayIndex, blockIndex)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 mt-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addCustomBlock(dayIndex)}
                    className="text-xs text-primary hover:text-primary/80 font-medium cursor-pointer"
                  >
                    + Add custom time block
                  </button>
                </div>

                {/* Outcome */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Day Outcome
                  </label>
                  <input
                    type="text"
                    value={day.outcome}
                    onChange={(e) => updateDay(dayIndex, { outcome: e.target.value })}
                    className={inputClass}
                    placeholder="What participants will achieve by end of day..."
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Day Button */}
      <button
        type="button"
        onClick={addDay}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Day {days.length + 1}
      </button>
    </div>
  );
}
