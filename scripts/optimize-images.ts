import sharp from "sharp";
import fs from "fs";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 80;

async function optimizeImages() {
  console.log("🖼️  Starting image optimization...\n");

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  console.log(`Found ${files.length} images to optimize\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processed = 0;
  let failures = 0;

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const originalStats = fs.statSync(filePath);
    totalOriginalSize += originalStats.size;

    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Only resize if larger than max dimensions
      let resizeOptions = {};
      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT)
      ) {
        resizeOptions = {
          width: MAX_WIDTH,
          height: MAX_HEIGHT,
          fit: "inside" as const,
          withoutEnlargement: true,
        };
      }

      const outputBuffer = await image
        .resize(resizeOptions)
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer();

      // Output is always JPEG, so the file must have a .jpg extension to match
      // its actual bytes (and what the app requests: N.jpg). For .png/.jpeg
      // inputs, write the JPEG to a .jpg path and remove the mislabeled original
      // instead of overwriting JPEG bytes under a non-.jpg name.
      const ext = path.extname(file);
      const outputPath =
        ext.toLowerCase() === ".jpg"
          ? filePath
          : path.join(IMAGES_DIR, `${path.basename(file, ext)}.jpg`);

      fs.writeFileSync(outputPath, outputBuffer);
      if (outputPath !== filePath) {
        fs.unlinkSync(filePath);
      }

      const newStats = fs.statSync(outputPath);
      totalOptimizedSize += newStats.size;

      processed++;
      if (processed % 50 === 0 || processed === files.length) {
        console.log(`Processed ${processed}/${files.length} images...`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      totalOptimizedSize += originalStats.size;
      failures++;
    }
  }

  const totalSavings = (
    ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
    100
  ).toFixed(1);

  console.log("\n✅ Optimization complete!");
  console.log(
    `   Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `   Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`   Space saved: ${totalSavings}%`);

  if (failures > 0) {
    console.error(`\n${failures} image(s) failed to optimize.`);
    process.exit(1);
  }
}

optimizeImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
