const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Preluăm directorul primit ca argument în terminal (ex: node check-syntax.js ./folder)
const targetDir = process.argv[2];

if (!targetDir) {
  console.error("❌ Te rog specifică un director. Exemplu: node check-syntax.js ./nume-director");
  process.exit(1);
}

function checkFileSyntax(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    // Compilează codul în memorie fără a-l executa
    new vm.Script(code, { filename: filePath });
    console.log(`✅ ${filePath} - OK`);
  } catch (err) {
    console.error(`❌ ${filePath} - Eroare de sintaxă:`);
    console.error(err.message); // Afișează doar linia și eroarea exactă
    process.exitCode = 1; // Marchează procesul ca eșuat pentru CI/CD sau scripturi automate
  }
}

function scanDirectoryRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directorul nu există: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Dacă e director, intră adânc în el (recursivitate)
      scanDirectoryRecursively(fullPath); 
    } else if (file.endsWith('.js')) {
      // Dacă e fișier .js, îl verifică
      checkFileSyntax(fullPath);
    }
  }
}

// Pornim scanarea din directorul specificat
console.log(`🔍 Se scanează recursiv directorul: ${path.resolve(targetDir)}\n`);
scanDirectoryRecursively(path.resolve(targetDir));
