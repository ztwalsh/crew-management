'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { updateAvatar } from '@/actions/profile'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface AvatarUploadProps {
  avatarUrl: string | null
  fullName: string
}

export function AvatarUpload({ avatarUrl, fullName }: AvatarUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set('avatar', file)

      const result = await updateAvatar(formData)

      if (result.error) {
        toast.error(result.error)
        setPreviewUrl(avatarUrl)
        return
      }

      toast.success('Avatar updated')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setPreviewUrl(avatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="size-20">
          <AvatarImage src={previewUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="size-4" />
          Change avatar
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF or WebP. Max 5MB.
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
