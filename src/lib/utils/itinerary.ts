import type { ItineraryDay } from "@/lib/types";
import type { ScheduleDay } from "@/lib/constants/retreat";

/** Convert structured ScheduleDay[] to display-ready ItineraryDay[] */
function fromStructured(days: ScheduleDay[]): ItineraryDay[] {
  return days.map((day, index) => ({
    day: index + 1,
    title: day.title || `Day ${index + 1}`,
    theme: day.subtitle || undefined,
    activities: day.blocks
      .filter((b) => b.description.trim())
      .map((b) => ({
        time: b.time,
        description: b.description,
      })),
    outcome: day.outcome || undefined,
  }));
}

/** Parse plain-text sample_itinerary into structured ItineraryDay[] for the timeline.
 *  Handles both JSON (new structured format) and legacy freeform text. */
export function parseItineraryText(text: string): ItineraryDay[] {
  if (!text) return [];

  // Try JSON first (new structured format)
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0 && "blocks" in parsed[0]) {
      return fromStructured(parsed as ScheduleDay[]);
    }
  } catch {
    // Not JSON — fall through to legacy parser
  }

  // Legacy freeform text parser
  const lines = text.split(/\n/).filter((l) => l.trim());
  const days: ItineraryDay[] = [];
  let current: ItineraryDay | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Match day headers like "Day 1", "Day 1:", "Day 1 - Arrival & Grounding"
    const dayMatch = trimmed.match(/^day\s*(\d+)\s*[-:.]?\s*(.*)/i);
    if (dayMatch) {
      if (current) days.push(current);
      current = {
        day: parseInt(dayMatch[1]),
        title: dayMatch[2] || `Day ${dayMatch[1]}`,
        activities: [],
      };
      continue;
    }

    // Try to extract time + description (e.g. "6:00 AM - Sunrise meditation" or "Morning: yoga")
    const timeMatch = trimmed.match(
      /^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–:]\s*(.+)/
    );
    const periodMatch = timeMatch ? null : trimmed.match(/^(Morning|Midday|Afternoon|Evening|Night)\s*[-–:]\s*(.+)/i);

    if (current) {
      if (timeMatch) {
        current.activities.push({
          time: timeMatch[1],
          description: timeMatch[2],
        });
      } else if (periodMatch) {
        current.activities.push({
          time: periodMatch[1],
          description: periodMatch[2],
        });
      } else {
        current.activities.push({ time: "", description: trimmed });
      }
    } else {
      // No day header yet — create a default Day 1
      current = { day: 1, title: "Schedule", activities: [] };
      if (timeMatch) {
        current.activities.push({
          time: timeMatch[1],
          description: timeMatch[2],
        });
      } else if (periodMatch) {
        current.activities.push({
          time: periodMatch[1],
          description: periodMatch[2],
        });
      } else {
        current.activities.push({ time: "", description: trimmed });
      }
    }
  }

  if (current) days.push(current);
  return days;
}
