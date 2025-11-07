// Script para copiar index.html para 404.html
// Necessário para o GitHub Pages funcionar com rotas do Angular

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'dayinvestview');
const indexPath = path.join(distPath, 'index.html');
const notFoundPath = path.join(distPath, '404.html');

try {
  // Verifica se o index.html existe
  if (!fs.existsSync(indexPath)) {
    console.error('Erro: index.html não encontrado em', indexPath);
    process.exit(1);
  }

  // Lê o conteúdo do index.html
  let content = fs.readFileSync(indexPath, 'utf8');

  // Atualiza o base href para funcionar corretamente no 404
  content = content.replace('<base href="/">', '<base href="/DayInvestView/">');

  // Escreve o 404.html
  fs.writeFileSync(notFoundPath, content, 'utf8');

  console.log('✅ 404.html criado com sucesso!');
} catch (error) {
  console.error('Erro ao criar 404.html:', error);
  process.exit(1);
}

