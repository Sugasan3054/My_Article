import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const articlesDir = path.join(rootDir, 'content', 'articles');
const outputPath = path.join(rootDir, 'content', 'index.json');
const publicContentDir = path.join(rootDir, 'public', 'content');
const publicArticlesDir = path.join(publicContentDir, 'articles');

// ディレクトリ作成
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}
if (!fs.existsSync(publicArticlesDir)) {
  fs.mkdirSync(publicArticlesDir, { recursive: true });
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }
  try {
    const data = yaml.load(match[1]) || {};
    return { data, body: match[2] };
  } catch (e) {
    console.error('YAML parse error:', e);
    return { data: {}, body: content };
  }
}

function buildIndex() {
  console.log('Building articles index...');
  const files = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.md'));

  const articles = [];

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseFrontMatter(rawContent);

    // slugの導出: 2026-08-10-sample-title.md -> 2026-08-10-sample-title
    const slug = file.replace(/\.md$/, '');

    // ファイルコピー to public/content/articles (Vite配信用)
    const publicFilePath = path.join(publicArticlesDir, file);
    fs.copyFileSync(filePath, publicFilePath);

    articles.push({
      slug,
      filename: file,
      title: data.title || slug,
      date: data.date ? (data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date)) : '',
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      source_url: data.source_url || '',
      source_type: data.source_type || 'article',
      source_title: data.source_title || '',
      video_id: data.video_id || '',
      summary: data.summary || '',
    });
  }

  // 日付順で降順ソート (最新順)
  articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const indexData = {
    generated_at: new Date().toISOString(),
    total: articles.length,
    articles,
  };

  fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2), 'utf-8');
  // public/content/index.json にもコピー
  fs.writeFileSync(path.join(publicContentDir, 'index.json'), JSON.stringify(indexData, null, 2), 'utf-8');

  console.log(`Successfully indexed ${articles.length} articles -> ${outputPath} and ${path.join(publicContentDir, 'index.json')}`);
}

buildIndex();
