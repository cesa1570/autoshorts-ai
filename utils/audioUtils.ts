/**
 * Decodes base64 string to a Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes audio data from Gemini.
 * Uses OfflineAudioContext to avoid "Too many AudioContexts" errors on the main thread.
 */
export async function decodeAudioData(
  base64Data: string,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const bytes = decode(base64Data);
  
  // Use OfflineAudioContext which doesn't count towards the browser's hardware audio context limit.
  // We set length to 1 because we just need the context instance methods initially.
  // Standard browsers support OfflineAudioContext.
  const CtxClass = (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext);
  if (!CtxClass) {
      throw new Error("Browser does not support OfflineAudioContext");
  }
  
  // Create a minimal offline context just for decoding capabilities
  const ctx = new CtxClass(numChannels, 1, sampleRate);

  try {
    // STRATEGY 1: Native Decode (Best for WAV/MP3)
    try {
        const bufferCopy = bytes.buffer.slice(0);
        const decodedBuffer = await ctx.decodeAudioData(bufferCopy);
        return decodedBuffer;
    } catch (nativeError) {
        // Fallback to manual PCM if native decode fails (common for raw raw audio)
    }

    // STRATEGY 2: Manual Raw PCM Decode (Fallback for Gemini Raw Stream)
    // Assumes 16-bit Little Endian PCM
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length / numChannels;
    
    // Create buffer with the correct size using the offline context
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    
    return buffer;

  } catch (e) {
    console.error("Audio Decode Error:", e);
    throw e;
  }
  // No need to close OfflineAudioContext, it's one-off.
}