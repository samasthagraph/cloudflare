const fs = require('fs');

const clean = (file) => {
  let c = fs.readFileSync(file, 'utf-8');
  let lines = c.split('\n');
  if (lines[0].startsWith('\`\`\`')) {
    lines.shift();
  }
  if (lines[lines.length - 1].startsWith('\`\`\`')) {
    lines.pop();
  } else if (lines[lines.length - 2] && lines[lines.length - 2].startsWith('\`\`\`')) {
    lines.splice(lines.length - 2, 1);
  }
  fs.writeFileSync(file, lines.join('\n'));
};

clean('app/routes/admin.tsx');
clean('app/routes/admin.login.tsx');
clean('app/sessions.server.ts');
