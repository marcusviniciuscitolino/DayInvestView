const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = path.join(__dirname, '..', '..', 'Dados_Rentabilidade Carteira.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

// Processar linhas
const lines = csv.split('\n').slice(1).filter(l => l.trim());
const data = [];

lines.forEach((line, idx) => {
  // Parse CSV manualmente (considerando aspas)
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  if (parts.length < 4) return;
  
  const date = parts[0];
  const position = parts[2];
  const quotaValue = parts[3];
  
  if (!date || !quotaValue) return;
  
  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const dateMatch = date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) return;
  
  const dateObj = new Date(
    parseInt(dateMatch[3]),
    parseInt(dateMatch[2]) - 1,
    parseInt(dateMatch[1])
  );
  
  const formattedDate = dateObj.toISOString().split('T')[0];
  
  // Converter valor da cota da carteira (substituir vírgula por ponto)
  // O valor já está no formato correto (ex: 1,02162437770872 = 1.02162437770872)
  const quota = parseFloat(quotaValue.replace(',', '.'));
  
  if (isNaN(quota)) return;
  
  // Usar o valor da cota diretamente, sem multiplicar
  const value = quota;
  
  data.push({
    id: `quota-${idx + 1}`,
    userId: 'investor-1',
    date: formattedDate,
    quotaValue: value
  });
});

// Salvar JSON
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'portfolio-quota.json');
fs.writeFileSync(outputPath, JSON.stringify({ portfolioQuota: data }, null, 2));

console.log(`Arquivo criado com ${data.length} registros`);
console.log(`Primeiro registro:`, data[0]);
console.log(`Último registro:`, data[data.length - 1]);

