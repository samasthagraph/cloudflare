const fs = require('fs');

function fix(path) {
  let content = fs.readFileSync(path, 'utf-8');
  
  // Just blindly replace any remaining template literals inside styles
  content = content.replace(/height:\s*`\$\{barHeight\}px`/g, "height: barHeight + 'px'");
  content = content.replace(/transform:\s*`rotate\(\$\{angle\}deg\) translateY\(-120px\)`/g, "transform: 'rotate(' + angle + 'deg) translateY(-120px)'");

  fs.writeFileSync(path, content);
}

fix('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
