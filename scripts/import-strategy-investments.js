const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = path.join(__dirname, '..', '..', 'Dados_Gráfico Estratégia.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

// Ler o arquivo de investimentos atual
const investmentsPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'investments.json');
const investmentsData = JSON.parse(fs.readFileSync(investmentsPath, 'utf8'));

// Processar CSV
const lines = csv.split('\n').filter(l => l.trim());
const assets = [];
const percentages = {};

let currentSection = '';
let dateReference = '';

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
  
  // Extrair data de referência
  if (parts[0] === 'Data Referência' && parts[1]) {
    const dateStr = parts[1].replace(/"/g, '');
    const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      dateReference = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }
  
  // Processar ativos e classes
  if (parts[0] === 'Ativo' && parts[1] === 'Classe') {
    currentSection = 'assets';
    return;
  }
  
  if (currentSection === 'assets' && parts[0] && parts[1] && parts[0] !== 'Total' && parts[0] !== 'Gráficos' && parts[0] !== 'Classe') {
    const assetName = parts[0].replace(/"/g, '');
    const classe = parts[1].replace(/"/g, '');
    if (assetName && classe && classe !== '-' && assetName !== 'Classe') {
      assets.push({ name: assetName, classe: classe });
    }
  }
  
  // Processar percentuais
  if (parts[0] === 'Classe' && parts[1] === 'Percentual') {
    currentSection = 'percentages';
    return;
  }
  
  if (currentSection === 'percentages' && parts[0] && parts[1]) {
    const classe = parts[0].replace(/"/g, '');
    const percent = parseFloat(parts[1].replace(/"/g, '').replace(',', '.'));
    if (classe && !isNaN(percent)) {
      percentages[classe] = percent;
    }
  }
});

console.log('Data de Referência:', dateReference);
console.log('Ativos encontrados:', assets);
console.log('Percentuais:', percentages);

// Remover investimentos antigos de investor-1
const existingInvestments = investmentsData.investments.filter(inv => inv.userId !== 'investor-1');
console.log(`Removendo ${investmentsData.investments.length - existingInvestments.length} investimentos antigos de investor-1`);

// Calcular valores totais baseados nos percentuais
// Vamos assumir um valor total de portfólio (pode ser ajustado)
const totalPortfolioValue = 150000; // Valor total aproximado baseado nos investimentos anteriores

// Criar novos investimentos
const newInvestments = [];
let investmentId = Math.max(...investmentsData.investments.map(inv => parseInt(inv.id.replace('inv-', '')) || 0)) + 1;

assets.forEach(asset => {
  const classe = asset.classe;
  const percent = percentages[classe] || 0;
  
  // Mapear classe para tipo de investimento
  let type = '';
  if (classe === 'Renda Fixa') {
    type = 'Tesouro';
  } else if (classe === 'Fundos de Investimento') {
    type = 'Fundos';
  } else if (classe === 'Renda Variável') {
    type = 'Ações';
  }
  
  // Calcular valor baseado no percentual
  // Distribuir o valor proporcionalmente entre os ativos da mesma classe
  const assetsInClass = assets.filter(a => a.classe === classe);
  const valuePerAsset = (totalPortfolioValue * percent) / assetsInClass.length;
  
  // Calcular retorno aproximado (5% para renda fixa, 10% para fundos, 15% para variável)
  let returnPercent = 0.05;
  if (classe === 'Fundos de Investimento') {
    returnPercent = 0.10;
  } else if (classe === 'Renda Variável') {
    returnPercent = 0.15;
  }
  
  const returnValue = valuePerAsset * returnPercent;
  
  newInvestments.push({
    id: `inv-${investmentId++}`,
    userId: 'investor-1',
    type: type,
    name: asset.name,
    value: Math.round(valuePerAsset * 100) / 100,
    return: Math.round(returnValue * 100) / 100,
    date: dateReference || '2024-08-14'
  });
});

// Adicionar novos investimentos
investmentsData.investments = [...existingInvestments, ...newInvestments];

// Salvar arquivo atualizado
fs.writeFileSync(investmentsPath, JSON.stringify(investmentsData, null, 2));

console.log(`\nAdicionados ${newInvestments.length} novos investimentos para investor-1:`);
newInvestments.forEach(inv => {
  console.log(`  - ${inv.name} (${inv.type}): R$ ${inv.value.toFixed(2)}`);
});

