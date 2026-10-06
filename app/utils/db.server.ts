/// <reference types="@cloudflare/workers-types" />

// Auto-initialize tables in D1 if not yet created
export async function ensureTablesExist(db: D1Database): Promise<void> {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
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

      CREATE TABLE IF NOT EXISTS videos (
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

      CREATE TABLE IF NOT EXISTS podcasts (
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

      CREATE TABLE IF NOT EXISTS programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        host TEXT,
        category TEXT,
        youtube_playlist_id TEXT,
        youtube_thumbnail TEXT,
        status TEXT DEFAULT 'published',
        language TEXT DEFAULT 'ml',
        translation_group_id TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_ml TEXT,
        role TEXT,
        avatar TEXT,
        bio TEXT,
        twitter TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safe incremental column migrations for programs
    const programColumns = [
      "ALTER TABLE programs ADD COLUMN youtube_playlist_id TEXT",
      "ALTER TABLE programs ADD COLUMN youtube_thumbnail TEXT",
      "ALTER TABLE programs ADD COLUMN status TEXT DEFAULT 'published'",
      "ALTER TABLE programs ADD COLUMN language TEXT DEFAULT 'ml'",
      "ALTER TABLE programs ADD COLUMN translation_group_id TEXT",
      "ALTER TABLE programs ADD COLUMN published_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    ];
    for (const colSql of programColumns) {
      try {
        await db.prepare(colSql).run();
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Table verification / creation warning:", e);
  }
}

// ---------------- ARTICLES ---------------- //

export async function getDbArticles(db?: D1Database): Promise<any[]> {
  if (!db) return [];
  try {
    await ensureTablesExist(db);
    const { results } = await db.prepare("SELECT * FROM articles ORDER BY published_at DESC").all();
    return (results || []).map((row: any) => ({
      slug: row.slug,
      title: row.title,
      advancedTitle: row.advanced_title,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      thumbImage: row.thumb_image,
      category: row.category,
      author: row.author,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      themePreset: row.theme_preset,
      status: row.status,
      readingTime: row.reading_time,
      translationGroupId: row.translation_group_id,
      publishedAt: row.published_at,
      body: row.body,
      type: "article"
    }));
  } catch (err) {
    console.warn("Error fetching articles from D1:", err);
    return [];
  }
}

export async function getDbArticleBySlug(db: D1Database | undefined, slug: string): Promise<any | null> {
  if (!db) return null;
  try {
    await ensureTablesExist(db);
    const row: any = await db.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).first();
    if (!row) return null;
    return {
      slug: row.slug,
      title: row.title,
      advancedTitle: row.advanced_title,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      thumbImage: row.thumb_image,
      category: row.category,
      author: row.author,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      themePreset: row.theme_preset,
      status: row.status,
      readingTime: row.reading_time,
      translationGroupId: row.translation_group_id,
      publishedAt: row.published_at,
      body: row.body,
      type: "article"
    };
  } catch (err) {
    console.warn("Error fetching article by slug from D1:", err);
    return null;
  }
}

export async function saveDbArticle(db: D1Database, article: any): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare(`
      INSERT INTO articles (
        slug, title, advanced_title, excerpt, cover_image, thumb_image,
        category, author, seo_title, seo_description, theme_preset,
        status, reading_time, translation_group_id, published_at, body, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
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
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      article.slug,
      article.title || "",
      article.advancedTitle || "",
      article.excerpt || "",
      article.coverImage || "",
      article.thumbImage || "",
      article.category || "General",
      article.author || "Admin",
      article.seoTitle || "",
      article.seoDescription || "",
      article.themePreset || "theme-malayalam-standard",
      article.status || "published",
      Number(article.readingTime) || 5,
      article.translationGroupId || null,
      article.publishedAt || new Date().toISOString(),
      article.body || ""
    ).run();
    return true;
  } catch (err) {
    console.error("Error saving article to D1:", err);
    throw err;
  }
}

export async function deleteDbArticle(db: D1Database, slug: string): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare("DELETE FROM articles WHERE slug = ?").bind(slug).run();
    return true;
  } catch (err) {
    console.error("Error deleting article from D1:", err);
    throw err;
  }
}

// ---------------- VIDEOS ---------------- //

export async function getDbVideos(db?: D1Database): Promise<any[]> {
  if (!db) return [];
  try {
    await ensureTablesExist(db);
    const { results } = await db.prepare("SELECT * FROM videos ORDER BY published_at DESC").all();
    return (results || []).map((row: any) => ({
      slug: row.slug,
      title: row.title,
      youtubeId: row.youtube_id,
      id: row.youtube_id,
      description: row.description,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      thumbnail: row.thumbnail_url,
      duration: row.duration,
      program: row.program_name,
      programName: row.program_name,
      publishedAt: row.published_at,
      type: "video"
    }));
  } catch (err) {
    console.warn("Error fetching videos from D1:", err);
    return [];
  }
}

export async function getDbVideoBySlug(db: D1Database | undefined, slug: string): Promise<any | null> {
  if (!db) return null;
  try {
    await ensureTablesExist(db);
    const row: any = await db.prepare("SELECT * FROM videos WHERE slug = ?").bind(slug).first();
    if (!row) return null;
    return {
      slug: row.slug,
      title: row.title,
      youtubeId: row.youtube_id,
      id: row.youtube_id,
      description: row.description,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      thumbnail: row.thumbnail_url,
      duration: row.duration,
      program: row.program_name,
      programName: row.program_name,
      publishedAt: row.published_at,
      type: "video"
    };
  } catch (err) {
    console.warn("Error fetching video by slug from D1:", err);
    return null;
  }
}

export async function saveDbVideo(db: D1Database, video: any): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare(`
      INSERT INTO videos (
        slug, title, youtube_id, description, category,
        thumbnail_url, duration, program_name, published_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        youtube_id = excluded.youtube_id,
        description = excluded.description,
        category = excluded.category,
        thumbnail_url = excluded.thumbnail_url,
        duration = excluded.duration,
        program_name = excluded.program_name,
        published_at = excluded.published_at,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      video.slug,
      video.title || "",
      video.youtubeId || video.id || "",
      video.description || "",
      video.category || "General",
      video.thumbnailUrl || video.thumbnail || "",
      video.duration || "",
      video.program || video.programName || "",
      video.publishedAt || new Date().toISOString()
    ).run();
    return true;
  } catch (err) {
    console.error("Error saving video to D1:", err);
    throw err;
  }
}

export async function deleteDbVideo(db: D1Database, slug: string): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare("DELETE FROM videos WHERE slug = ?").bind(slug).run();
    return true;
  } catch (err) {
    console.error("Error deleting video from D1:", err);
    throw err;
  }
}

