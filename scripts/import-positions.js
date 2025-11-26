const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = path.join(__dirname, '..', '..', 'Dados_Posição.csv');
if (!fs.existsSync(csvPath)) {
  console.error(`Erro: Arquivo CSV não encontrado: ${csvPath}`);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');

// Ler arquivos de dados
const positionsPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'positions.json');
const positionsData = JSON.parse(fs.readFileSync(positionsPath, 'utf8'));

const movementsPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'movements.json');
const movementsData = JSON.parse(fs.readFileSync(movementsPath, 'utf8'));

// Parse CSV manualmente (considerando aspas)
function parseCSVLine(line) {
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
  return parts.map(p => p.replace(/^"|"$/g, ''));
}

// Processar CSV
const lines = csv.split('\n').filter(l => l.trim());

if (lines.length < 2) {
  console.error('Erro: CSV não tem dados suficientes');
  process.exit(1);
}

// Linha 1: Nomes dos ativos
const headerLine = parseCSVLine(lines[0]);
const assetNames = headerLine.filter(name => name && name !== 'Data' && name !== 'Total');

console.log(`Ativos encontrados: ${assetNames.join(', ')}`);

// Extrair todas as datas únicas do CSV
const dates = [];
for (let rowIdx = 2; rowIdx < lines.length; rowIdx++) {
  const line = lines[rowIdx];
  if (!line.trim()) continue;
  
  const parts = parseCSVLine(line);
  const dateStr = parts[0];
  if (!dateStr || dateStr === 'Data') continue;
  
  const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const dateObj = new Date(
      parseInt(dateMatch[3]),
      parseInt(dateMatch[2]) - 1,
      parseInt(dateMatch[1])
    );
    const formattedDate = dateObj.toISOString().split('T')[0];
    if (!dates.includes(formattedDate)) {
      dates.push(formattedDate);
    }
  }
}

dates.sort();
console.log(`\nEncontradas ${dates.length} datas únicas`);
console.log(`Período: ${dates[0]} a ${dates[dates.length - 1]}`);

// Filtrar movimentos do usuário
const userId = 'investor-1'; // maria.santos@email.com
const userMovements = movementsData.movements
  .filter(mov => mov.userId === userId)
  .sort((a, b) => new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime());

console.log(`\nEncontrados ${userMovements.length} movimentos para ${userId}`);

// Função para calcular posição em uma data específica
function calculatePosition(assetName, targetDate) {
  let quantity = 0;
  let position = 0;
  let lastQuotaValue = 0;
  
  // Processar todos os movimentos até a data alvo
  for (const mov of userMovements) {
    if (mov.assetName !== assetName) continue;
    if (new Date(mov.movementDate) > new Date(targetDate)) break;
    
    if (mov.movementType === 'Aplicação') {
      quantity += mov.quantity;
      position += mov.movementValue;
      if (mov.quotaValue > 0) {
        lastQuotaValue = mov.quotaValue;
      }
    } else if (mov.movementType === 'Juros') {
      // Juros aumentam a posição
      position += Math.abs(mov.movementValue);
      if (mov.quotaValue > 0) {
        lastQuotaValue = mov.quotaValue;
      }
    } else if (mov.movementType === 'IR') {
      // IR reduz a posição
      position += mov.movementValue; // movementValue já é negativo
    } else if (mov.movementType === 'Dividendos') {
      // Dividendos aumentam a posição
      position += Math.abs(mov.movementValue);
    } else if (mov.movementType === 'Vencimento') {
      // Vencimento pode ser resgate ou perda
      if (mov.movementValue < 0) {
        // Resgate parcial ou total
        const resgateRatio = Math.abs(mov.movementValue) / position;
        quantity = quantity * (1 - resgateRatio);
        position += mov.movementValue;
      } else {
        position += mov.movementValue;
      }
    }
    
    // Se temos quotaValue, usar para calcular posição baseada em quantidade
    if (mov.quotaValue > 0 && quantity > 0) {
      position = quantity * mov.quotaValue;
      lastQuotaValue = mov.quotaValue;
    }
  }
  
  // Se temos quantidade mas não temos quotaValue recente, usar a última conhecida
  if (quantity > 0 && lastQuotaValue > 0 && position === 0) {
    position = quantity * lastQuotaValue;
  }
  
  return { quantity, position };
}

// Remover posições antigas de investor-1
const existingPositions = positionsData.positions.filter(pos => pos.userId !== userId);
console.log(`\nRemovendo ${positionsData.positions.length - existingPositions.length} posições antigas de ${userId}`);

// Criar novas posições
const newPositions = [];
let positionId = Math.max(...positionsData.positions.map(pos => parseInt(pos.id.replace('pos-', '')) || 0), 0) + 1;

// Para cada ativo e cada data, calcular e criar posição
assetNames.forEach(assetName => {
  console.log(`\nProcessando ${assetName}...`);
  let processedCount = 0;
  
  dates.forEach(date => {
    const { quantity, position } = calculatePosition(assetName, date);
    
    newPositions.push({
      id: `pos-${positionId++}`,
      userId: userId,
      assetName: assetName,
      date: date,
      quantity: Math.round(quantity * 100) / 100,
      position: Math.round(position * 100) / 100
    });
    
    if (position > 0) processedCount++;
  });
  
  console.log(`  ${processedCount} posições com valor > 0 de ${dates.length} datas`);
});

console.log(`\nCriadas ${newPositions.length} novas posições (${assetNames.length} ativos × ${dates.length} datas)`);

// Adicionar novas posições
positionsData.positions = [...existingPositions, ...newPositions];

// Salvar arquivo atualizado
fs.writeFileSync(positionsPath, JSON.stringify(positionsData, null, 2));

console.log(`\nArquivo positions.json atualizado com sucesso!`);

