import { useRef } from 'react';
import { 
  Flower2, 
  Brain, 
  Palette, 
  Mountain, 
  Sparkles, 
  Trophy, 
  Heart, 
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

const categories: Category[] = [
  { id: 'yoga', label: 'Yoga & Wellness', icon: Flower2 },
  { id: 'meditation', label: 'Meditation', icon: Brain },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'spiritual', label: 'Spiritual', icon: Sparkles },
  { id: 'leadership', label: 'Leadership', icon: Trophy },
  { id: 'couples', label: 'Couples', icon: Heart },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
];

interface CategoryStripProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryStrip({ selectedCategory, onSelectCategory }: CategoryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group">
      {/* Left Arrow - Mobile hint (positioned outside content area) */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 flex items-center md:hidden pointer-events-none">
        <ChevronLeft className="h-4 w-4 text-muted-foreground animate-pulse" />
      </div>

      {/* Left Arrow - Desktop */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Categories */}
      <div
        ref={scrollRef}
        className="flex items-center justify-start md:justify-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide py-4 px-6 md:px-10 snap-x snap-mandatory touch-pan-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(isSelected ? null : category.id)}
              className={cn(
                'flex flex-col items-center gap-2 min-w-fit transition-all snap-center',
                'hover:text-foreground group/item',
                isSelected 
                  ? 'text-foreground' 
                  : 'text-muted-foreground opacity-70 hover:opacity-100'
              )}
            >
              <Icon className={cn(
                'h-6 w-6 transition-transform group-hover/item:scale-110',
                isSelected && 'text-primary'
              )} />
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                isSelected && 'border-b-2 border-foreground pb-1'
              )}>
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Arrow - Mobile hint (positioned outside content area) */}
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 flex items-center md:hidden pointer-events-none">
        <ChevronRight className="h-4 w-4 text-muted-foreground animate-pulse" />
      </div>

      {/* Right Arrow - Desktop */}
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