// ---------------- PODCASTS ---------------- //

export async function getDbPodcasts(db?: D1Database): Promise<any[]> {
  if (!db) return [];
  try {
    await ensureTablesExist(db);
    const { results } = await db.prepare("SELECT * FROM podcasts ORDER BY episode_number DESC, published_at DESC").all();
    return (results || []).map((row: any) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      audioUrl: row.audio_url,
      duration: row.duration,
      coverImage: row.cover_image,
      show: row.show_name,
      showName: row.show_name,
      episodeNumber: row.episode_number,
      publishedAt: row.published_at,
      type: "podcast"
    }));
  } catch (err) {
    console.warn("Error fetching podcasts from D1:", err);
    return [];
  }
}

export async function getDbPodcastBySlug(db: D1Database | undefined, slug: string): Promise<any | null> {
  if (!db) return null;
  try {
    await ensureTablesExist(db);
    const row: any = await db.prepare("SELECT * FROM podcasts WHERE slug = ?").bind(slug).first();
    if (!row) return null;
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      audioUrl: row.audio_url,
      duration: row.duration,
      coverImage: row.cover_image,
      show: row.show_name,
      showName: row.show_name,
      episodeNumber: row.episode_number,
      publishedAt: row.published_at,
      type: "podcast"
    };
  } catch (err) {
    console.warn("Error fetching podcast by slug from D1:", err);
    return null;
  }
}

export async function saveDbPodcast(db: D1Database, podcast: any): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare(`
      INSERT INTO podcasts (
        slug, title, description, audio_url, duration,
        cover_image, show_name, episode_number, published_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        audio_url = excluded.audio_url,
        duration = excluded.duration,
        cover_image = excluded.cover_image,
        show_name = excluded.show_name,
        episode_number = excluded.episode_number,
        published_at = excluded.published_at,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      podcast.slug,
      podcast.title || "",
      podcast.description || "",
      podcast.audioUrl || "",
      podcast.duration || "",
      podcast.coverImage || "",
      podcast.show || podcast.showName || "",
      Number(podcast.episodeNumber) || 1,
      podcast.publishedAt || new Date().toISOString()
    ).run();
    return true;
  } catch (err) {
    console.error("Error saving podcast to D1:", err);
    throw err;
  }
}

export async function deleteDbPodcast(db: D1Database, slug: string): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare("DELETE FROM podcasts WHERE slug = ?").bind(slug).run();
    return true;
  } catch (err) {
    console.error("Error deleting podcast from D1:", err);
    throw err;
  }
}

// ---------------- PROGRAMS ---------------- //

export async function getDbPrograms(db?: D1Database): Promise<any[]> {
  if (!db) return [];
  try {
    await ensureTablesExist(db);
    const { results } = await db.prepare("SELECT * FROM programs ORDER BY published_at DESC, created_at DESC").all();
    return (results || []).map((row: any) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      coverImage: row.cover_image,
      host: row.host,
      category: row.category,
      youtubePlaylistId: row.youtube_playlist_id,
      youtubeThumbnail: row.youtube_thumbnail,
      status: row.status || 'published',
      language: row.language || 'ml',
      translationGroupId: row.translation_group_id,
      publishedAt: row.published_at || (row.created_at ? row.created_at.split('T')[0] : ''),
      type: "program"
    }));
  } catch (err) {
    console.warn("Error fetching programs from D1:", err);
    return [];
  }
}

export async function saveDbProgram(db: D1Database, program: any): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare(`
      INSERT INTO programs (
        slug, title, description, cover_image, host, category,
        youtube_playlist_id, youtube_thumbnail, status, language,
        translation_group_id, published_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        cover_image = excluded.cover_image,
        host = excluded.host,
        category = excluded.category,
        youtube_playlist_id = excluded.youtube_playlist_id,
        youtube_thumbnail = excluded.youtube_thumbnail,
        status = excluded.status,
        language = excluded.language,
        translation_group_id = excluded.translation_group_id,
        published_at = excluded.published_at,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      program.slug,
      program.title || "",
      program.description || "",
      program.coverImage || "",
      program.host || "",
      program.category || "General",
      program.youtubePlaylistId || "",
      program.youtubeThumbnail || "",
      program.status || "published",
      program.language || "ml",
      program.translationGroupId || "",
      program.publishedAt || new Date().toISOString().split('T')[0]
    ).run();
    return true;
  } catch (err) {
    console.error("Error saving program to D1:", err);
    throw err;
  }
}

