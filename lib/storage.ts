import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

export const BUCKET_NAME = 'vow-seoul-storage'

/**
 * Compresses an image file client-side using HTML5 Canvas
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> {
  // Guard for SSR and non-images
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type.includes('svg')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate size maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        let outputType = file.type
        // Convert non-transparent formats to jpeg for maximum compression size
        if (outputType !== 'image/png' && outputType !== 'image/webp' && outputType !== 'image/gif') {
          outputType = 'image/jpeg'
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          outputType,
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads a file to Supabase Storage with automatic client-side compression for images
 * @param file The file to upload
 * @param path The path/folder inside the bucket (e.g. 'invitations/main')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    // Compress image client-side if it's an image
    const processedFile = await compressImage(file)

    const fileExtension = processedFile.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${path}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, processedFile)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('파일 업로드에 실패했습니다.')
  }
}

/**
 * Deletes a file from Supabase Storage using its public URL
 * @param publicUrl The public URL of the file to delete
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  try {
    // Extract the file path from the public URL
    const urlParts = publicUrl.split(`${BUCKET_NAME}/`)
    if (urlParts.length !== 2) return

    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('파일 삭제에 실패했습니다.')
  }
}
