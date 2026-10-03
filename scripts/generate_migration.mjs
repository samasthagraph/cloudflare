import fs from 'fs';
import path from 'path';
import fm from 'front-matter';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str;
  if (typeof str === 'boolean') return str ? 1 : 0;
  return "'" + String(str).replace(/'/g, "''") + "'";
}

const contentDir = path.resolve('app/content');
let sqlStatements = [];

sqlStatements.push(`-- Samastha Graph Complete Data Migration to Cloudflare D1

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
`);

// 1. ARTICLES
const articlesDir = path.join(contentDir, 'articles');
if (fs.existsSync(articlesDir)) {
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  for (const file of files) {
    const slug = file.replace(/\.(mdx|md)$/, '');
    const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
    const { attributes, body } = fm(raw);

    const title = attributes.title || slug;
    const advancedTitle = attributes.advancedTitle || title;
    const excerpt = attributes.excerpt || '';
    const coverImage = attributes.coverImage || '';
    const thumbImage = attributes.thumbImage || '';
    const category = attributes.category || 'General';
    const author = attributes.author || 'Admin';
    const seoTitle = attributes.seoTitle || '';
    const seoDescription = attributes.seoDescription || '';
    const themePreset = attributes.themePreset || 'theme-malayalam-standard';
    const status = attributes.status || 'published';
    const readingTime = Number(attributes.readingTime) || 5;
    const translationGroupId = attributes.translationGroupId || null;
    const publishedAt = attributes.publishedAt || new Date().toISOString();

    sqlStatements.push(`INSERT INTO articles (
  slug, title, advanced_title, excerpt, cover_image, thumb_image,
  category, author, seo_title, seo_description, theme_preset,
  status, reading_time, translation_group_id, published_at, body, updated_at
) VALUES (
  ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(advancedTitle)}, ${escapeSql(excerpt)}, ${escapeSql(coverImage)}, ${escapeSql(thumbImage)},
  ${escapeSql(category)}, ${escapeSql(author)}, ${escapeSql(seoTitle)}, ${escapeSql(seoDescription)}, ${escapeSql(themePreset)},
  ${escapeSql(status)}, ${readingTime}, ${escapeSql(translationGroupId)}, ${escapeSql(publishedAt)}, ${escapeSql(body)}, CURRENT_TIMESTAMP
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
  updated_at = CURRENT_TIMESTAMP;`);
  }
}

// 2. VIDEOS
const videosDir = path.join(contentDir, 'videos');
if (fs.existsSync(videosDir)) {
  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(videosDir, file), 'utf-8');
    try {
      const data = JSON.parse(raw);
      const title = data.title || slug;
      const youtubeId = data.youtubeId || data.id || '';
      const description = data.description || data.body || '';
      const category = data.category || 'General';
      const thumbnailUrl = data.thumbnailUrl || data.thumbnail || data.customThumbnail || '';
      const duration = data.duration || '';
      const programName = data.program || data.programName || data.programId || '';
      const publishedAt = data.publishedAt || new Date().toISOString();

      sqlStatements.push(`INSERT INTO videos (
  slug, title, youtube_id, description, category,
  thumbnail_url, duration, program_name, published_at, updated_at
) VALUES (
  ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(youtubeId)}, ${escapeSql(description)}, ${escapeSql(category)},
  ${escapeSql(thumbnailUrl)}, ${escapeSql(duration)}, ${escapeSql(programName)}, ${escapeSql(publishedAt)}, CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  youtube_id = excluded.youtube_id,
  description = excluded.description,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  duration = excluded.duration,
  program_name = excluded.program_name,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;`);
    } catch (e) {
      console.warn(`Error parsing video ${file}:`, e);
    }
  }
}

// 3. PODCASTS
const podcastsDir = path.join(contentDir, 'podcasts');
if (fs.existsSync(podcastsDir)) {
  const files = fs.readdirSync(podcastsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(podcastsDir, file), 'utf-8');
    try {
      const data = JSON.parse(raw);
      const title = data.title || slug;
      const description = data.description || data.body || '';
      const audioUrl = data.audioUrl || '';
      const duration = data.duration || '00:00';
      const coverImage = data.coverImage || data.artwork || data.customThumbnail || '';
      const showName = data.show || data.showName || data.series || '';
      const episodeNumber = Number(data.episodeNumber) || 1;
      const publishedAt = data.publishedAt || new Date().toISOString();

      sqlStatements.push(`INSERT INTO podcasts (
  slug, title, description, audio_url, duration,
  cover_image, show_name, episode_number, published_at, updated_at
) VALUES (
  ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(description)}, ${escapeSql(audioUrl)}, ${escapeSql(duration)},
  ${escapeSql(coverImage)}, ${escapeSql(showName)}, ${episodeNumber}, ${escapeSql(publishedAt)}, CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  audio_url = excluded.audio_url,
  duration = excluded.duration,
  cover_image = excluded.cover_image,
  show_name = excluded.show_name,
  episode_number = excluded.episode_number,
  published_at = excluded.published_at,
  updated_at = CURRENT_TIMESTAMP;`);
    } catch (e) {
      console.warn(`Error parsing podcast ${file}:`, e);
    }
  }
}

// 4. PROGRAMS
const programsDir = path.join(contentDir, 'programs');
if (fs.existsSync(programsDir)) {
  const files = fs.readdirSync(programsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(programsDir, file), 'utf-8');
    try {
      const data = JSON.parse(raw);
      const title = data.title || slug;
      const description = data.description || '';
      const coverImage = data.coverImage || data.thumbnail || '';
      const host = data.host || '';
      const category = data.category || 'General';

      sqlStatements.push(`INSERT INTO programs (
  slug, title, description, cover_image, host, category, updated_at
) VALUES (
  ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(description)}, ${escapeSql(coverImage)}, ${escapeSql(host)}, ${escapeSql(category)}, CURRENT_TIMESTAMP
) ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  host = excluded.host,
  category = excluded.category,
  updated_at = CURRENT_TIMESTAMP;`);
    } catch (e) {
      console.warn(`Error parsing program ${file}:`, e);
    }
  }
}

// 5. SITE SETTINGS
const settingsDir = path.join(contentDir, 'settings');
if (fs.existsSync(settingsDir)) {
  const files = fs.readdirSync(settingsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const key = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(settingsDir, file), 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      const jsonStr = JSON.stringify(parsed);
      sqlStatements.push(`INSERT INTO site_settings (key, value, updated_at)
VALUES (${escapeSql(key)}, ${escapeSql(jsonStr)}, CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;`);
    } catch (e) {
      console.warn(`Error parsing setting ${file}:`, e);
    }
  }
}

const outputPath = path.resolve('migration_data.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n\n'), 'utf-8');
console.log(`Successfully generated ${sqlStatements.length - 1} SQL insert statements into ${outputPath}`);
