const { createCanvas, loadImage } = require('canvas');

async function renderShop(skins) {
    const width = 1200;
    const height = 400; 
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1f2326';
    ctx.fillRect(0, 0, width, height);

    const boxWidth = width / 4;
    
    for (let i = 0; i < skins.length; i++) {
        const skin = skins[i];
        const xOffset = i * boxWidth;
        
        ctx.strokeStyle = '#3e4147';
        ctx.lineWidth = 2;
        ctx.strokeRect(xOffset, 0, boxWidth, height);
        
        if (skin.icon) {
            try {
                const img = await loadImage(skin.icon);
                const maxWidth = boxWidth - 40;
                const ratio = Math.min(maxWidth / img.width, 150 / img.height);
                const w = img.width * ratio;
                const h = img.height * ratio;
                
                ctx.drawImage(img, xOffset + 20 + (maxWidth - w)/2, 100 + (150 - h)/2, w, h);
            } catch (err) {
                console.error("Failed to load image for: ", skin.name);
            }
        }
        
        ctx.fillStyle = '#0f1923';
        ctx.fillRect(xOffset, height - 70, boxWidth, 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        let displayName = skin.name;
        if(displayName.length > 25) {
             displayName = displayName.substring(0, 22) + '...';
        }
        ctx.fillText(displayName, xOffset + boxWidth / 2, height - 30);
    }
    
    return canvas.toBuffer();
}

module.exports = { renderShop };
