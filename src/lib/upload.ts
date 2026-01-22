/**
 * Upload a file to S3 using a presigned URL with progress tracking
 */
export const uploadToS3 = (
  file: File,
  presignedUrl: string,
  onProgress: (percent: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    // Handle network errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    // Handle aborted uploads
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'))
    })

    // Start the upload
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
