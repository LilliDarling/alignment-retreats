import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (filters: { location: string; type: string; dates?: { from?: Date; to?: Date } }) => void;
  variant?: 'hero' | 'compact';
}

const retreatTypes = [
  'All Types',
  'Yoga & Wellness',
  'Meditation & Mindfulness',
  'Creative & Artistic',
  'Adventure & Outdoor',
  'Spiritual & Healing',
  'Leadership & Personal Growth',
  'Couples & Relationships',
  'Corporate & Team Building',
];

export function SearchBar({ onSearch, variant = 'hero' }: SearchBarProps) {
  const [location, setLocation] = useState('');
  const [retreatType, setRetreatType] = useState('All Types');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const handleSearch = () => {
    onSearch?.({ location, type: retreatType, dates: dateRange });
  };

  const formatDateDisplay = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
    }
    if (dateRange.from) {
      return format(dateRange.from, 'MMM d');
    }
    return 'Any week';
  };

  if (variant === 'compact') {
    return (
      <div 
        onClick={handleSearch}
        className="flex items-center bg-card border border-border rounded-full px-1 py-1 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center divide-x divide-border">
          <span className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50 rounded-l-full transition-colors">
            {location || 'Anywhere'}
          </span>
          <span className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors">
            {formatDateDisplay()}
          </span>
          <span className="px-4 py-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-r-full transition-colors">
            {retreatType === 'All Types' ? 'Any type' : retreatType}
          </span>
        </div>
        <Button size="sm" className="rounded-full h-8 w-8 p-0 ml-1 shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-full shadow-2xl border border-border max-w-3xl mx-auto text-left">
      <div className="flex items-center p-1 sm:p-1.5">
        {/* Where */}
        <div className="flex-[1.2] min-w-0 px-2 py-1.5 sm:px-5 sm:py-3 rounded-full hover:bg-accent/50 transition-colors cursor-pointer">
          <input
            type="text"
            placeholder="Where to?"
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground font-medium text-left"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="h-4 sm:h-6 w-px bg-border shrink-0" />

        {/* When */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-1 min-w-0 px-2 py-1.5 sm:px-5 sm:py-3 rounded-full hover:bg-accent/50 transition-colors cursor-pointer text-left">
              <span
                className={cn(
                  "block w-full text-xs sm:text-sm font-medium text-left truncate",
                  dateRange.from ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {formatDateDisplay()}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card" align="center">
            <Calendar
              mode="range"
              selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <div className="h-4 sm:h-6 w-px bg-border shrink-0" />

        {/* Type */}
        <div className="flex-1 min-w-0 px-2 py-1.5 sm:px-5 sm:py-3 rounded-full hover:bg-accent/50 transition-colors">
          <Select value={retreatType} onValueChange={setRetreatType}>
            <SelectTrigger className="border-none shadow-none p-0 h-auto text-xs sm:text-sm focus:ring-0 w-full bg-transparent font-medium text-left justify-between [&>span]:text-left [&>span]:truncate">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {retreatTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <Button
          onClick={handleSearch}
          size="lg"
          className="rounded-full h-9 w-9 sm:h-12 sm:w-12 p-0 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200"
          aria-label="Search retreats"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}
