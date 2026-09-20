#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metaPath = path.join(root, 'src', 'data', 'products-meta.json');
const publicDir = path.join(root, 'public');
const productsDir = path.join(publicDir, 'images', 'products');
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

const errors = [];
const warnings = [];

const { products } = JSON.parse(readFileSync(metaPath, 'utf8'));

for (const product of products ?? []) {
  const { id, images } = product;

  if (!Array.isArray(images) || images.length === 0) {
    warnings.push(`${id}: images array is empty — every product needs at least a cover`);
    continue;
  }

  images.forEach((image, index) => {
    if (typeof image !== 'string' || !image.startsWith('/')) {
      errors.push(`${id}: images[${index}] is not a root-relative path (${JSON.stringify(image)})`);
      return;
    }
    if (!existsSync(path.join(publicDir, image))) {
      errors.push(`${id}: ${index === 0 ? 'cover image' : `images[${index}]`} does not exist on disk (${image})`);
    }
  });

  const folder = path.join(productsDir, id);
  if (!existsSync(folder)) {
    warnings.push(`${id}: no folder at public/images/products/${id}/`);
    continue;
  }
  if (readdirSync(folder).filter((name) => IMAGE_EXT.test(name)).length === 0) {
    warnings.push(`${id}: public/images/products/${id}/ has no images yet`);
  }
}

for (const warning of warnings) console.warn(`warn  ${warning}`);
for (const error of errors) console.error(`error ${error}`);
console.log(`\n${(products ?? []).length} products · ${errors.length} errors · ${warnings.length} warnings`);

process.exit(errors.length > 0 ? 1 : 0);
