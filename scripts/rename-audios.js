const fs = require('fs');
const path = require('path');

const audiosDir = path.join(__dirname, '../public/audios');
const files = fs.readdirSync(audiosDir);

const charRegex = /^([a-zA-Z]+)[\s.]*([123]?)/i;
const fileMap = {};

files.forEach(file => {
  if (file.length === 5 && file.endsWith('.mp4')) return;
  if (file.startsWith('.')) return;
  if (/^[0-9]/.test(file)) return;

  const match = file.match(charRegex);
  if (match) {
    let char = match[1].toLowerCase();
    char = char[0]; 
    if (!fileMap[char]) fileMap[char] = [];
    fileMap[char].push(file);
  }
});

Object.keys(fileMap).forEach(char => {
  const charFiles = fileMap[char];
  let primaryFile = charFiles.find(f => f.includes('1')) || charFiles[0];
  
  const oldPath = path.join(audiosDir, primaryFile);
  const newPath = path.join(audiosDir, `${char}.mp4`);
  
  console.log(`Copying: "${primaryFile}" -> "${char}.mp4"`);
  if (!fs.existsSync(newPath)) {
    fs.copyFileSync(oldPath, newPath);
  }
});

console.log("Renaming/Copying complete.");
