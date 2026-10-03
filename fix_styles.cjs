const fs = require('fs');

function fix(path) {
  let content = fs.readFileSync(path, 'utf-8');
  // replace backticks with normal strings in style tags
  content = content.replace(/style=\{\{\s*transform:\s*`scale\(\$\{scale\}\)`\s*\}\}/g, "style={{ transform: 'scale(' + scale + ')' }}");
  content = content.replace(/style=\{\{\s*transform:\s*`scale\(\$\{ringScale \* 1\.2\}\)`\s*\}\}/g, "style={{ transform: 'scale(' + (ringScale * 1.2) + ')' }}");
  content = content.replace(/style=\{\{\s*transform:\s*`scale\(\$\{ringScale \* 1\.1\}\)`,\s*opacity: ringOpacity\s*\}\}/g, "style={{ transform: 'scale(' + (ringScale * 1.1) + ')', opacity: ringOpacity }}");
  content = content.replace(/style=\{\{\s*transform:\s*`scale\(\$\{ringScale \* 1\.05\}\)`,\s*opacity: ringOpacity \* 1\.5\s*\}\}/g, "style={{ transform: 'scale(' + (ringScale * 1.05) + ')', opacity: ringOpacity * 1.5 }}");
  
  // Also just blindly replace any remaining weird backticks if there are any?
  // Let's just fix formatTime again just in case
  content = content.replace(/return `\$\{m < 10 \? '0' : ''\}\$\{m\}:\$\{s < 10 \? '0' : ''\}\$\{s\}`;/g, "return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;");
  
  fs.writeFileSync(path, content);
}

fix('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
