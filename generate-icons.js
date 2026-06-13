const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const inputImage = path.join(__dirname, 'model icon.jpg');
  const publicDir = path.join(__dirname, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  try {
    const image = await Jimp.read(inputImage);

    // 192x192
    const img192 = image.clone().contain({ w: 192, h: 192, background: 0xFFFFFFFF });
    await img192.write(path.join(publicDir, 'icon-192x192.png'));
    console.log('Generated icon-192x192.png');

    // 512x512
    const img512 = image.clone().contain({ w: 512, h: 512, background: 0xFFFFFFFF });
    await img512.write(path.join(publicDir, 'icon-512x512.png'));
    console.log('Generated icon-512x512.png');

    // apple-touch-icon 180x180
    const img180 = image.clone().contain({ w: 180, h: 180, background: 0xFFFFFFFF });
    await img180.write(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
