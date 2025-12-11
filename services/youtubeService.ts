/**
 * Uploads a video Blob to YouTube using the Data API v3.
 * Note: Requires a valid OAuth 2.0 Access Token with 'https://www.googleapis.com/auth/youtube.upload' scope.
 */
export const uploadVideoToYouTube = async (
  videoBlob: Blob,
  title: string,
  description: string,
  accessToken: string
): Promise<any> => {
  
  // Metadata for the video resource
  const metadata = {
    snippet: {
      title: title.substring(0, 100), // YouTube title limit
      description: description + "\n\n#Shorts #AI #AutoShorts",
      tags: ["AutoShorts", "AI", "Shorts", "Generated"],
      categoryId: "22" // 'People & Blogs' category
    },
    status: {
      privacyStatus: "private", // Default to private for safety
      selfDeclaredMadeForKids: false
    }
  };

  // Create multipart/related request body
  const formData = new FormData();
  formData.append(
    'metadata', 
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', videoBlob);

  // Perform the upload
  const response = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', 
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Note: Content-Type is set automatically by fetch when using FormData
      },
      body: formData
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
  }

  return await response.json();
};