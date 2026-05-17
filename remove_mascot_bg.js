const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const images = [
    'zenith.png',
    'monk.png',
    'beast.png',
    'furious_boy.png',
    'buddy.png',
    'cosmic_sage.png'
];

const assetsDir = path.join(__dirname, 'mobile-app', 'assets', 'images');

async function removeBackground() {
    console.log('🚀 Starting Mascot Background Removal...');

    for (const imageName of images) {
        const filePath = path.join(assetsDir, imageName);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            continue;
        }

        try {
            const image = await Jimp.read(filePath);
            
            // Define white color threshold
            // Most white backgrounds aren't perfect (255,255,255), so we use a small tolerance
            const threshold = 240; 

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];

                // If pixel is very close to white, make it transparent
                if (r > threshold && g > threshold && b > threshold) {
                    this.bitmap.data[idx + 3] = 0; // Set Alpha to 0
                }
            });

            await image.writeAsync(filePath);
            console.log(`✅ Processed: ${imageName} (Background removed)`);
        } catch (err) {
            console.error(`❌ Error processing ${imageName}:`, err);
        }
    }
    console.log('✨ All mascots updated successfully.');
}

removeBackground();
