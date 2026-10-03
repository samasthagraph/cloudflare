const fs = require('fs');

function fix(path) {
  let p = fs.readFileSync(path, 'utf-8');
  // replace literal \ followed by $ with just $
  p = p.replace(/\\\$/g, '$');
  fs.writeFileSync(path, p);
}

fix('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
fix('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx');
