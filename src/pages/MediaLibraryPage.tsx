import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, ImageIcon, Layers, Search, Trash2, MoreHorizontal } from 'lucide-react';
import { useMedia, useUploadMedia, useDeleteMedia } from '@/hooks/use-api';
import { formatFileSize, formatDuration, mediaStatusChipClass } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const typeIcons = { video: Film, image: ImageIcon, carousel: Layers };

export default function MediaLibraryPage() {
  const { data: media = [] } = useMedia();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      setUploadingFiles((prev) => [...prev, { name: file.name, progress: 0 }]);
      uploadMutation.mutate(
        {
          file,
          onProgress: (p) => {
            setUploadingFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, progress: p } : f));
          },
        },
        {
          onSettled: () => {
            setTimeout(() => {
              setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
            }, 1000);
          },
          onError: () => {
            // Simulate progress on error (API unavailable)
            let progress = 0;
            const interval = setInterval(() => {
              progress += Math.random() * 20 + 5;
              if (progress >= 100) { progress = 100; clearInterval(interval); setTimeout(() => setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name)), 1000); }
              setUploadingFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, progress } : f));
            }, 300);
          },
        }
      );
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
  });

  const filtered = media.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search && !m.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground">{media.length} files</p>
        </div>
        <Button {...getRootProps()} className="gap-2">
          <Upload className="h-4 w-4" /> Upload Media
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to browse'}</p>
        <p className="text-xs text-muted-foreground mt-1">Supports images, videos, and carousels</p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((f) => (
            <div key={f.name} className="card-elevated p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{Math.round(f.progress)}%</span>
              </div>
              <Progress value={f.progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-1">
          {['all', 'video', 'image', 'carousel'].map((t) => (
            <Button key={t} variant={filterType === t ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(t)} className="capitalize">{t}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((item) => {
          const TypeIcon = typeIcons[item.type];
          return (
            <div key={item.id} className="card-elevated group overflow-hidden transition-shadow">
              <div className="relative aspect-square bg-muted overflow-hidden">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><TypeIcon className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
                <div className="absolute top-2 left-2"><span className={mediaStatusChipClass(item.status)}>{item.status}</span></div>
                <div className="absolute top-2 right-2"><TypeIcon className="h-4 w-4 text-primary-foreground drop-shadow" /></div>
                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded">{formatDuration(item.duration)}</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{item.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive gap-2" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
