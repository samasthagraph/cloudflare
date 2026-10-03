import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  const input = path.join(__dirname, 'public', 'Favicon.png');
  const outputDir = path.join(__dirname, 'public');

  try {
    // 32x32
    await sharp(input)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
      
    // 16x16
    await sharp(input)
      .resize(16, 16)
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
      
    // apple-touch-icon 180x180
    await sharp(input)
      .resize(180, 180)
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
      
    console.log('Icons generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
