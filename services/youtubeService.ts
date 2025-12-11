/**
 * Uploads a video Blob to YouTube using the Data API v3.
 * Note: Requires a valid OAuth 2.0 Access Token with 'https://www.googleapis.com/auth/youtube.upload' scope.
 */
export const uploadVideoToYouTube = async (
  videoBlob: Blob,
  title: string,
  description: string,
  accessToken: string,
  scheduledTime?: Date // Optional: Schedule for later
): Promise<any> => {

  // Metadata for the video resource
  const metadata: any = {
    snippet: {
      title: title.substring(0, 100), // YouTube title limit
      description: description + "\n\n#Shorts #AI #AutoShorts",
      tags: ["AutoShorts", "AI", "Shorts", "Generated"],
      categoryId: "22" // 'People & Blogs' category
    },
    status: {
      privacyStatus: scheduledTime ? "private" : "private", // Always private by default
      selfDeclaredMadeForKids: false,
      // If scheduled, set publishAt time (ISO 8601 format)
      ...(scheduledTime && {
        publishAt: scheduledTime.toISOString(),
        privacyStatus: "private" // Must be private for scheduled videos
      })
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

/**
 * Schedule a video for publishing at a specific time.
 * The video must already be uploaded.
 */
export const scheduleVideoPublish = async (
  videoId: string,
  publishAt: Date,
  accessToken: string
): Promise<any> => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=status`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: videoId,
        status: {
          privacyStatus: 'private',
          publishAt: publishAt.toISOString()
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Schedule failed with status ${response.status}`);
  }

  return await response.json();
};