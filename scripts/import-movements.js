const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = path.join(__dirname, '..', '..', 'Dados_Movimentações.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

// Ler o arquivo de movimentos atual
const movementsPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'movements.json');
const movementsData = JSON.parse(fs.readFileSync(movementsPath, 'utf8'));

// Processar CSV
const lines = csv.split('\n').filter(l => l.trim());
const movements = [];

lines.slice(1).forEach((line, idx) => {
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
  
  if (parts.length < 7) return;
  
  const assetName = parts[0].replace(/"/g, '');
  const movementTypeRaw = parts[1].replace(/"/g, '');
  const dateStr = parts[2].replace(/"/g, '');
  const movementValueStr = parts[4].replace(/"/g, '').replace(',', '.');
  const quotaValueStr = parts[5].replace(/"/g, '').replace(',', '.');
  const quantityStr = parts[6].replace(/"/g, '').replace(',', '.');
  
  if (!assetName || !movementTypeRaw || !dateStr) return;
  
  // Mapear tipo de movimento
  let movementType = '';
  if (movementTypeRaw === 'Aplicação') {
    movementType = 'Aplicação';
  } else if (movementTypeRaw === 'Juros') {
    movementType = 'Juros';
  } else if (movementTypeRaw === 'IR' || movementTypeRaw === 'IR - Imposto de Renda') {
    movementType = 'IR';
  } else if (movementTypeRaw === 'Vencimento') {
    movementType = 'Vencimento';
  } else if (movementTypeRaw === 'Dividendos') {
    movementType = 'Dividendos';
  } else {
    // Ignorar Rendimentos, etc.
    return;
  }
  
  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) return;
  
  const dateObj = new Date(
    parseInt(dateMatch[3]),
    parseInt(dateMatch[2]) - 1,
    parseInt(dateMatch[1])
  );
  
  const formattedDate = dateObj.toISOString().split('T')[0];
  
  // Converter valores
  const movementValue = parseFloat(movementValueStr) || 0;
  let quotaValue = 0;
  if (quotaValueStr && quotaValueStr !== 'NULL' && quotaValueStr !== '0') {
    quotaValue = parseFloat(quotaValueStr) || 0;
  } else if ((movementType === 'Juros' || movementType === 'IR' || movementType === 'Dividendos') && movementValue !== 0) {
    // Para juros, IR e dividendos, se quotaValue for 0 ou NULL, usar o valor absoluto do movementValue
    // Isso é necessário para PETR4 que tem juros/IR/dividendos mas quotaValue = 0
    // E para NTN-B que tem IR mas quotaValue = NULL
    quotaValue = Math.abs(movementValue);
  }
  const quantity = parseFloat(quantityStr) || 0;
  
  // Apenas movimentos de investor-1 (filtrar CDB que não é de investor-1)
  // Vamos incluir todos os ativos que aparecem nos investimentos de investor-1
  const validAssets = ['NTN-B 05/15/35', 'PETR25', 'PETR4', 'BOGARI VALUE ADV FC FIA'];
  if (!validAssets.includes(assetName)) {
    return;
  }
  
  movements.push({
    assetName: assetName,
    movementType: movementType,
    date: formattedDate,
    movementValue: movementValue,
    quotaValue: quotaValue,
    quantity: quantity
  });
});

console.log(`Processados ${movements.length} movimentos do CSV`);

// Remover movimentos antigos de investor-1
const existingMovements = movementsData.movements.filter(mov => mov.userId !== 'investor-1');
console.log(`Removendo ${movementsData.movements.length - existingMovements.length} movimentos antigos de investor-1`);

// Criar novos movimentos
const newMovements = [];
let movementId = Math.max(...movementsData.movements.map(mov => parseInt(mov.id.replace('mov-', '')) || 0)) + 1;

movements.forEach(mov => {
  newMovements.push({
    id: `mov-${movementId++}`,
    userId: 'investor-1',
    assetName: mov.assetName,
    movementType: mov.movementType,
    movementDate: mov.date,
    movementValue: Math.round(mov.movementValue * 100) / 100,
    quotaValue: Math.round(mov.quotaValue * 100) / 100,
    quantity: Math.round(mov.quantity * 100) / 100
  });
});

// Adicionar novos movimentos
movementsData.movements = [...existingMovements, ...newMovements];

// Salvar arquivo atualizado
fs.writeFileSync(movementsPath, JSON.stringify(movementsData, null, 2));

console.log(`\nAdicionados ${newMovements.length} novos movimentos para investor-1:`);
const byType = {};
newMovements.forEach(mov => {
  if (!byType[mov.movementType]) {
    byType[mov.movementType] = 0;
  }
  byType[mov.movementType]++;
});
Object.keys(byType).forEach(type => {
  console.log(`  - ${type}: ${byType[type]} movimentos`);
});

