const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'build', 'icons');
const assetsPath = path.join(__dirname, 'assets');

if ( !fs.existsSync(outputPath) ) {
    fs.mkdirSync(outputPath);
}

const resizeLogo = function(i, output) {
    if ( !output ) {
        output = path.join(outputPath, `icon${i}x${i}.png`);
    }
    return sharp(path.join(assetsPath, 'icon.png'))
    .resize({
        width: i, 
        height: i,
        kernel: sharp.kernel.lanczos3
    })
    .toFile(output)
    .then(() => {
        console.log("Writing: ", output);
    })
    .catch(err => {
        if ( err ) {
            console.log(`-- Error while generating logo ${i}: ${output}`);
            console.error(err);
        }
    }); 
}

console.log("Generating logos for app");
for(var i = 512; i >= 16; i/=2) {
    console.log("Generating: ", i);
    resizeLogo(i);
}

console.log("Generating logo for tray")
resizeLogo(16, path.join('main/tray.png'));
resizeLogo(32, path.join('main/tray@2.png'));

