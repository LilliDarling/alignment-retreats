import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, DollarSign, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VenueCardProps {
  id: string;
  name: string;
  location?: string;
  images: string[];
  propertyType: string;
  capacity?: number;
  basePrice?: number;
  minRate?: number;
  maxRate?: number;
  amenities?: string[];
  description?: string;
  onClick?: () => void;
}

export function VenueCard({
  id,
  name,
  location,
  images,
  propertyType,
  capacity,
  basePrice,
  minRate,
  maxRate,
  amenities = [],
  description,
  onClick,
}: VenueCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPriceRange = () => {
    if (basePrice) {
      return `From $${basePrice.toLocaleString()}`;
    }
    if (minRate && maxRate) {
      return `$${minRate.toLocaleString()} - $${maxRate.toLocaleString()}`;
    }
    if (minRate) {
      return `From $${minRate.toLocaleString()}`;
    }
    return 'Contact for pricing';
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      land: 'Land',
      retreat_center: 'Retreat Center',
      venue: 'Venue',
    };
    return labels[type] || type;
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/venue/${id}`);
    }
  };

  const handleInquireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/venue/${id}#inquire`);
  };

  // Get first image or use placeholder
  const displayImage = images && images.length > 0
    ? images[0]
    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';

  // Get first 3 amenities to display
  const displayAmenities = amenities.slice(0, 3);
  const hasMoreAmenities = amenities.length > 3;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Placeholder */}
        {!imageLoaded && <div className="absolute inset-0 bg-accent animate-pulse" />}

        {/* Image */}
        <img
          src={displayImage}
          alt={name}
          loading="lazy"
          className={cn(
            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {/* Property Type Badge */}
        <Badge className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm text-foreground">
          <Home className="h-3 w-3 mr-1" />
          {getPropertyTypeLabel(propertyType)}
        </Badge>

        {/* Image Count Badge */}
        {images && images.length > 1 && (
          <Badge className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-foreground">
            {images.length} photos
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h3
            className="text-xl font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleCardClick}
          >
            {name}
          </h3>

          {/* Location */}
          {location && (
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>


        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayAmenities.map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {hasMoreAmenities && (
              <Badge variant="secondary" className="text-xs">
                +{amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={handleInquireClick}
          variant="default"
        >
          View Details & Inquire
        </Button>
      </div>
    </div>
  );
}
