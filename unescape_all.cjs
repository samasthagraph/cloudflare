const fs = require('fs');

function clean(path) {
  let p = fs.readFileSync(path, 'utf-8');
  // split on literal backslash followed by backtick
  p = p.split("\\`").join("`");
  // split on literal backslash followed by dollar sign
  p = p.split("\\$").join("$");
  fs.writeFileSync(path, p);
}

clean('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx');
clean('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx');
