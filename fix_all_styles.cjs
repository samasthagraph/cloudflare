const fs = require('fs');
let p = fs.readFileSync('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx', 'utf-8');

// The line is: style={{ transform: 'scale(' + (ringScale * 1.2) + ')' }}
// wait, the error is: Expected ";" but found "scale"
// Let's just find exactly this and replace the whole div.
// 251|              {/* Outer Rings */}
// 252|              <div className="absolute inset-0 rounded-full border-[1px] border-[#c8a136]/20 transition-transform duration-300 animate-[spin_60s_linear_infinite]" style={{ transform: 'scale(' + (ringScale * 1.2) + ')' }}></div>
// 253|              <div className="absolute inset-4 rounded-full border-[2px] border-dashed border-[#60834f]/40 transition-transform duration-300 animate-[spin_40s_linear_infinite_reverse]" style={{ transform: `scale(${ringScale * 1.1})` }}></div>

// Since my previous script fix_styles.cjs already replaced the FIRST one with `style={{ transform: 'scale(' + (ringScale * 1.2) + ')' }}`
// But missed the others.

p = p.replace(/style=\{\{ transform: `scale\(\$\{ringScale \* 1\.1\}\)` \}\}/g, "style={{ transform: 'scale(' + (ringScale * 1.1) + ')' }}");
p = p.replace(/style=\{\{ transform: `scale\(\$\{ringScale \* 1\.05\}\)`, opacity: ringOpacity \* 1\.5 \}\}/g, "style={{ transform: 'scale(' + (ringScale * 1.05) + ')', opacity: ringOpacity * 1.5 }}");
p = p.replace(/style=\{\{ transform: `scale\(\$\{ringScale\}\)` \}\}/g, "style={{ transform: 'scale(' + ringScale + ')' }}");
p = p.replace(/style=\{\{ transform: `scale\(\$\{scale\}\)` \}\}/g, "style={{ transform: 'scale(' + scale + ')' }}");

fs.writeFileSync('D:/SUNNAH CLUB/Anas/Website Samastha Graph/app/routes/podcasts.tsx', p);
