const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'build', 'icons');
const assetsPath = path.join(__dirname, 'assets');

if ( !fs.existsSync(outputPath) ) {
    fs.mkdirSync(outputPath);
}

const resizeLogo = function(i, input, output) {
    if ( !input ) {
        input = path.join(assetsPath, 'icon.png');
    }
    if ( !output ) {
        output = path.join(outputPath, `icon${i}x${i}.png`);
    }
    return sharp(input)
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
resizeLogo(16, null, path.join('main', 'assets', 'tray.png'));
resizeLogo(32, null, path.join('main', 'assets', 'tray@2.png'));

console.log("Generating tray frames");
for(var i=1; i <= 8; i++) {
    resizeLogo(16, path.join('assets', `frame-${i}.png`), path.join('main', 'assets', `tray-frame-${i-0}.png`));
    resizeLogo(32, path.join('assets', `frame-${i}.png`), path.join('main', 'assets', `tray-frame-${i-0}@2.png`));
}

