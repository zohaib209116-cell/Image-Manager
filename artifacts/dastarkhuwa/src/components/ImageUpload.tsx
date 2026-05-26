import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void;
  uploadFn: (file: File, token: string) => Promise<{ imageUrl: string; publicId: string }>;
  currentImageUrl?: string;
  label?: string;
}

export function ImageUpload({ onUpload, uploadFn, currentImageUrl, label }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: "Invalid file",
        description: "Please select a valid JPG, PNG, or WEBP under 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(20);
    try {
      const token = await user.getIdToken();
      setProgress(60);
      const res = await uploadFn(file, token);
      setProgress(100);
      onUpload(res.imageUrl);
      setPreview(res.imageUrl);
      setFile(null);
      toast({
        title: "Upload Successful",
        description: "Image uploaded successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image.",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {!preview ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-card/50"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP (max 5MB)</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
          <div className="absolute right-2 top-2">
            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md" onClick={clearImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {file && preview && !preview.startsWith("http") && (
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 truncate text-sm text-muted-foreground">
            <ImageIcon className="mr-2 inline h-4 w-4" />
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </div>
      )}

      {progress > 0 && <Progress value={progress} className="h-2 w-full" />}
    </div>
  );
}
