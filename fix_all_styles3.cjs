const fs = require('fs');

function fixFile(path) {
  let p = fs.readFileSync(path, 'utf-8');

  // We are going to find `style={{ ... }}` blocks and replace any backtick template literals inside them.
  // Actually, let's just replace all occurrences of `${...}` inside style tags.
  
  p = p.replace(/height:\s*`\$\{barHeight\}px`/g, "height: barHeight + 'px'");
  p = p.replace(/left:\s*`\$\{progress\}%`/g, "left: progress + '%'");
  p = p.replace(/width:\s*`\$\{progress\}%`/g, "width: progress + '%'");
  
  fs.writeFileSync(path, p);
}

fixFile('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
fixFile('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx');
