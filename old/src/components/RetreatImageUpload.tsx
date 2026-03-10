import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RetreatImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function RetreatImageUpload({ value, onChange }: RetreatImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadPhoto = async (file: File) => {
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({ title: 'File too large', description: 'Images must be under 10MB', variant: 'destructive' });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload JPEG, PNG, or WebP images', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      // Delete old photo if exists
      if (value) {
        const oldPath = value.split('/').slice(-2).join('/');
        await supabase.storage.from('retreat-photos').remove([oldPath]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('retreat-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-photos')
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast({ title: 'Cover photo uploaded', description: 'Your retreat cover photo has been added' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!value) return;
    try {
      const path = value.split('/').slice(-2).join('/');
      await supabase.storage.from('retreat-photos').remove([path]);
      onChange(null);
      toast({ title: 'Photo removed', description: 'Cover photo has been deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Delete failed', description: 'Failed to delete photo', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border">
          <img src={value} alt="Retreat cover" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center aspect-[4/3] w-full max-w-md rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Click to add a cover photo</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {value ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>

        {value && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={deletePhoto}
            disabled={uploading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPhoto(file);
          if (e.target) e.target.value = '';
        }}
      />
    </div>
  );
}
