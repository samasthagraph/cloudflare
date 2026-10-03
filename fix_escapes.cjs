const fs = require('fs');

function unescapeFile(path) {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(/\\\$/g, '$');
  content = content.replace(/\\\`/g, '\`');
  fs.writeFileSync(path, content);
}

unescapeFile('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
unescapeFile('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx');
