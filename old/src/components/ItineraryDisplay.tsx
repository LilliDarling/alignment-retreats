import { Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react';

interface ItineraryDisplayProps {
  itinerary: string;
}

interface ItineraryItem {
  type: 'day' | 'activity';
  content: string;
}

const getTimeIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('morning') || lowerText.includes('breakfast') || lowerText.includes('sunrise') || lowerText.includes('6:') || lowerText.includes('7:') || lowerText.includes('8:')) {
    return <Sunrise className="h-4 w-4" />;
  }
  if (lowerText.includes('afternoon') || lowerText.includes('lunch') || lowerText.includes('12:') || lowerText.includes('1:') || lowerText.includes('2:')) {
    return <Sun className="h-4 w-4" />;
  }
  if (lowerText.includes('evening') || lowerText.includes('dinner') || lowerText.includes('sunset') || lowerText.includes('5:') || lowerText.includes('6:') || lowerText.includes('7:')) {
    return <Sunset className="h-4 w-4" />;
  }
  if (lowerText.includes('night') || lowerText.includes('9:') || lowerText.includes('10:') || lowerText.includes('sleep')) {
    return <Moon className="h-4 w-4" />;
  }
  return <Clock className="h-4 w-4" />;
};

export function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  const parseItinerary = (text: string): ItineraryItem[] => {
    const lines = text.split(/\n/).filter(line => line.trim());
    
    return lines.map(line => {
      const trimmed = line.trim();
      // Check if this is a day header (e.g., "Day 1:", "Day 1", "Day One", etc.)
      const isDayHeader = /^day\s*\d+/i.test(trimmed) || /^day\s*(one|two|three|four|five|six|seven)/i.test(trimmed);
      
      return {
        type: (isDayHeader ? 'day' : 'activity') as 'day' | 'activity',
        content: trimmed.replace(/^[\d]+[\.\)\:]?\s*/, '').trim() || trimmed
      };
    }).filter(item => item.content.length > 0);
  };

  const items = parseItinerary(itinerary);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        item.type === 'day' ? (
          <div 
            key={index}
            className={index > 0 ? 'pt-6' : ''}
          >
            <h3 className="text-lg font-bold text-foreground tracking-tight uppercase">
              {item.content}
            </h3>
          </div>
        ) : (
          <div 
            key={index}
            className="flex items-start gap-3 group"
          >
            <div className="mt-1 h-8 w-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
              {getTimeIcon(item.content)}
            </div>
            <div className="flex-1 bg-card border border-border rounded-xl p-4 group-hover:border-primary/20 transition-colors duration-200">
              <p className="text-foreground leading-relaxed">{item.content}</p>
            </div>
          </div>
        )
      ))}
    </div>
  );
}
