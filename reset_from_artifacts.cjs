const fs = require('fs');
let content = fs.readFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/podcasts_code.md', 'utf-8');

// strip ```tsx and ```
content = content.replace(/^```tsx\n/, '').replace(/\n```$/, '');

// Replace all \` with `
content = content.replace(/\\`/g, '`');

// Replace all \$ with $
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx', content);

let adminContent = fs.readFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/admin_code_v3.md', 'utf-8');
adminContent = adminContent.replace(/^```tsx\n/, '').replace(/\n```$/, '');
adminContent = adminContent.replace(/\\`/g, '`');
adminContent = adminContent.replace(/\\\$/g, '$');
fs.writeFileSync('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/admin.tsx', adminContent);
