import { supabaseAdmin } from './supabase.js'

export interface UploadOptions {
  bucket: string
  path: string
  file: Buffer | File
  contentType?: string
}

/**
 * Upload file to Supabase Storage and return public URL
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType = 'image/jpeg'
}: UploadOptions): Promise<{ url: string; path: string }> {
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true // Replace if exists
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Generate unique filename with timestamp
 */
export function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  const name = prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
  return `${name}.${extension}`
}