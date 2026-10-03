const fs = require('fs');

function fixTicks(path) {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(path, content);
}

fixTicks('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
fixTicks('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx');
