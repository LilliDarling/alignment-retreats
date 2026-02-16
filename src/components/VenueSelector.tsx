import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, Home, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Venue {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  property_type: string;
  photos: string[] | null;
}

interface VenueSelectorProps {
  value: string | null;
  onChange: (venueId: string | null) => void;
  onCustomVenueChange?: (customVenueName: string) => void;
  customVenueValue?: string;
  label?: string;
  description?: string;
}

export function VenueSelector({
  value,
  onChange,
  onCustomVenueChange,
  customVenueValue = '',
  label = "Venue",
  description
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [useCustomVenue, setUseCustomVenue] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, location, capacity, property_type, photos')
        .eq('status', 'published')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      land: 'Land',
      retreat_center: 'Retreat Center',
      venue: 'Venue',
    };
    return labels[type] || type;
  };

  const selectedVenue = venues.find(v => v.id === value);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Toggle between listed venues and custom venue */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!useCustomVenue ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUseCustomVenue(false);
            if (onCustomVenueChange) onCustomVenueChange('');
          }}
        >
          Select Listed Venue
        </Button>
        <Button
          type="button"
          variant={useCustomVenue ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUseCustomVenue(true);
            onChange(null);
          }}
        >
          Use Custom Venue
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : useCustomVenue ? (
        /* Custom Venue Input */
        <div className="space-y-2">
          <Input
            placeholder="Enter your venue name or location"
            value={customVenueValue}
            onChange={(e) => onCustomVenueChange?.(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use this if you're hosting at your own property that isn't listed on the platform
          </p>
        </div>
      ) : (
        /* Listed Venue Selector */
        <Select value={value || 'none'} onValueChange={(val) => onChange(val === 'none' ? null : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a venue (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">No venue selected</span>
            </SelectItem>
            {venues.map(venue => (
              <SelectItem key={venue.id} value={venue.id}>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{venue.name}</span>
                  {venue.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {venue.location}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Selected Venue Preview */}
      {selectedVenue && (
        <div className="mt-3 p-4 border rounded-lg bg-accent/50">
          <div className="flex gap-4">
            {/* Venue Thumbnail */}
            {selectedVenue.photos && selectedVenue.photos.length > 0 && (
              <img
                src={selectedVenue.photos[0]}
                alt={selectedVenue.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}

            {/* Venue Details */}
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold">{selectedVenue.name}</h4>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {getPropertyTypeLabel(selectedVenue.property_type)}
                </Badge>
                {selectedVenue.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedVenue.location}
                  </span>
                )}
                {selectedVenue.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Up to {selectedVenue.capacity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
