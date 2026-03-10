import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface VenueImageGalleryProps {
  photos: string[];
  videos: string[];
  venueName: string;
}

export function VenueImageGallery({ photos, videos, venueName }: VenueImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine photos and videos into single media array
  const mediaItems: MediaItem[] = [
    ...photos.map(url => ({ url, type: 'image' as const })),
    ...videos.map(url => ({ url, type: 'video' as const })),
  ];

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  if (mediaItems.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden max-h-[360px] flex items-center justify-center bg-accent">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
          alt={`${venueName} - Placeholder`}
          loading="lazy"
          className="max-w-full max-h-[360px] object-contain"
        />
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-4">
        {/* Main Carousel */}
        <Carousel className="w-full">
          <CarouselContent>
            {mediaItems.map((item, index) => (
              <CarouselItem key={index}>
                <div
                  className="relative rounded-lg overflow-hidden max-h-[500px] flex items-center justify-center bg-accent/10"
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`${venueName} - Photo ${index + 1}`}
                      loading="lazy"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <div className="relative max-w-full max-h-[500px]">
                      <video
                        src={item.url}
                        className="max-w-full max-h-[400px] object-contain"
                        poster={item.url}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                        <div className="bg-white/90 rounded-full p-4">
                          <Play className="h-8 w-8 text-primary fill-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {mediaItems.length > 1 && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}
        </Carousel>

        {/* Thumbnail Grid */}
        {mediaItems.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {mediaItems.slice(0, 8).map((item, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors focus:outline-none focus:border-primary"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      poster={item.url}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
            {mediaItems.length > 8 && (
              <button
                onClick={() => openLightbox(8)}
                className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors bg-accent flex items-center justify-center"
              >
                <span className="text-sm font-medium">+{mediaItems.length - 8}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-screen-xl w-full h-[90vh] p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Media Display */}
            <div className="w-full h-full flex items-center justify-center p-8">
              {mediaItems[currentIndex]?.type === 'image' ? (
                <img
                  src={mediaItems[currentIndex]?.url}
                  alt={`${venueName} - ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={mediaItems[currentIndex]?.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              )}
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
