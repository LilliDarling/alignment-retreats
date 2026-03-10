"use client";

import { Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";

interface ItineraryItem {
  type: "day" | "activity";
  content: string;
}

function getTimeIcon(text: string) {
  const t = text.toLowerCase();
  if (
    t.includes("morning") ||
    t.includes("breakfast") ||
    t.includes("sunrise") ||
    t.includes("6:") ||
    t.includes("7:") ||
    t.includes("8:")
  )
    return <Sunrise className="h-4 w-4" />;
  if (
    t.includes("afternoon") ||
    t.includes("lunch") ||
    t.includes("12:") ||
    t.includes("1:") ||
    t.includes("2:")
  )
    return <Sun className="h-4 w-4" />;
  if (
    t.includes("evening") ||
    t.includes("dinner") ||
    t.includes("sunset") ||
    t.includes("5:") ||
    t.includes("6:") ||
    t.includes("7:")
  )
    return <Sunset className="h-4 w-4" />;
  if (t.includes("night") || t.includes("9:") || t.includes("10:") || t.includes("sleep"))
    return <Moon className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

function parseItinerary(text: string): ItineraryItem[] {
  const lines = text.split(/\n/).filter((line) => line.trim());

  return lines
    .map((line) => {
      const trimmed = line.trim();
      const isDayHeader =
        /^day\s*\d+/i.test(trimmed) ||
        /^day\s*(one|two|three|four|five|six|seven)/i.test(trimmed);

      return {
        type: (isDayHeader ? "day" : "activity") as "day" | "activity",
        content: trimmed.replace(/^[\d]+[.):]?\s*/, "").trim() || trimmed,
      };
    })
    .filter((item) => item.content.length > 0);
}

export default function ItineraryDisplay({ itinerary }: { itinerary: string }) {
  const items = parseItinerary(itinerary);

  return (
    <div className="space-y-3">
      {items.map((item, index) =>
        item.type === "day" ? (
          <div key={index} className={index > 0 ? "pt-6" : ""}>
            <h3 className="text-lg font-bold text-foreground tracking-tight uppercase">
              {item.content}
            </h3>
          </div>
        ) : (
          <div key={index} className="flex items-start gap-3 group">
            <div className="mt-1 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
              {getTimeIcon(item.content)}
            </div>
            <div className="flex-1 bg-white border border-border rounded-xl p-4 group-hover:border-primary/20 transition-colors duration-200">
              <p className="text-foreground leading-relaxed">{item.content}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
