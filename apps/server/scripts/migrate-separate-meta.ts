import matter from 'gray-matter';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IDEA_DIR = './base-path/idea';

async function migrate() {
  const folders = await readdir(IDEA_DIR, { withFileTypes: true });
  
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    
    const folderPath = path.join(IDEA_DIR, folder.name);
    const files = await readdir(folderPath);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      if (file === 'index.md') continue;
      
      const filePath = path.join(folderPath, file);
      const content = await readFile(filePath, 'utf-8');
      
      if (content.startsWith('---')) {
        const { content: body } = matter(content);
        await writeFile(filePath, body, 'utf-8');
        console.log(`Cleaned: ${folder.name}/${file}`);
      }
    }
  }
  
  console.log('Migration complete!');
}

migrate().catch(console.error);
