const sharp = require("sharp");

const input = "public/logo.png";

async function build() {
  await sharp(input)
    .resize(192, 192)
    .png()
    .toFile("public/icon-192.png");

  await sharp(input)
    .resize(512, 512)
    .png()
    .toFile("public/icon-512.png");

  console.log("✅ Icone generate correttamente!");
}

build();