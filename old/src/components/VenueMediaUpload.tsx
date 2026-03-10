import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  uploading: boolean;
  progress: number;
  uploaded: boolean;
  uploadedUrl?: string;
}

interface VenueMediaUploadProps {
  onPhotosChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  maxPhotos?: number;
  maxVideos?: number;
  existingPhotos?: string[];
  existingVideos?: string[];
}

export function VenueMediaUpload({
  onPhotosChange,
  onVideosChange,
  maxPhotos = 20,
  maxVideos = 5,
  existingPhotos = [],
  existingVideos = [],
}: VenueMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(existingPhotos);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>(existingVideos);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File, type: 'image' | 'video'): boolean => {
    const maxSizeMB = type === 'image' ? 10 : 100;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `${type === 'image' ? 'Images' : 'Videos'} must be under ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return false;
    }

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const validTypes = type === 'image' ? validImageTypes : validVideoTypes;

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `Please upload ${type === 'image' ? 'JPEG, PNG, or WebP images' : 'MP4, MOV, or WebM videos'}`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(event.target.files || []);
    const currentCount = type === 'image' ? uploadedPhotos.length : uploadedVideos.length;
    const maxCount = type === 'image' ? maxPhotos : maxVideos;

    if (currentCount + files.length > maxCount) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxCount} ${type === 'image' ? 'photos' : 'videos'}`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter(file => validateFile(file, type));

    const newMediaFiles: MediaFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      type,
      uploading: false,
      progress: 0,
      uploaded: false,
    }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);

    // Auto-upload files
    newMediaFiles.forEach(mediaFile => {
      uploadFile(mediaFile);
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const uploadFile = async (mediaFile: MediaFile) => {
    try {
      setMediaFiles(prev =>
        prev.map(f => (f.id === mediaFile.id ? { ...f, uploading: true } : f))
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      const bucket = mediaFile.type === 'image' ? 'property-photos' : 'property-videos';
      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, mediaFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      // Update state
      setMediaFiles(prev =>
        prev.map(f =>
          f.id === mediaFile.id
            ? { ...f, uploading: false, uploaded: true, progress: 100, uploadedUrl: publicUrl }
            : f
        )
      );

      // Add to uploaded arrays (use functional updates to avoid stale closure)
      if (mediaFile.type === 'image') {
        setUploadedPhotos(prev => {
          const newPhotos = [...prev, publicUrl];
          onPhotosChange(newPhotos);
          return newPhotos;
        });
      } else {
        setUploadedVideos(prev => {
          const newVideos = [...prev, publicUrl];
          onVideosChange(newVideos);
          return newVideos;
        });
      }

      toast({
        title: 'Upload successful',
        description: `${mediaFile.type === 'image' ? 'Photo' : 'Video'} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setMediaFiles(prev => prev.filter(f => f.id !== mediaFile.id));
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const removeMedia = (id: string) => {
    const mediaFile = mediaFiles.find(f => f.id === id);
    if (mediaFile?.uploadedUrl) {
      if (mediaFile.type === 'image') {
        const newPhotos = uploadedPhotos.filter(url => url !== mediaFile.uploadedUrl);
        setUploadedPhotos(newPhotos);
        onPhotosChange(newPhotos);
      } else {
        const newVideos = uploadedVideos.filter(url => url !== mediaFile.uploadedUrl);
        setUploadedVideos(newVideos);
        onVideosChange(newVideos);
      }
    }
    setMediaFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeExistingMedia = (url: string, type: 'image' | 'video') => {
    if (type === 'image') {
      const newPhotos = uploadedPhotos.filter(u => u !== url);
      setUploadedPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } else {
      const newVideos = uploadedVideos.filter(u => u !== url);
      setUploadedVideos(newVideos);
      onVideosChange(newVideos);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Photos</h3>
            <p className="text-sm text-muted-foreground">
              Upload up to {maxPhotos} photos (JPEG, PNG, WebP, max 10MB each)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadedPhotos.length >= maxPhotos}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add Photos ({uploadedPhotos.length}/{maxPhotos})
          </Button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => handleFileSelect(e, 'image')}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing photos */}
          {existingPhotos.map(url => (
            <Card key={url} className="relative aspect-square overflow-hidden group">
              <img src={url} alt="Venue" className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeExistingMedia(url, 'image')}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}

          {/* New/uploading photos */}
          {mediaFiles
            .filter(f => f.type === 'image')
            .map(mediaFile => (
              <Card key={mediaFile.id} className="relative aspect-square overflow-hidden">
                <img src={mediaFile.url} alt="Preview" className="w-full h-full object-cover" />
                {mediaFile.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 animate-bounce" />
                      <Progress value={mediaFile.progress} className="w-20" />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => removeMedia(mediaFile.id)}
                  disabled={mediaFile.uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
        </div>
      </div>

      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Videos</h3>
            <p className="text-sm text-muted-foreground">
              Upload up to {maxVideos} videos (MP4, MOV, WebM, max 100MB each)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadedVideos.length >= maxVideos}
          >
            <Video className="h-4 w-4 mr-2" />
            Add Videos ({uploadedVideos.length}/{maxVideos})
          </Button>
        </div>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={e => handleFileSelect(e, 'video')}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Existing videos */}
          {existingVideos.map(url => (
            <Card key={url} className="relative aspect-video overflow-hidden group">
              <video src={url} className="w-full h-full object-cover" controls />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeExistingMedia(url, 'video')}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}

          {/* New/uploading videos */}
          {mediaFiles
            .filter(f => f.type === 'video')
            .map(mediaFile => (
              <Card key={mediaFile.id} className="relative aspect-video overflow-hidden">
                <video src={mediaFile.url} className="w-full h-full object-cover" controls />
                {mediaFile.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 animate-bounce" />
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => removeMedia(mediaFile.id)}
                  disabled={mediaFile.uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