export async function deleteDbProgram(db: D1Database, slug: string): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    await db.prepare("DELETE FROM programs WHERE slug = ?").bind(slug).run();
    return true;
  } catch (err) {
    console.error("Error deleting program from D1:", err);
    throw err;
  }
}

// ---------------- SITE SETTINGS ---------------- //

export async function getDbSetting(db: D1Database | undefined, key: string): Promise<any | null> {
  if (!db) return null;
  try {
    await ensureTablesExist(db);
    const row: any = await db.prepare("SELECT value FROM site_settings WHERE key = ?").bind(key).first();
    if (!row || !row.value) return null;
    return JSON.parse(row.value);
  } catch (err) {
    console.warn(`Error fetching setting '${key}' from D1:`, err);
    return null;
  }
}

export async function saveDbSetting(db: D1Database, key: string, value: any): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    const jsonStr = typeof value === "string" ? value : JSON.stringify(value);
    await db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `).bind(key, jsonStr).run();
    return true;
  } catch (err) {
    console.error(`Error saving setting '${key}' to D1:`, err);
    throw err;
  }
}

// ---------------- AUTHORS & SCHOLARS ---------------- //

export async function getDbAuthors(db?: D1Database): Promise<{ authors: any[] }> {
  // 1. First check site_settings in D1
  if (db) {
    try {
      const dbAuthors = await getDbSetting(db, "authors");
      if (dbAuthors && Array.isArray(dbAuthors.authors) && dbAuthors.authors.length > 0) {
        return dbAuthors;
      }
    } catch (e) {
      console.warn("D1 getDbAuthors site_settings warning:", e);
    }

    // 2. Next check authors table in D1
    try {
      await ensureTablesExist(db);
      const { results } = await db.prepare("SELECT * FROM authors ORDER BY name ASC").all();
      if (results && results.length > 0) {
        const mapped = results.map((row: any) => ({
          id: row.id,
          name: row.name,
          nameMl: row.name_ml,
          role: row.role,
          avatar: row.avatar,
          bio: row.bio,
          twitter: row.twitter,
          website: row.website
        }));
        return { authors: mapped };
      }
    } catch (e) {
      console.warn("D1 getDbAuthors table warning:", e);
    }
  }

  // 3. Fallback to static authors.json
  try {
    const authorsGlob = import.meta.glob("../content/settings/authors.json", { import: 'default', eager: true });
    const authorsData = Object.values(authorsGlob)[0] as any;
    if (authorsData?.authors) {
      return authorsData;
    }
  } catch (e) {
    console.warn("Fallback authors.json error:", e);
  }

  return { authors: [] };
}

export async function saveDbAuthors(db: D1Database, authors: any[]): Promise<boolean> {
  try {
    await ensureTablesExist(db);
    // Save to site_settings for JSON compatibility
    await saveDbSetting(db, "authors", { authors });

    // Sync to authors table
    for (const a of authors) {
      if (!a.id) continue;
      await db.prepare(`
        INSERT INTO authors (id, name, name_ml, role, avatar, bio, twitter, website, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          name_ml = excluded.name_ml,
          role = excluded.role,
          avatar = excluded.avatar,
          bio = excluded.bio,
          twitter = excluded.twitter,
          website = excluded.website,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        a.id,
        a.name || a.nameMl || 'Author',
        a.nameMl || '',
        a.role || '',
        a.avatar || '',
        a.bio || '',
        a.twitter || '',
        a.website || ''
      ).run();
    }
    return true;
  } catch (err) {
    console.error("Error saving authors to D1:", err);
    throw err;
  }
}

