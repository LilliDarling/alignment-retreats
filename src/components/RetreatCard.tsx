import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Calendar, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { parseDateOnly } from '@/lib/dateOnly';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RetreatCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  rating?: number;
  reviewsCount?: number;
  hostName?: string;
  retreatType?: string;
  maxAttendees?: number;
  sampleItinerary?: string;
  onBook?: () => void;
  onCollaborate?: () => void;
  onClick?: () => void;
}

export function RetreatCard({
  id,
  title,
  location,
  image,
  startDate,
  endDate,
  pricePerPerson,
  rating,
  reviewsCount,
  hostName,
  retreatType,
  maxAttendees,
  sampleItinerary,
  onBook,
  onCollaborate,
  onClick,
}: RetreatCardProps) {
  const navigate = useNavigate();
  const [showItinerary, setShowItinerary] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDateRange = () => {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 'Dates TBD';
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  };

  const getDuration = () => {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 'Duration TBD';
    const days = Math.max(1, differenceInCalendarDays(end, start));
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/retreat/${id}`);
    }
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook();
    } else {
      navigate(`/retreat/${id}`);
    }
  };
  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div 
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-accent animate-pulse" />
        )}
        
        {/* Image */}
        <img
          src={image}
          alt={title}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Retreat Type Badge */}
        {retreatType && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium"
          >
            {retreatType}
          </Badge>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 transition-transform bg-card/20 backdrop-blur-sm"
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              isLiked 
                ? 'fill-red-500 stroke-red-500' 
                : 'fill-transparent stroke-white stroke-2'
            )}
          />
        </button>

        {/* Duration Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium">
          <Calendar className="h-4 w-4" />
          <span>{getDuration()}</span>
        </div>

        {/* Rating Badge */}
        {rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-xs font-semibold text-foreground">{rating}</span>
            {reviewsCount && (
              <span className="text-xs text-muted-foreground">({reviewsCount})</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Host */}
        <div className="space-y-1">
        <h3 
            className="font-semibold text-foreground line-clamp-2 text-base leading-snug cursor-pointer hover:text-primary transition-colors"
            onClick={handleCardClick}
          >
            {title}
          </h3>
          {hostName && (
            <p className="text-sm text-muted-foreground">
              Hosted by <span className="font-medium text-foreground">{hostName}</span>
            </p>
          )}
        </div>

        {/* Location & Dates */}
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange()}</span>
          </div>
          {maxAttendees && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Up to {maxAttendees} attendees</span>
            </div>
          )}
        </div>

        {/* Sample Itinerary Preview */}
        {sampleItinerary && (
          <div className="border-t border-border pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowItinerary(!showItinerary);
              }}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span>Sample Itinerary</span>
              {showItinerary ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showItinerary && (
              <div className="mt-2 text-xs text-muted-foreground whitespace-pre-line max-h-32 overflow-y-auto">
                {sampleItinerary}
              </div>
            )}
          </div>
        )}

        {/* Price & CTAs */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-foreground">${pricePerPerson.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground"> / person</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleBookNow}
            className="w-full rounded-full text-sm font-semibold"
            size="sm"
          >
            Reserve Spot
          </Button>
        </div>
      </div>
    </div>
  );
}
