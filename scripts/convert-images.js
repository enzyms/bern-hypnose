// scripts/convert-images.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const convertImagesToAVIF = async (srcDir, destDir) => {
    const files = fs.readdirSync(srcDir);

    files.forEach(async (file) => {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.png') {
            const inputFilePath = path.join(srcDir, file);
            const outputFilePath = path.join(destDir, `${path.basename(file, ext)}.avif`);

            // Convert the PNG image to AVIF
            await sharp(inputFilePath).avif({ quality: 50 }).toFile(outputFilePath);

            console.log(`Converted ${file} to AVIF format`);
        }
    });
};

// Set the source directory (where your PNG images are) and destination directory
convertImagesToAVIF('./public/uploads', './dist/uploads');
