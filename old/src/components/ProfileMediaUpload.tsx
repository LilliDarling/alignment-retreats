import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Upload, Image as ImageIcon, Video, Camera, Trash2 } from 'lucide-react';
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

interface ProfileMediaUploadProps {
  profilePhoto?: string;
  onProfilePhotoChange: (url: string | null) => void;
  portfolioPhotos?: string[];
  onPortfolioPhotosChange: (urls: string[]) => void;
  portfolioVideos?: string[];
  onPortfolioVideosChange: (urls: string[]) => void;
  userName?: string;
}

export function ProfileMediaUpload({
  profilePhoto,
  onProfilePhotoChange,
  portfolioPhotos = [],
  onPortfolioPhotosChange,
  portfolioVideos = [],
  onPortfolioVideosChange,
  userName = 'User',
}: ProfileMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const portfolioPhotoInputRef = useRef<HTMLInputElement>(null);
  const portfolioVideoInputRef = useRef<HTMLInputElement>(null);
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

  const uploadProfilePhoto = async (file: File) => {
    if (!validateFile(file, 'image')) return;

    setUploadingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      // Delete old profile photo if exists
      if (profilePhoto) {
        const oldPath = profilePhoto.split('/').slice(-2).join('/');
        await supabase.storage.from('profile-photos').remove([oldPath]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(data.path);

      onProfilePhotoChange(publicUrl);
      toast({
        title: 'Profile photo updated',
        description: 'Your profile photo has been uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingProfile(false);
    }
  };

  const deleteProfilePhoto = async () => {
    if (!profilePhoto) return;

    try {
      const oldPath = profilePhoto.split('/').slice(-2).join('/');
      await supabase.storage.from('profile-photos').remove([oldPath]);
      onProfilePhotoChange(null);
      toast({
        title: 'Photo removed',
        description: 'Profile photo has been deleted',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const handlePortfolioFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video'
  ) => {
    const files = Array.from(event.target.files || []);
    const currentCount = type === 'image' ? portfolioPhotos.length : portfolioVideos.length;
    const maxCount = type === 'image' ? 20 : 5;

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
      uploadPortfolioFile(mediaFile);
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const uploadPortfolioFile = async (mediaFile: MediaFile) => {
    try {
      setMediaFiles(prev =>
        prev.map(f => (f.id === mediaFile.id ? { ...f, uploading: true } : f))
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('portfolio-media')
        .upload(fileName, mediaFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-media')
        .getPublicUrl(data.path);

      setMediaFiles(prev =>
        prev.map(f =>
          f.id === mediaFile.id
            ? { ...f, uploading: false, uploaded: true, progress: 100, uploadedUrl: publicUrl }
            : f
        )
      );

      // Add to portfolio arrays
      if (mediaFile.type === 'image') {
        const newPhotos = [...portfolioPhotos, publicUrl];
        onPortfolioPhotosChange(newPhotos);
      } else {
        const newVideos = [...portfolioVideos, publicUrl];
        onPortfolioVideosChange(newVideos);
      }

      toast({
        title: 'Upload successful',
        description: `${mediaFile.type === 'image' ? 'Photo' : 'Video'} added to portfolio`,
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

  const deletePortfolioMedia = async (url: string, type: 'image' | 'video') => {
    try {
      const path = url.split('/').slice(-2).join('/');
      await supabase.storage.from('portfolio-media').remove([path]);

      if (type === 'image') {
        const newPhotos = portfolioPhotos.filter(u => u !== url);
        onPortfolioPhotosChange(newPhotos);
      } else {
        const newVideos = portfolioVideos.filter(u => u !== url);
        onPortfolioVideosChange(newVideos);
      }

      toast({
        title: 'Media deleted',
        description: `${type === 'image' ? 'Photo' : 'Video'} removed from portfolio`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    }
  };

  const removeUploadingMedia = (id: string) => {
    const mediaFile = mediaFiles.find(f => f.id === id);
    if (mediaFile?.uploadedUrl) {
      deletePortfolioMedia(mediaFile.uploadedUrl, mediaFile.type);
    }
    setMediaFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Profile Photo Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a professional headshot (JPEG, PNG, WebP, max 10MB)
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profilePhoto} alt={userName} />
            <AvatarFallback className="text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => profilePhotoInputRef.current?.click()}
              disabled={uploadingProfile}
            >
              {uploadingProfile ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>

            {profilePhoto && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={deleteProfilePhoto}
                disabled={uploadingProfile}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadProfilePhoto(file);
            }}
          />
        </div>
      </div>

      {/* Portfolio Photos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Portfolio Photos</h3>
            <p className="text-sm text-muted-foreground">
              Showcase your work (up to 20 photos, max 10MB each)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => portfolioPhotoInputRef.current?.click()}
            disabled={portfolioPhotos.length >= 20}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add Photos ({portfolioPhotos.length}/20)
          </Button>
        </div>

        <input
          ref={portfolioPhotoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handlePortfolioFileSelect(e, 'image')}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing photos */}
          {portfolioPhotos.map(url => (
            <Card key={url} className="relative aspect-square overflow-hidden group">
              <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deletePortfolioMedia(url, 'image')}
              >
                <Trash2 className="h-4 w-4" />
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
                  onClick={() => removeUploadingMedia(mediaFile.id)}
                  disabled={mediaFile.uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
        </div>
      </div>

      {/* Portfolio Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Portfolio Videos</h3>
            <p className="text-sm text-muted-foreground">
              Share video samples of your work (up to 5 videos, max 100MB each)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => portfolioVideoInputRef.current?.click()}
            disabled={portfolioVideos.length >= 5}
          >
            <Video className="h-4 w-4 mr-2" />
            Add Videos ({portfolioVideos.length}/5)
          </Button>
        </div>

        <input
          ref={portfolioVideoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={(e) => handlePortfolioFileSelect(e, 'video')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Existing videos */}
          {portfolioVideos.map(url => (
            <Card key={url} className="relative aspect-video overflow-hidden group">
              <video src={url} className="w-full h-full object-cover" controls />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deletePortfolioMedia(url, 'video')}
              >
                <Trash2 className="h-4 w-4" />
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
                  onClick={() => removeUploadingMedia(mediaFile.id)}
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
