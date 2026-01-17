const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Renders a video from scenes data
 * @param {Object} data { scenes: [], outputPath: string, dimensions: { width: number, height: number } }
 * @param {Function} onProgress 
 */
async function renderVideo(data, onProgress) {
    const { scenes, outputPath, dimensions } = data;
    const tempFiles = [];

    try {
        // 1. Create a temporary folder for processed segments
        const tempDir = path.join(path.dirname(outputPath), 'temp_render_' + Date.now());
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const segmentFiles = [];

        // 2. Process each scene into a temporary video segment
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const segmentPath = path.join(tempDir, `segment_${i}.mp4`);

            // Validate URLs - FFmpeg cannot process blob: URLs
            if (!scene.imageUrl || !scene.audioUrl) {
                console.warn(`Scene ${i} missing imageUrl or audioUrl, skipping`);
                continue;
            }

            // Check for blob URLs which FFmpeg cannot process
            if (scene.imageUrl.startsWith('blob:') || scene.audioUrl?.startsWith('blob:')) {
                console.error(`Scene ${i} has blob URLs which FFmpeg cannot process. URLs must be file paths or HTTP URLs.`);
                throw new Error(`Blob URLs not supported. Please use the Browser Export for blob-based media, or re-generate scenes to get HTTP URLs.`);
            }

            // Use FFmpeg to create a segment from image + audio with Ken Burns Effect
            await new Promise((resolve, reject) => {
                const duration = scene.duration || 5;
                const fps = 30;

                // Ken Burns Directions: Toggle between center-to-corner and corner-to-center
                const isEven = i % 2 === 0;
                // Zoom from 1.0 to 1.15 over the duration
                const zoomExpr = `min(zoom+0.0015,1.15)`;
                // Pan logic based on index parity
                const panX = isEven ? `x+(iw/zoom/2-iw/zoom/2)` : `x`;
                const panY = isEven ? `y` : `y`;

                let command = ffmpeg()
                    .input(scene.imageUrl)
                    .loop(duration) // Loop image input to match duration
                    .input(scene.audioUrl)
                    .videoFilters([
                        `scale=${dimensions.width * 1.2}x${dimensions.height * 1.2},zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * fps}:s=${dimensions.width}x${dimensions.height}:fps=${fps}`
                    ])
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        '-shortest',
                        '-movflags faststart'
                    ])
                    .on('error', (err) => {
                        console.error(`Error processing segment ${i}:`, err);
                        reject(err);
                    })
                    .on('end', resolve)
                    .save(segmentPath);
            });

            segmentFiles.push(segmentPath);
            onProgress((i + 1) / (scenes.length + 1) * 80); // 80% marks segment completion
        }

        // 3. Concatenate all segments
        const concatListPath = path.join(tempDir, 'list.txt');
        const concatListContent = segmentFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(concatListPath, concatListContent);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(concatListPath)
                .inputOptions(['-f concat', '-safe 0'])
                .videoCodec('copy')
                .audioCodec('copy')
                .on('error', reject)
                .on('end', resolve)
                .save(outputPath);
        });

        onProgress(100);

        // 4. Cleanup
        segmentFiles.forEach(f => fs.unlinkSync(f));
        fs.unlinkSync(concatListPath);
        fs.rmdirSync(tempDir);

        return { success: true, path: outputPath };

    } catch (error) {
        console.error('Render Error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { renderVideo };
