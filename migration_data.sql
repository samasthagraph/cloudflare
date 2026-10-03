-- Samastha Graph Complete Data Migration to Cloudflare D1

DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS podcasts;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS site_settings;

CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  advanced_title TEXT,
  excerpt TEXT,
  cover_image TEXT,
  thumb_image TEXT,
  category TEXT,
  author TEXT,
  seo_title TEXT,
  seo_description TEXT,
  theme_preset TEXT DEFAULT 'theme-malayalam-standard',
  status TEXT DEFAULT 'published',
  reading_time INTEGER DEFAULT 5,
  translation_group_id TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  youtube_id TEXT,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  program_name TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE podcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  duration TEXT,
  cover_image TEXT,
  show_name TEXT,
  episode_number INTEGER,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  host TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO articles (
  slug, title, advanced_title, excerpt, cover_image, thumb_image,
  category, author, seo_title, seo_description, theme_preset,
  status, reading_time, translation_group_id, published_at, body, updated_at
) VALUES (
  'maulana-rumi-and-liberal-sufism-reality-of-diluted-interpretations', 'മൗലാനാ റൂമിയും ''ലിബറൽ സൂഫിസവും'': കാമ്പ് ചോർത്തിയ വായനകളുടെ യാഥാർത്ഥ്യം', 'maulana-rumi-and-liberal-sufism-reality-of-diluted-interpretations', 'പാശ്ചാത്യ ലോകത്ത് വെറുമൊരു "പ്രണയ കവി"  ആയി ചിത്രീകരിക്കപ്പെടുമ്പോഴും, റൂമി അടിസ്ഥാനപരമായി ഹനഫി മദ്ഹബിലെ വലിയൊരു ഇസ്ലാമിക പണ്ഡിതനും, ഫഖീഹും, മുഫ്തിയും അധ്യാപകനുമായിരുന്നു.

അദ്ദേഹത്തിന്റെ ലോകപ്രശസ്തമായ മാസ്റ്റർപീസ് ഗ്രന്ഥമായ ''മസ്നവി'' (Masnavi) പരമ്പരാഗതമായി അറിയപ്പെടുന്നത് "പേർഷ്യൻ ഭാഷയിലെ ഖുർആൻ" എന്നാണ്. ഖുർആൻ ആയത്തുകളുടെയും തിരുനബി (സ്വ) തങ്ങളുടെ ഹദീസുകളുടെയും പ്രായോഗിക ആത്മീയ വ്യാഖ്യാനങ്ങളാണ് മസ്നവിയിലെ ഓരോ കഥയും വരികളും. ഖുർആനിലും പ്രവാചകചര്യയിലും ഊന്നിയല്ലാതെ റൂമിക്ക് മറ്റൊരു വഴിയുണ്ടായിരുന്നില്ല.   ', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6UwRxNHSdH4DgHb7NrvVwRRhNCYuTGnhQRnOnfHPzeDN1uTaUaz9_WWQ&s=10', '',
  'Articles', 'ഹുസൈൻ തങ്ങൾ വാടാനപ്പള്ളി', '', '', 'theme-malayalam-standard',
  'published', 5, NULL, '2026-10-03', '<p>പതിമൂന്നാം നൂറ്റാണ്ടിൽ ജീവിച്ചിരുന്ന പ്രമുഖ ഇസ്ലാമിക പണ്ഡിതനും വലിയ ആത്മീയ ആചാര്യനുമായ മൗലാനാ ജലാലുദ്ധീൻ റൂമി (റ) ഇന്ന് ലോകമെമ്പാടും വായനക്കാരുള്ള കാവ്യപ്രതിഭയാണ്. എന്നാൽ അദ്ദേഹത്തിന്റെ ചിന്തകളുടെയും കാവ്യങ്ങളുടെയും ആത്മാവ് മനസ്സിലാക്കാതെ, സ്വന്തം താല്പര്യങ്ങൾക്ക് അനുസൃതമായി അദ്ദേഹത്തെ വ്യാഖ്യാനിക്കുന്ന ഒരു രീതി ആധുനിക കാലത്ത് വ്യാപകമാണ്. സൂഫിസത്തെ  ഇസ്‌ലാമിമക നിയമങ്ങളിൽ (ശരീഅത്) നിന്നും ആരാധനാ നിഷ്ഠകളിൽ നിന്നും വേർപെടുത്തി, വെറുമൊരു "ലിബറൽ ആത്മീയത"യോ അല്ലെങ്കിൽ അതിരുകളില്ലാത്ത പ്രണയകാവ്യമോ മാത്രമായി ചിത്രീകരിക്കുന്നത് റൂമിയോടും യഥാർത്ഥ ഇസ്ലാമിക തസവ്വുഫിനോടും കാണിക്കുന്ന വലിയ അനീതിയാണ്.</p><p><strong><em>ആരായിരുന്നു മൗലാനാ റൂമി?</em></strong></p><p>പാശ്ചാത്യ ലോകത്ത് വെറുമൊരു "പ്രണയ കവി"  ആയി ചിത്രീകരിക്കപ്പെടുമ്പോഴും, റൂമി അടിസ്ഥാനപരമായി ഹനഫി മദ്ഹബിലെ വലിയൊരു ഇസ്ലാമിക പണ്ഡിതനും, ഫഖീഹും, മുഫ്തിയും അധ്യാപകനുമായിരുന്നു.</p><p>അദ്ദേഹത്തിന്റെ ലോകപ്രശസ്തമായ മാസ്റ്റർപീസ് ഗ്രന്ഥമായ ''മസ്നവി'' (Masnavi) പരമ്പരാഗതമായി അറിയപ്പെടുന്നത് "പേർഷ്യൻ ഭാഷയിലെ ഖുർആൻ" എന്നാണ്. ഖുർആൻ ആയത്തുകളുടെയും തിരുനബി (സ്വ) തങ്ങളുടെ ഹദീസുകളുടെയും പ്രായോഗിക ആത്മീയ വ്യാഖ്യാനങ്ങളാണ് മസ്നവിയിലെ ഓരോ കഥയും വരികളും. ഖുർആനിലും പ്രവാചകചര്യയിലും ഊന്നിയല്ലാതെ റൂമിക്ക് മറ്റൊരു വഴിയുണ്ടായിരുന്നില്ല.   </p><p><strong><em>റൂമിയുടെ പ്രഖ്യാപനം:</em> </strong></p><p>റൂമിയെ ശരീഅത്തിന് പുറത്തുനിർത്തി കാണാൻ ശ്രമിക്കുന്നവർക്കുള്ള ഏറ്റവും വലിയ മറുപടി അദ്ദേഹത്തിന്റെ സ്വന്തം വരികൾ തന്നെയാണ്:</p><p>"ഞാൻ ജീവിച്ചിരിക്കുന്നിടത്തോളം കാലം അല്ലാഹുവിന്റെ ഗ്രന്ഥമായ ഖുർആന്റെ ദാസനാണ്.</p><p>അല്ലാഹുവിന്റെ തിരുദൂതരായ മുഹമ്മദ് നബി (സ്വ) തങ്ങളുടെ പാദധൂളിയാണ് ഞാൻ.</p><p>ഇതല്ലാതെ മറ്റാരെങ്കിലും എന്റെ വരികളെ വ്യാഖ്യാനിച്ചാൽ, അവരിൽ നിന്നും അവരുടെ വാക്കുകളിൽ നിന്നും ഞാൻ ഒഴിഞ്ഞുമാറുന്നു, എനിക്ക് അതിൽ യാതൊരു ബന്ധവുമില്ലെ"ന്ന് മൗലാനാ റൂമി തന്നെ വ്യക്തമാക്കുന്നു. </p><p> (ദിവാനെ ശംസ് തബ്രീസി) </p><p>മസ്നവിയുടെ അഞ്ചാം പുസ്തകത്തിന്റെ ആമുഖത്തിൽ ശരീഅത്തും തരീഖത്തും ഹഖീഖത്തും തമ്മിലുള്ള ബന്ധത്തെ കുറിച്ച് റൂമി വിശദീകരിക്കുന്നത് </p><p>"ശരീഅത്ത് ഒരു മരുന്നുപോലെയാണ്; രോഗം മാറ്റാനുള്ള നിർദ്ദേശങ്ങൾ.</p><p>തരീഖത്ത് ആ മരുന്ന് കൃത്യമായി കഴിക്കലും പഥ്യം പാലിക്കലുമാണ്.</p><p>ഹഖീഖത്ത് ആകട്ടെ ആ രോഗത്തിൽ നിന്നും ആത്യന്തികമായി പൂർണ്ണ സൗഖ്യം നേടലുമാണ്.</p><p>ഒരു വ്യക്തിക്ക് മരുന്നില്ലാതെ, അല്ലെങ്കിൽ മരുന്ന് കഴിക്കാതെ സൗഖ്യം ഉണ്ടാകുന്നില്ല."</p><p>ശരീഅത്ത് എന്ന അടിസ്ഥാന മരുന്നില്ലാതെ ആത്മീയ സൗഖ്യമോ ഉന്നതിയോ സാധ്യമല്ലെന്ന് റൂമി ഇതിലൂടെ കൃത്യമായി വ്യക്തമാക്കുന്നു.</p><p>മസ്നവി ഒന്നാം ഭാഗത്തിൽ താൻ ആരുടെ ദാസനാണെന്ന് അദ്ദേഹം സ്വയം ഓർമ്മിപ്പിക്കുന്നു:</p><p>"ഞാൻ അല്ലാഹുവിന്റെ സിംഹമാണ് (ശീറെ ഖുദാ); അല്ലാതെ എൻ്റെ തന്നിഷ്ടങ്ങളുടെയോ (ഹവാ) വികാരങ്ങളുടെയോ അടിമയല്ല.</p><p>ഞാൻ എന്ത് പ്രവർത്തിക്കുന്നുവോ, അതെല്ലാം ദൈവ സ്നേഹത്തിൽ മാത്രമായി ചെയ്യുന്നു."</p><p>യഥാർത്ഥ സൂഫിസത്തിൽ ശരീഅത്ത് (ഇസ്‌ലാമിക നിയമങ്ങൾ), തരീഖത്ത് (ആത്മീയ പാത), ഹഖീഖത്ത് (പരമസത്യം) എന്നിവ പരസ്പര പൂരകങ്ങളാണ്. ശരീഅത്ത് എന്ന അടിത്തറയില്ലാതെ ആത്മീയതയുടെ കെട്ടിടം ഉയർത്താൻ കഴിയില്ലെന്ന് റൂമി മനോഹരമായ ഉപമയിലൂടെ പഠിപ്പിക്കുന്നു:</p><p>"ശരീഅത്ത് ഒരു വിളക്കാണ് (Candle); അത് വഴി കാണിക്കുന്നു.  </p><p>തരീഖത്ത് ആ വെളിച്ചത്തിൽ നടന്നു പോകുന്ന വഴിയാണ്.</p><p>ഹഖീഖത്ത് ലക്ഷ്യസ്ഥാനത്ത് എത്തിച്ചേരലുമാണ്."</p><p>വിളക്കില്ലാതെ ഇരുട്ടിൽ യാത്ര ചെയ്യാൻ കഴിയില്ലെന്നതുപോലെ തന്നെ, ഇസ്ലാമിന്റെ അടിസ്ഥാന ആചാരാനുഷ്ഠാനങ്ങളും (നമസ്കാരം, നോമ്പ്, ഹലാൽ-ഹറാം പരിപാലനം) നിയമങ്ങളും കാറ്റിൽ പറത്തിക്കൊണ്ട് ആത്മീയ പുരോഗതി നേടാമെന്ന വാദം പൊള്ളയാണെന്ന് മാത്രമല്ല അതൊരു വലിയ ചതിയുമാണ്.</p><p><em>ലിബറൽ ആത്മീയതയും ''സെക്യുലർ റൂമി'' നിർമ്മിതിയും</em></p><p>ഇന്നത്തെ ആധുനിക പാശ്ചാത്യ-ലിബറൽ വായനകളിൽ റൂമിയുടെ വരികളിൽ നിന്ന് ഖുർആനിക ചിഹ്നങ്ങളെയും പ്രവാചക പരാമർശങ്ങളെയും മനഃപൂർവ്വം മാറ്റിവെച്ച് പരിഭാഷപ്പെടുത്തുകയും, അതിനെ വെറുമൊരു "ഫീൽ ഗുഡ്" പ്രണയ കവിതകളാക്കി മാറ്റുകയും ചെയ്യുന്നുണ്ട്.   </p><p>ഇസ്ലാമിക നിഷ്ഠകളെല്ലാം മാറ്റിവെച്ച് ''സ്നേഹം മാത്രം മതി'' എന്ന് പറയുന്ന വിചാരം റൂമിയുടേതല്ല. റൂമിയുടെ ദർശനത്തിൽ ദൈവസ്നേഹം എന്നാൽ ദൈവകൽപ്പനകളോടുള്ള പൂർണ്ണമായ അനുസരണവും പ്രവാചക അനുധാവനവുമാണ്. </p><p><strong><em>സംഗീതവും ഡാൻസും:</em></strong></p><p> റൂമിയുടെ പേരിലുള്ള ''സമാഇ'' (Sama) അഥവാ വൃത്തത്തിൽ കറങ്ങിയുള്ള ആത്മീയ ധ്യാനം അല്ലാഹുവിന്റെ ദിവ്യസ്മരണയിലും മനസ്സിന്റെ ശുദ്ധീകരണത്തിലും ഊന്നിയുള്ളതായിരുന്നു. അതിനെ കേവല ലഹരിയായോ, വിനോദമായോ, വിധിവിരോധങ്ങൾ ലംഘിക്കാനുള്ള ലൈസൻസായോ മാറ്റുന്നത് റൂമി ദർശനത്തിന് വിരുദ്ധമാണ്.</p><p>പ്രവാചകചര്യയോടുള്ള ആദരവും പ്രവാചക സ്നേഹത്തെ കുറിച്ചും മസ്നവിയിൽ മനോഹരമായി ആവിഷ്കരിച്ചിട്ടുണ്ട്.</p><p>"ബുദ്ധിയും തർക്കവും അഹങ്കാരമാണ്; പ്രവാചക സ്നേഹത്തിലും വിധേയത്വത്തിലും സ്വയം ഇല്ലാതാവുക എന്നതാണ് യഥാർത്ഥ വഴികാട്ടി."</p><p>ഇസ്ലാമിന്റെ വിധിവിരോധങ്ങൾ പാലിക്കാതെ, ആത്മീയതയെ വിൽപനച്ചരക്കാക്കി മാറ്റിയ ലിബറൽ വായനകൾ ആളുകളെ ജീവിതവിശുദ്ധിയിൽ നിന്ന് അകറ്റുകയാണ് ചെയ്യുന്നത്.</p><p>സ്വർഗ്ഗപ്രതീക്ഷയോ നരകഭയമോ ഇല്ലാതെ ദൈവത്തെ സ്നേഹിക്കണം എന്ന് ആദ്യകാല സൂഫികൾ (ഉദാഹരണത്തിന് റാബിയത്തുൽ അദവിയ്യ) പറഞ്ഞതിന്റെ അർത്ഥം ദൈവത്തോടുള്ള പ്രണയത്തിന്റെ നിഷ്കളങ്കത കാണിക്കാനാണ്. അതിനർത്ഥം പരലോകത്തെ തള്ളിക്കളയലോ കർമ്മങ്ങൾ ഉപേക്ഷിക്കലോ അല്ല.</p><p>മസ്നവിയുടെ കാമ്പ് അറിഞ്ഞ് വായിക്കുന്നൊരാൾക്ക് റൂമിയിൽ കാണാൻ കഴിയുന്നത് താഴെ പറയുന്നവയാണ്</p><p><em>തീവ്രമായ ദൈവസ്നേഹം:</em> പ്രപഞ്ചനാഥനിലേക്ക് അടുത്തുകൊണ്ടിരിക്കാനുള്ള ആഗ്രഹം. </p><p><em>അനുകരണീയമായ പ്രവാചക സ്നേഹം:</em> നബി(സ്വ)യുടെ മാതൃക പൂർണ്ണമായി പിന്തുടരൽ.  </p><p><em>സൃഷ്ടികളോടുള്ള കരുണ:</em> അഹങ്കാരവും ദുർവികാരങ്ങളും വെടിഞ്ഞ് വിനയാന്വിതനാവുക.  </p><p><strong><em>ആത്മവിശുദ്ധീകരണം</em> (തസ്കിയത്തുന്ന്ഫ്സ്):</strong></p><p>ഈഗോ ഭസ്മീകരിച്ച് അല്ലാഹുവിലേക്ക് മടങ്ങുക.   </p><p>മൗലാനാ റൂമിയെ ഇസ്ലാമിൽ നിന്നും ഖുർആൻ-ഹദീസുകളിൽ നിന്നും വേർപെടുത്തി വായിക്കുന്നത് അദ്ദേഹത്തിന്റെ ആത്മാവിനെത്തന്നെ വഞ്ചിക്കുന്നതിന് തുല്യമാണ്. ആധുനിക ''ലിബറൽ സൂഫിസം'' നിർമ്മിച്ചെടുക്കുന്ന അതിരുകളില്ലാത്ത വിനോദ സംസ്കാരമല്ല യഥാർത്ഥ റൂമി ദർശനം. മറിച്ച്, ഇസ്ലാമിന്റെ ശരീഅത്തിലും ആത്മീയതയിലും ഉറച്ചുനിന്നുകൊണ്ട്, അല്ലാഹുവിന്റെ പ്രീതി മാത്രം ലക്ഷ്യമാക്കി പ്രവാചക പാതയിൽ ജീവിക്കാനുള്ള ആഹ്വാനമാണ് റൂമിയുടെ ഓരോ വരികളും. കാമ്പ് തിരിച്ചറിഞ്ഞ് അദ്ദേഹത്തെ വായിക്കുക എന്നതാണ് ഈ തെറ്റിദ്ധാരണകൾക്കുള്ള ഏക പരിഹാരം.</p>', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  advanced_title = excluded.advanced_title,
  excerpt = excluded.excerpt,
  cover_image = excluded.cover_image,
  thumb_image = excluded.thumb_image,
  category = excluded.category,
  author = excluded.author,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  theme_preset = excluded.theme_preset,
  status = excluded.status,
  reading_time = excluded.reading_time,
  translation_group_id = excluded.translation_group_id,
  published_at = excluded.published_at,
  body = excluded.body,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'dont-demotivate-anyone', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത് ', 'gWio9Nojn7Q', '', 'General',
  '', '', 'ananthapporul', '2026-08-21', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'launching--samastha-graph--kanthapuram-ap-aboobacker-musliyar', 'Launching | Samastha Graph | Kanthapuram AP Aboobacker Musliyar', 'YiEskekCJqI', '<p></p><p></p>', 'General',
  '', '', '', '2026-08-17', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'minal-qalb-episode-01', 'ഉസ്താദും ശിഷ്യനും | Minal Qalb | Episode 01', 'zwUidpWhYgM', '', 'General',
  '', '', 'minal-qalb', '2026-08-17', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'noorul-hira-shafi-saqafi-ep-01', 'സൂറത്തുൽ ഫാത്തിഹ: Noorul Hira | Shafi Saqafi Mundambra | Episode 01', 'Gv7BbUzUeag', '', 'General',
  '', '', 'noorul-hira', '2026-08-21', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'timeline01', 'മദ്ഹുറസൂൽ പ്രഭാഷണങ്ങൾഒരു നിയോഗം പോലെ സംഭവിച്ചതാണ് ', 'iqIk1TTqfKQ', '', 'General',
  '', '', '', '2026-09-20', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-0BjdTGRSZgk', 'അവർ ഖുർആൻ ദുർവ്യാഖ്യാനം ചെയ്യുകയാണ്! | Minal Qalb | Episode 04', '0BjdTGRSZgk', 'മൗദൂദിക്ക് പാക്കിസ്ഥാനിലേക്ക് കത്തയച്ച ജമാഅത്ത് കേരള അമീർ 
ഈമാൻ കാര്യത്തിൻ്റെ എണ്ണമറിയില്ല!

Minal Qalb | Episode 04

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph #minalqalb', 'General',
  '', '', 'minal-qalb', '2026-09-06', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-22UcrISZDNY', '5 വിജയരഹസ്യങ്ങൾ l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', '22UcrISZDNY', 'youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'ananthapporul', '2026-09-03', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-6BHSL49uMj4', 'മക്കൾ നന്നാവണോ? എളുപ്പ വഴിയുണ്ട് | Anas Amani Pushpagiri', '6BHSL49uMj4', 'youtube.com/@Samasthagraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'ananthapporul', '2026-09-13', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-723dS6XaGDU', 'മതം ഒന്നല്ലേ? പിന്നെന്തിനാണ് നാല് മദ്ഹബ്? l ABDUL JALEEL SAQAFI CHERUSSOLA | FIQH FILES | EPISODE 02', '723dS6XaGDU', 'മതം ഒന്നല്ലേ? പിന്നെന്തിനാണ് നാല് മദ്ഹബ്?
ABDUL JALEEL SAQAFI CHERUSSOLA
FIQH FILE | EPISODE 01

നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കാൻ താഴെയുള്ള ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക.
https://fiqhfiles.samasthagraph.com

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'fiqh-file', '2026-09-25', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-cAO8V0ZnMSI', 'തെറ്റിനെ ന്യായീകരിക്കാറുണ്ടോ? ഖുർആനിന്റെ മുന്നറിയിപ്പുണ്ട് | Shafi Saqafi Mundambra', 'cAO8V0ZnMSI', 'തെറ്റിനെ ന്യായീകരിക്കാറുണ്ടോ? ഖുർആനിന്റെ മുന്നറിയിപ്പുണ്ട് | Shafi Saqafi Mundambra

Noorul Hira | Episode 4 
Surat Al Baqara 1

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'noorul-hira', '2026-09-22', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-F2OPQDM-sq0', 'അല്ലാഹുവിന്റെ അടിമയായാൽ മറ്റാരുടെയും അടിമയാകേണ്ടതില്ല | Shafi Saqafi Mundambra', 'F2OPQDM-sq0', 'youtube.com/@Samasthagraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'noorul-hira', '2026-08-31', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-gWio9Nojn7Q', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത് | Anas Amani Pushpagiri | ആനന്ദപ്പൊരുൾ', 'gWio9Nojn7Q', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത്
അനസ് അമാനി പുഷ്പഗിരി | ആനന്ദപ്പൊരുൾ


youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph

#AnasAmani #Anandapporul', 'General',
  '', '', 'ananthapporul', '2026-08-20', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-H0XAMl9Ej6o', 'എൻ്റെ പേരിൽ പറയാത്തഒരു ആരോപണവുമില്ല. എല്ലാം പറഞ്ഞു നോക്കിയിട്ടുണ്ട് | Minal Qalb | Episode 02', 'H0XAMl9Ej6o', 'എൻ്റെ പേരിൽ പറയാത്ത ഒരു ആരോപണവുമില്ല. എല്ലാം പറഞ്ഞു നോക്കിയിട്ടുണ്ട്.

കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർ
പേരോട് അബ്ദുറഹ്മാൻ സഖാഫി

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph #minalqalb', 'General',
  '', '', 'minal-qalb', '2026-08-22', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-mq5GFHkefOo', 'ഖുർആനും ഹദീസും ഉള്ളപ്പോൾ എന്തിനാണ് ഫിഖ്ഹ്? | ABDUL JALEEL SAQAFI CHERUSSOLA | FIQH FILE | EPISODE 01', 'mq5GFHkefOo', 'ഖുർആനും ഹദീസും ഉള്ളപ്പോൾ എന്തിനാണ് ഫിഖ്ഹ്?
ABDUL JALEEL SAQAFI CHERUSSOLA
FIQH FILE | EPISODE 01

നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കാൻ താഴെയുള്ള ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക.
https://fiqhfiles.samasthagraph.com

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'fiqh-file', '2026-09-18', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-na7sQzB_lQw', 'രാഷ്ട്രീയക്കാർ അന്നും അധിക്ഷേപിച്ചിരുന്നു; അന്നും ഇന്നും നമ്മൾ നിലപാട് മാറ്റിയിട്ടില്ല | Episode 06', 'na7sQzB_lQw', 'രാഷ്ട്രീയക്കാർ അന്നും അധിക്ഷേപിച്ചിരുന്നു;
അന്നും ഇന്നും നമ്മൾ നിലപാട് മാറ്റിയിട്ടില്ല
Minal Qalb | Episode 06

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'minal-qalb', '2026-09-23', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-RbhBS4Rytq8', 'സാലറിയും ഫോളോവേഴ്‌സുമല്ല വിജയത്തിൻ്റെ അടിസ്ഥാനം | Shafi Saqafi Mundambra', 'RbhBS4Rytq8', 'Noorul Hira | Episode 4 
Surat Al Baqara 1

സാലറിയും ഫോളോവേഴ്‌സുമല്ല വിജയത്തിൻ്റെ അടിസ്ഥാനം | Shafi Saqafi Mundambra 

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'noorul-hira', '2026-09-09', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-sI64S8R0zdE', 'എൻ്റെ ഇഷ്ടം V/S അല്ലാഹുവിൻ്റെ ഇഷ്ടം l Anas Amani Pushpagiri l ആനന്തപ്പൊരുൾ', 'sI64S8R0zdE', 'എൻ്റെ ഇഷ്ടം V/S അല്ലാഹുവിൻ്റെ ഇഷ്ടം 

Anas Amani Pushpagiri 

ആനന്തപ്പൊരുൾ

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'ananthapporul', '2026-08-27', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-SVyssYvacDc', 'മനുഷ്യരെ പറ്റിക്കാം അല്ലാഹുവിനെയോ? | Shafi Saqafi Mundambra', 'SVyssYvacDc', 'Noorul Hira | Episode 4 
Surat Al Baqara 1

മനുഷ്യരെ പറ്റിക്കാം അല്ലാഹുവിനെയോ? | Shafi Saqafi Mundambra

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'noorul-hira', '2026-09-15', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-TwxmHLDLSuU', 'സമസ്തയുടെ മിനിറ്റ്‌സ് ബുക്കിൽ തുന്നിച്ചേർത്ത വിയോജനക്കുറിപ്പ് | Minal Qalb | Episode 05', 'TwxmHLDLSuU', 'സമസ്തയുടെ മിനിറ്റ്‌സ് ബുക്കിൽ തുന്നിച്ചേർത്ത വിയോജനക്കുറിപ്പ്
Minal Qalb | Episode 05

കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർ
പേരോട് അബ്ദുറഹ്മാൻ സഖാഫി

@samasthagraph  
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph #minalqalb', 'General',
  '', '', 'minal-qalb', '2026-09-12', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-ugWAw0F809A', 'പിശാചിൽ നിന്ന് രക്ഷ നേടാനുള്ള 3 വഴികൾ | l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', 'ugWAw0F809A', 'പിശാചിൽ നിന്ന് രക്ഷ നേടാനുള്ള 3 വഴികൾ | l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'ananthapporul', '2026-09-27', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-utR9opueTc0', 'മിണ്ടാതിരിക്കാൻ പഠിക്കാം  l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', 'utR9opueTc0', 'മിണ്ടാതിരിക്കാൻ പഠിക്കാം  l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ | Anas Amani Pushpagiri

youtube.com/@SamasthaGraph
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph', 'General',
  '', '', 'ananthapporul', '2026-09-21', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  'youtube-z8bQFqfhLN8', 'ശംസുൽ ഉലമ ശംസുൽ ഉലമ തന്നെയാണ് | Minal Qalb | Episode 03', 'z8bQFqfhLN8', 'ശംസുൽ ഉലമ ശംസുൽ ഉലമ തന്നെയാണ്
 Minal Qalb | Episode 03

കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർ
പേരോട് അബ്ദുറഹ്മാൻ സഖാഫി

@samasthagraph  
facebook.com/SamasthaGraph
instagram.com/SamasthaGraph

We are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music

© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 
#samastha #samasthagraph #minalqalb', 'General',
  '', '', 'minal-qalb', '2026-08-30', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'adv-vs-joy-e3nms16', 'സ്ത്രീധനം വിപത്താകുന്ന കാലത്ത് മഹർ നൽകി സ്ത്രീകളെ സ്വീകരിക്കണമെന്ന് പഠിപ്പിച്ച പ്രവാചകൻ | Adv VS Joy', 'സ്ത്രീധനം വിപത്താകുന്ന കാലത്ത് മഹർ നൽകി സ്ത്രീകളെ സ്വീകരിക്കണമെന്ന് പഠിപ്പിച്ച പ്രവാചകൻ | Adv VS Joy youtube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-21/430262193-44100-2-12e098e880598.mp3', '00:03:01',
  'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg', '', 6, '2026-08-21T11:34:39.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ai----------footprints-e3p189c', 'AI - ഗ്രാൻഡ് മുഫ്തിയുടെ പ്രൊജക്ടിൽ മലേഷ്യൻ സർക്കാർ പങ്കാളിയാകും | FootPrints', 'AI - ഗ്രാൻഡ് മുഫ്തിയുടെ പ്രൊജക്ടിൽ മലേഷ്യൻ സർക്കാർ പങ്കാളിയാകും | FootPrints ഡോ. അബ്ദുൽ ഹക്കീം അസ്ഹരി ഹുസൈൻ തങ്ങൾ വാടാനപ്പള്ളി', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-18/432143647-44100-2-8e8f54012183e.mp3', '00:18:44',
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/46535697/46535697-1786718302573-a57d4874c478.jpg', '', 13, '2026-09-18T05:04:44.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-01-e3p33f1', '01 | ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത്', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത് | Anas Amani Pushpagiri | ആനന്ദപ്പൊരുൾ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-19/432222571-44100-2-146829fbf3424.mp3', '00:11:17',
  'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg', '', 1, '2026-09-19T05:12:53.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-02----vs-e3p33jr', '02 | എൻ്റെ ഇഷ്ടം V/S അല്ലാഹുവിൻ്റെ ഇഷ്ടം', 'എൻ്റെ ഇഷ്ടം V/S അല്ലാഹുവിൻ്റെ ഇഷ്ടം l Anas Amani Pushpagiri l ആനന്തപ്പൊരുൾ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-19/432222789-44100-2-c5124ad351526.mp3', '00:11:13',
  'https://i.ytimg.com/vi/sI64S8R0zdE/hqdefault.jpg', '', 2, '2026-09-19T05:14:54.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-03--5-e3p33td', '03 | 5 വിജയരഹസ്യങ്ങൾ', '5 വിജയരഹസ്യങ്ങൾ l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-19/432223134-44100-2-2d300f15ac7aa.mp3', '00:10:17',
  'https://i.ytimg.com/vi/22UcrISZDNY/hqdefault.jpg', '', 3, '2026-09-19T05:21:27.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-04-e3p3404', '04 | മക്കൾ നന്നാവണോ? എളുപ്പ വഴിയുണ്ട്', 'മക്കൾ നന്നാവണോ? എളുപ്പ വഴിയുണ്ട് | Anas Amani Pushpagiri', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-19/432223247-44100-2-aebd1175821ba.mp3', '00:08:46',
  'https://i.ytimg.com/vi/6BHSL49uMj4/hqdefault.jpg', '', 4, '2026-09-19T05:24:28.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-05-e3pifom', '05 | മിണ്ടാതിരിക്കാൻ പഠിക്കാം', '05 | മിണ്ടാതിരിക്കാൻ പഠിക്കാം l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432897052-44100-2-9cb75000fa11b.mp3', '00:06:02',
  'https://i.ytimg.com/vi/utR9opueTc0/hqdefault.jpg', '', 5, '2026-09-29T09:41:57.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ananthaporul-06------3-e3pifs5', '06 | പിശാചിൽ നിന്ന് രക്ഷ നേടാനുള്ള 3 വഴികൾ', 'പിശാചിൽ നിന്ന് രക്ഷ നേടാനുള്ള 3 വഴികൾ | l Anas Amani Pushpagiri l ആനന്ദപ്പൊരുൾ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432897227-44100-2-04fe01d00f8a4.mp3', '00:06:59',
  'https://i.ytimg.com/vi/sI64S8R0zdE/hqdefault.jpg', '', 6, '2026-09-29T09:44:02.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'anas-amani-pushpagiri-e3nd42q', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത് | Anas Amani Pushpagiri | ആനന്ദപ്പൊരുൾ', 'ആരെയും ഡിമോട്ടിവേറ്റ് ചെയ്യരുത്അനസ് അമാനി പുഷ്പഗിരി | ആനന്ദപ്പൊരുൾyoutube.com/@SamasthaGraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph#AnasAmani #Anandapporul', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-20/430186079-44100-2-633903f49e5aa.mp3', '00:11:17',
  'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg', '', 5, '2026-08-21T05:26:10.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ep-e3njjph', 'നബിദിനത്തില്‍ പൊന്നാനിയുടെ തെരുവുകള്‍ സുഗന്ധപൂരിതമാകും | കെ.പി രാമനുണ്ണി', 'നബിദിനത്തില്‍ പൊന്നാനിയുടെ തെരുവുകള്‍ സുഗന്ധപൂരിതമാകും | കെ.പി രാമനുണ്ണി', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-19/430116110-44100-2-60164655ccc9.mp3', '00:10:51',
  'https://i.ytimg.com/vi/iqIk1TTqfKQ/hqdefault.jpg', '', 1, '2026-08-19T06:18:44.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ep-e3o0k8r', 'സമത്വത്തിന്റെ സമവാക്യമായിരുന്നു പ്രവാചകർ | കെ.ടി ജലീൽ', 'സമത്വത്തിന്റെ സമവാക്യമായിരുന്നു പ്രവാചകർ | കെ.ടി ജലീൽ', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-28/430700755-44100-2-929eed4704637.mp3', '00:05:26',
  'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg', '', 9, '2026-08-31T07:25:01.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'fiqh-files-01-e3pigro', '01 | ഖുർആനും ഹദീസും ഉള്ളപ്പോൾ എന്തിനാണ് ഫിഖ്ഹ്?', 'ഖുർആനും ഹദീസും ഉള്ളപ്പോൾ എന്തിനാണ് ഫിഖ്ഹ്?ABDUL JALEEL SAQAFI CHERUSSOLAFIQH FILE | EPISODE 01', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432898612-44100-2-dee8318cceba.mp3', '00:17:11',
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46856965/46856965-1790676679082-7db351112fd31.jpg', '', 1, '2026-09-29T10:20:51.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'fiqh-files-02-e3pih42', '02 | മതം ഒന്നല്ലേ? പിന്നെന്തിനാണ് നാല് മദ്ഹബ്?', 'മതം ഒന്നല്ലേ? പിന്നെന്തിനാണ് നാല് മദ്ഹബ്?ABDUL JALEEL SAQAFI CHERUSSOLAFIQH FILE | EPISODE 02നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കാൻ താഴെയുള്ള ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക.https://fiqhfiles.samasthagraph.com', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432898982-44100-2-2e5a553105995.mp3', '00:28:23',
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46856965/46856965-1790676679082-7db351112fd31.jpg', '', 2, '2026-09-29T10:25:00.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'ihya-uloomudheen-01-e3pmdt0', '01 | ടെൻഷനില്ലാതെ ജീവിക്കാം ഇമാം ഗസ്സാലി (റ) യുടെ ഉപദേശങ്ങൾ', 'Ihya Uloomudheen, ഹൃദയ വഴികൾ إحياء علوم الدين എൻ എം സ്വാദിഖ് സഖാഫി പെരിന്താറ്റിരി | NM Swadiq Saqafi Perinthattiri മുഹമ്മദ് ഫാളിൽ നൂറാനി ദേവതിയാൽ | Falil Noorani Devathiyal', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-9-1/433064850-44100-2-ad31b9ddc3cf8.mp3', '00:46:54',
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46870919/46870919-1790837528597-b7dc507bc64a4.jpg', '', 1, '2026-10-01T06:57:17.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'l-kanthapuram-a-p-aboobacker-musliyar-l-coming-soon-e3naae8', 'ശംസുൽ ഉലമ ക്ഷണിച്ചു; അതൊരു ചരിത്ര നിയോഗമായി l Kanthapuram A P Aboobacker Musliyar l Coming Soon', 'ശംസുൽ ഉലമ ക്ഷണിച്ചു;അതൊരു ചരിത്ര നിയോഗമായി https://youtube.com/shorts/KVBawITjYkc𝙁𝙪𝙡𝙡 𝙫𝙞𝙙𝙚𝙤 𝙧𝙚𝙡𝙚𝙖𝙨𝙞𝙣𝙜 𝙤𝙣 𝘼𝙪𝙜𝙪𝙨𝙩 15© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-12/f9acd031-f211-013c-b857-399df7948e74.mp3', '00:01:20',
  'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/46535697/46535697-1786718302573-a57d4874c478.jpg', '', 1, '2026-08-12T10:41:05.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb--episode-01-e3nd87k', 'ഉസ്താദും ശിഷ്യനും | Minal Qalb | Episode 01', 'ഉസ്താദും ശിഷ്യനും | Minal Qalb | Episode 01 കാന്തപുരം എ.പി അബൂബകർ മിസ്ലിയാർപേരോട് അബ്ദുറഹ്മാൻ സഖാഫിyoutube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music © 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalb', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-14/429832137-44100-2-d70777b158acf.mp3', '00:27:57',
  'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg', '', 1, '2026-08-15T15:30:00.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb--episode-02-e3nms2e', 'എൻ്റെ പേരിൽ പറയാത്തഒരു ആരോപണവുമില്ല. എല്ലാം പറഞ്ഞു നോക്കിയിട്ടുണ്ട് | Minal Qalb | Episode 02', 'എൻ്റെ പേരിൽ പറയാത്ത ഒരു ആരോപണവുമില്ല. എല്ലാം പറഞ്ഞു നോക്കിയിട്ടുണ്ട്.കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർപേരോട് അബ്ദുറഹ്മാൻ സഖാഫിyoutube.com/@SamasthaGraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalb', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-21/430263191-44100-2-b5a69f03288e5.mp3', '00:29:26',
  'https://i.ytimg.com/vi/H0XAMl9Ej6o/hqdefault.jpg', '', 2, '2026-08-22T14:00:01.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb--episode-03-e3o48qu', 'ശംസുൽ ഉലമ ശംസുൽ ഉലമ തന്നെയാണ് | Minal Qalb | Episode 03', 'ശംസുൽ ഉലമ ശംസുൽ ഉലമ തന്നെയാണ് Minal Qalb | Episode 03കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർപേരോട് അബ്ദുറഹ്മാൻ സഖാഫി@samasthagraph facebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalb', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-31/430865921-44100-2-da07b0875a4b3.mp3', '00:27:29',
  'https://i.ytimg.com/vi/z8bQFqfhLN8/hqdefault.jpg', '', 10, '2026-08-31T07:25:58.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb--episode-04-e3ocbti', 'അവർ ഖുർആൻ ദുർവ്യാഖ്യാനം ചെയ്യുകയാണ്! | Minal Qalb | Episode 04', 'അവർ ഖുർആൻ ദുർവ്യാഖ്യാനം ചെയ്യുകയാണ്! | Minal Qalb | Episode 04!Minal Qalb | Episode 04youtube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalb', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-5/431225818-44100-2-78bd974e1e4f4.mp3', '00:20:14',
  'https://i.ytimg.com/vi/0BjdTGRSZgk/hqdefault.jpg', '', 12, '2026-09-07T05:17:44.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb--episode-05-e3omqpa', 'സമസ്തയുടെ മിനിറ്റ്‌സ് ബുക്കിൽ തുന്നിച്ചേർത്ത വിയോജനക്കുറിപ്പ് | Minal Qalb | Episode 05', 'സമസ്തയുടെ മിനിറ്റ്‌സ് ബുക്കിൽ തുന്നിച്ചേർത്ത വിയോജനക്കുറിപ്പ്Minal Qalb | Episode 05കാന്തപുരം എ.പി അബൂബകർ മുസ്ലിയാർപേരോട് അബ്ദുറഹ്മാൻ സഖാഫി@samasthagraph facebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalb', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-11/431676070-44100-2-a2c3810d6b1c8.mp3', '00:20:30',
  'https://i.ytimg.com/vi/TwxmHLDLSuU/hqdefault.jpg', '', 14, '2026-09-18T09:55:38.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb-clear-cut-e3o9eu1', 'Clear Cut', 'dfghjk', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-3/431094498-44100-2-538797b7e1e25.mp3', '00:04:55',
  'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg', '', 1, '2026-09-03T08:10:29.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'minal-qalb-episode-06-e3p1h1b', 'രാഷ്ട്രീയക്കാർ അന്നും അധിക്ഷേപിച്ചിരുന്നു; അന്നും ഇന്നും നമ്മൾ നിലപാട് മാറ്റിയിട്ടില്ല | Episode 06', 'രാഷ്ട്രീയക്കാർ അന്നും അധിക്ഷേപിച്ചിരുന്നു;അന്നും ഇന്നും നമ്മൾ നിലപാട് മാറ്റിയിട്ടില്ലMinal Qalb | Episode 06youtube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music © 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-18/432156050-44100-2-a33dd224d8409.mp3', '00:24:58',
  'https://i.ytimg.com/vi/na7sQzB_lQw/hqdefault.jpg', '', 2, '2026-09-22T05:55:52.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira--shafi-saqafi-mundambra--episode-01-e3nh9nh', 'സൂറത്തുൽ ഫാത്തിഹ: | Noorul Hira | Shafi Saqafi Mundambra | Episode 01', 'സൂറത്തുൽ ഫാത്തിഹ: നൂറ്റിപ്പത്തിമൂന്ന് സൂറത്തുകളുടെ രത്നച്ചുരുക്കംAl Fathiha- Noorul Hira Episode 1Shafi Saqafi Mundambrafacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph #minalqalbyoutube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-17/430012115-44100-2-87b3913f141c8.mp3', '00:17:48',
  'https://i.ytimg.com/vi/RbhBS4Rytq8/hqdefault.jpg', '', 3, '2026-08-19T05:58:08.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira-01-------shafi-saqafi-mundambra-e3ots5m', '01 | സാലറിയും ഫോളോവേഴ്‌സുമല്ല വിജയത്തിൻ്റെ അടിസ്ഥാനം | Shafi Saqafi Mundambra', 'Noorul Hira | Episode 4 Surat Al Baqara 1സാലറിയും ഫോളോവേഴ്‌സുമല്ല വിജയത്തിൻ്റെ അടിസ്ഥാനം | Shafi Saqafi Mundambra youtube.com/@SamasthaGraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-16/431992233-44100-2-ac4baac7493fc.mp3', '00:25:09',
  'https://i.ytimg.com/vi/RbhBS4Rytq8/hqdefault.jpg', '', 1, '2026-09-16T06:58:57.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira-02-------shafi-saqafi-mundambra-e3ots8a', '02 | മനുഷ്യരെ പറ്റിക്കാം അല്ലാഹുവിനെയോ? | Shafi Saqafi Mundambra', 'Noorul Hira | Episode 4 Surat Al Baqara| 02 മനുഷ്യരെ പറ്റിക്കാം അല്ലാഹുവിനെയോ? | Shafi Saqafi Mundambrayoutube.com/@Samasthagraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-16/431992360-44100-2-eb7edc2fb0f72.mp3', '00:18:44',
  'https://i.ytimg.com/vi/SVyssYvacDc/hqdefault.jpg', '', 2, '2026-09-16T07:04:42.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira-03-e3pig35', '03 | തെറ്റിനെ ന്യായീകരിക്കാറുണ്ടോ? ഖുർആനിന്റെ മുന്നറിയിപ്പുണ്ട്', 'തെറ്റിനെ ന്യായീകരിക്കാറുണ്ടോ? ഖുർആനിന്റെ മുന്നറിയിപ്പുണ്ട് | Shafi Saqafi MundambraNoorul Hira | Episode 6 Surat Al Baqara 3', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432897547-44100-2-f21b78efbeb9a.mp3', '00:16:58',
  'https://i.ytimg.com/vi/cAO8V0ZnMSI/hqdefault.jpg', '', 3, '2026-09-29T09:50:44.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira-04-e3pig5c', '04 | പരലോകം വിറ്റ് ദുനിയാവ് വാങ്ങുന്നവർ', 'പരലോകം വിറ്റ് ദുനിയാവ് വാങ്ങുന്നവർ | Shafi Saqafi MundambraNoorul Hira | Episode 7Surat Al Baqara 4', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-29/432897640-44100-2-a534b2180c159.mp3', '00:15:27',
  'https://i.ytimg.com/vi/F2OPQDM-sq0/hqdefault.jpg', '', 4, '2026-09-29T14:00:01.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'noorul-hira-intro---------shafi-saqafi-mundambra-e3ots11', 'Intro | സൂറത്തുൽ ബഖറ : വിശുദ്ധ ഖുർആനിന്റെ നേതാവ് | Shafi Saqafi Mundambra', 'സൂറത്തുൽ ബഖറ : വിശുദ്ധ ഖുർആനിന്റെ നേതാവ് | ശാഫി സഖാഫി മുണ്ടമ്പ്രyoutube.com/@SamasthaGraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-8-16/431992002-44100-2-db6a6ef9d54e.mp3', '00:01:58',
  'https://i.ytimg.com/vi/Gv7BbUzUeag/hqdefault.jpg', '', 1, '2026-09-16T06:52:50.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'timeline--abdul-samad-amani-pattuvam-e3o48ui', 'മാദിഹീങ്ങളോട് പറയാനുള്ളത് | timeline | Abdul Samad Amani Pattuvam', 'മാദിഹീങ്ങളോട് പറയാനുള്ളത് timeline | Abdul Samad Amani Pattuvam facebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-31/430867452-44100-2-b7fe730b88cde.mp3', '00:37:10',
  'https://i.ytimg.com/vi/iqIk1TTqfKQ/hqdefault.jpg', '', 11, '2026-08-31T08:07:36.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  'timeline--dr-muhammed-farooq-naeemi-al-bukhari-e3nmopj', 'മദ്ഹുറസൂൽ പ്രഭാഷണങ്ങൾ ഒരു നിയോഗം പോലെ സംഭവിച്ചതാണ് | timeline | Dr Muhammed Farooq Naeemi Al Bukhari', 'മദ്ഹുറസൂൽ പ്രഭാഷണങ്ങൾഒരു നിയോഗം പോലെ സംഭവിച്ചതാണ് | timeline | ഡോ. ഫാറൂഖ് നഈമി അൽ ബുഖാരിyoutube.com/@SamasthaGraphfacebook.com/SamasthaGraphinstagram.com/SamasthaGraphWe are available on Apple Podcast, Spotify, jiosaavn, Amazon Music Music© 𝗦𝗮𝗺𝗮𝘀𝘁𝗵𝗮 𝗚𝗿𝗮𝗽𝗵 #samastha #samasthagraph', 'https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-7-21/430267015-44100-2-aef77c2d56ad.mp3', '00:55:18',
  'https://i.ytimg.com/vi/iqIk1TTqfKQ/hqdefault.jpg', '', 7, '2026-08-22T09:44:58.000Z', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO programs (
  slug, title, description, cover_image, host, category, updated_at
) VALUES (
  'ananthapporul', 'Ananthapporul', 'Inspiring discourses on life, spirituality, and family harmony.', '', '', 'General', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  host = excluded.host,
  category = excluded.category,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO programs (
  slug, title, description, cover_image, host, category, updated_at
) VALUES (
  'fiqh-file', 'Fiqh File', 'Comprehensive Islamic jurisprudence rulings and contemporary questions.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6UwRxNHSdH4DgHb7NrvVwRRhNCYuTGnhQRnOnfHPzeDN1uTaUaz9_WWQ&s=10', '', 'General', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  host = excluded.host,
  category = excluded.category,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO programs (
  slug, title, description, cover_image, host, category, updated_at
) VALUES (
  'minal-qalb', 'Minal Qalb', 'A heart-touching series featuring deep reflections, wisdom, and conversations.', '', '', 'General', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  host = excluded.host,
  category = excluded.category,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO programs (
  slug, title, description, cover_image, host, category, updated_at
) VALUES (
  'noorul-hira', 'Noorul Hira', 'Comprehensive Quranic studies and explanations.', '', '', 'General', CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  host = excluded.host,
  category = excluded.category,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('about', '{"hero":{"eyebrow":"About Samastha Graph","statement":"The collective voice of Samastha","introText":"Samastha Graph is the official digital broadcasting network.","image":"/images/cms/about/hero.webp"},"enHero":{"eyebrow":"About Samastha Graph","statement":"The collective voice of Samastha","introText":"Samastha Graph is the official digital broadcasting network.","image":"/images/cms/about/hero.webp"},"story":{"text":"Samastha Kerala Jam''iyyathul Ulama, established in 1926, is the principal Sunni-Shafi''i scholarly body in Kerala. For nearly a century, it has guided the community in matters of faith, education, and social welfare.\n\nSamastha Graph was launched as the official digital media initiative to bring this legacy into the modern era. Our goal is to ensure that authentic Islamic teachings, organizational news, and educational content are accessible to the global Malayali diaspora.","image":"/images/cms/about/story.webp"},"enStory":{"text":"Samastha Kerala Jam''iyyathul Ulama, established in 1926, is the principal Sunni-Shafi''i scholarly body in Kerala. For nearly a century, it has guided the community in matters of faith, education, and social welfare.\n\nSamastha Graph was launched as the official digital media initiative to bring this legacy into the modern era. Our goal is to ensure that authentic Islamic teachings, organizational news, and educational content are accessible to the global Malayali diaspora.","image":"/images/cms/about/story.webp"},"mission":[{"title":"Preserve Heritage","description":"Safeguarding our rich history and traditions for future generations.","icon":"BookOpen"},{"title":"Foster Education","description":"Providing high-quality, accessible learning resources.","icon":"GraduationCap"},{"title":"Build Community","description":"Connecting individuals through shared values and knowledge.","icon":"Users"}],"enMission":[{"title":"Preserve Heritage","description":"Safeguarding our rich history and traditions for future generations.","icon":"BookOpen"},{"title":"Foster Education","description":"Providing high-quality, accessible learning resources.","icon":"GraduationCap"},{"title":"Build Community","description":"Connecting individuals through shared values and knowledge.","icon":"Users"}],"gallery":{"large":"/images/cms/about/gallery-large.webp","portrait":"/images/cms/about/gallery-portrait.webp","square":"/images/cms/about/gallery-square.webp","secondary":"/images/cms/about/gallery-secondary.webp"},"work":[{"title":"Digital Publications","description":"In-depth articles and research papers on contemporary issues."},{"title":"Multimedia Production","description":"High-quality documentaries, short films, and educational videos."},{"title":"Community Outreach","description":"Organizing events, seminars, and workshops across the state."}],"enWork":[{"title":"Digital Publications","description":"In-depth articles and research papers on contemporary issues."},{"title":"Multimedia Production","description":"High-quality documentaries, short films, and educational videos."},{"title":"Community Outreach","description":"Organizing events, seminars, and workshops across the state."}],"cta":{"title":"Join Our Mission","description":"Become a part of the Samastha Graph community. Explore our latest articles or reach out to collaborate with us."},"enCta":{"title":"Join Our Mission","description":"Become a part of the Samastha Graph community. Explore our latest articles or reach out to collaborate with us."}}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('authors', '{"authors":[{"id":"samastha-editorial","name":"Samastha Graph Editorial","nameMl":"സമസ്ത ഗ്രാഫ് എഡിറ്റോറിയൽ","role":"Editorial Board","avatar":"/Logo.png","bio":"Official editorial team of Samastha Graph."},{"id":"dr-abdul-hakeem-azhari","name":"Dr. Abdul Hakeem Azhari","nameMl":"ഡോ. അബ്ദുൽ ഹകീം അസ്ഹരി","role":"Islamic Scholar & Researcher","avatar":"","bio":"Prominent Islamic scholar and educator."},{"id":"moulana-rumi","name":"Moulana Jalaluddin Rumi","nameMl":"മൗലാനാ ജലാലുദ്ദീൻ റൂമി","role":"Classical Islamic Scholar & Mystic","avatar":"","bio":"13th-century Islamic scholar, theologian, and Persian poet."}]}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('contact', '{"hero":{"eyebrow":"Contact Us","supportTag":"24/7 Support","headline":"Get in Touch","description":"We''re here to help and answer any question you might have.","image":"/images/cms/contact/hero.webp"},"enHero":{"eyebrow":"Contact Us","supportTag":"24/7 Support","headline":"Get in Touch","description":"We''re here to help and answer any question you might have.","image":"/images/cms/contact/hero.webp"},"details":{"title":"Contact Details","description":"Reach out to us through any of these channels.","addressLabel":"Head Office","email":"info@samasthagraph.com","addressText":"Samastha Kerala Jam''iyyathul Ulama\nChelari, Malappuram\nKerala, India"},"enDetails":{"title":"Contact Details","description":"Reach out to us through any of these channels.","addressLabel":"Head Office","email":"info@samasthagraph.com","addressText":"Samastha Kerala Jam''iyyathul Ulama\nChelari, Malappuram\nKerala, India"},"location":{"title":"Visit Our Office","description":"Experience the center of our digital broadcasting network.","image":"/images/cms/contact/location.webp"},"enLocation":{"title":"Visit Our Office","description":"Experience the center of our digital broadcasting network.","image":"/images/cms/contact/location.webp"},"communicationNote":{"heading":"Every message matters.","description":"Whether you have a question, suggestion, collaboration proposal, or feedback, we value your communication with Samastha Graph."},"enCommunicationNote":{"heading":"Every message matters.","description":"Whether you have a question, suggestion, collaboration proposal, or feedback, we value your communication with Samastha Graph."}}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('homepage', '{"hero":{"enabled":true,"type":"video","slug":"minal-qalb-episode-01","layout":"cinematic","eyebrow":"FEATURED VIDEO","displayTitle":"","displayDescription":"","ctaText":"Watch Now"}}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('podcast-platforms', '{"platforms":[{"id":"1787322687774","name":"Apple","url":"https://podcasts.apple.com/in/podcast/samastha-graph/id6800692488","icon":"Apple","active":true,"order":1},{"id":"spotify","name":"Spotify","url":"https://open.spotify.com/show/0345OOoAsVlaDMFv1InStY","icon":"Spotify","active":true,"order":2},{"id":"1787322741636","name":"Jio Saavn","url":"https://www.jiosaavn.com/shows/samastha-graph/1/D7psVgNfNcA_","icon":"Jio Saavn","active":true,"order":3},{"id":"1787322822094","name":"Amazon Music","url":"https://music.amazon.in/podcasts/09e9891e-7e0c-429a-aab3-64f4b7f6ae11/samastha-graph","icon":"Amazon Music","active":true,"order":4},{"id":"1787322786029","name":"YouTube Music","url":"https://music.youtube.com/@SamasthaGraph","icon":"YouTube Music","active":true,"order":5}]}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('podcast-shows', '{"shows":[{"id":"samastha-graph","title":"Samastha Graph","subtitle":"Samastha Graph Podcast","feedUrl":"https://anchor.fm/s/115f86d24/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg","description":"The official podcast series of Samastha Graph exploring history, missions, and scholarly intellectual discourses.","active":true,"order":1},{"id":"minal-qalb","title":"Minal Qalb","subtitle":"From the Heart","feedUrl":"https://anchor.fm/s/116cf0fa0/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46676360/46676360-1788422894332-c2d51c3f4d7f6.jpg","description":"A spiritual podcast series featuring heart-touching reflections and deep conversations.","active":true,"order":2},{"id":"fiqh-files","title":"Fiqh Files","subtitle":"Fiqh Files","feedUrl":"https://anchor.fm/s/117e2a474/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46856965/46856965-1790676679082-7db351112fd31.jpg","description":"An educational series explaining Islamic jurisprudence rulings, clarifications, and contemporary issues.","active":true,"order":3},{"id":"ananthaporul","title":"Ananthaporul","subtitle":"Ananthaporul - Anas Amani Pushpagiri","feedUrl":"https://anchor.fm/s/11773b7f8/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46784270/46784270-1789794250435-1377b2f621128.jpg","description":"Inspirational discourses on life success, peace of mind, and family life led by Anas Amani Pushpagiri.","active":true,"order":4},{"id":"noorul-hira","title":"Noorul Hira","subtitle":"Surah Al-Baqarah Reflections","feedUrl":"https://anchor.fm/s/11752d344/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46762713/46762713-1789541395807-032fb91d22cf2.jpg","description":"An in-depth explanation and commentary series on the Holy Quran''s Surah Al-Baqarah.","active":true,"order":5},{"id":"ihya-uloomudheen","title":"Ihya Uloomudheen","subtitle":"Paths of the Heart","feedUrl":"https://anchor.fm/s/117f7ef3c/podcast/rss","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46870919/46870919-1790837528597-b7dc507bc64a4.jpg","description":"Timeless wisdom and spiritual purification reflections from Imam Al-Ghazali''s Ihya Uloomuddeen.","active":true,"order":6}]}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('profile', '{"identity":{"name":"Samastha Graph","subtitle":"The Visual Universe of Knowledge","biography":"Samastha Graph is the official digital broadcasting network representing the collective voice of Samastha and its organizational wings.","logo":"/images/profile-logo.webp"},"enIdentity":{"name":"Samastha Graph","subtitle":"The visual universe of knowledge journey","biography":"Samastha Graph is the official digital broadcasting network representing the collective voice of Samastha and its organizational wings.","logo":"/images/profile-logo.webp"},"featuredCTA":{"title":"Visit Website","url":"https://samasthagraph.com","active":true},"links":[{"id":"1","title":"Latest Article","description":"Read our newest publication on Islamic history","url":"/articles","icon":"FileText","active":true,"order":1}],"featuredContent":{"showLatestVideo":true,"showLatestPodcast":true,"showLatestArticle":true}}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('social-platforms', '{"platforms":[{"id":"youtube","name":"YouTube","url":"https://www.youtube.com/@SamasthaGraph","icon":"Youtube","active":true,"order":1},{"id":"facebook","name":"Facebook","url":"https://facebook.com/SamasthaGraph","icon":"Facebook","active":true,"order":2},{"id":"instagram","name":"Instagram","url":"https://instagram.com/samasthagraph","icon":"Instagram","active":true,"order":3},{"id":"1787322879555","name":"X","url":"https://www.x.com/SamasthaGraph","icon":"X","active":true,"order":4},{"id":"1787322902325","name":"WhatsApp Channel","url":"https://whatsapp.com/channel/0029Vb9kOJ7IiRp0Kotu2y3W","icon":"WhatsApp ","active":true,"order":5}]}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (key, value, updated_at)
VALUES ('spotlight', '{"heroType":"program","customBanner":"","referenceId":"minal-qalb"}', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;