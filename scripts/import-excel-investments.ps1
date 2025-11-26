# Script para importar dados de investimentos do Excel para JSON
# Requer: ImportExcel module (Install-Module ImportExcel)

param(
    [Parameter(Mandatory=$false)]
    [string]$ExcelPath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "src\assets\data\investments.json",
    
    [Parameter(Mandatory=$false)]
    [string]$UserId = "investor-1",
    
    [Parameter(Mandatory=$false)]
    [string]$DownloadsPath = "$env:USERPROFILE\Downloads"
)

# Verifica se o módulo ImportExcel está instalado
if (-not (Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "Instalando módulo ImportExcel..." -ForegroundColor Yellow
    Install-Module -Name ImportExcel -Scope CurrentUser -Force
}

Import-Module ImportExcel

# Se o caminho do Excel não foi fornecido, procura na pasta Downloads
if ([string]::IsNullOrWhiteSpace($ExcelPath)) {
    Write-Host "Procurando arquivos Excel..." -ForegroundColor Yellow
    
    # Lista de pastas para procurar
    $searchPaths = @(
        $DownloadsPath,
        "C:\Projetos\Downloads",
        "C:\Projetos"
    )
    
    $excelFiles = @()
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            $files = Get-ChildItem -Path $path -Filter "*.xlsx" -ErrorAction SilentlyContinue | 
                     Where-Object { $_.Name -notlike "*~$*" }
            if ($files) {
                Write-Host "  Encontrados arquivos em: $path" -ForegroundColor Cyan
                $excelFiles += $files
            }
        }
    }
    
    $excelFiles = $excelFiles | Sort-Object LastWriteTime -Descending
    
    if ($excelFiles.Count -eq 0) {
        Write-Host "Erro: Nenhum arquivo Excel encontrado na pasta Downloads" -ForegroundColor Red
        Write-Host "Por favor, forneça o caminho do arquivo usando: -ExcelPath 'C:\caminho\arquivo.xlsx'" -ForegroundColor Yellow
        exit 1
    }
    
    if ($excelFiles.Count -eq 1) {
        $ExcelPath = $excelFiles[0].FullName
        Write-Host "Arquivo encontrado: $ExcelPath" -ForegroundColor Green
    } else {
        Write-Host "Múltiplos arquivos Excel encontrados:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $excelFiles.Count; $i++) {
            Write-Host "  [$i] $($excelFiles[$i].Name) (Modificado: $($excelFiles[$i].LastWriteTime))" -ForegroundColor Cyan
        }
        $selection = Read-Host "Digite o número do arquivo que deseja importar (0-$($excelFiles.Count - 1))"
        try {
            $index = [int]$selection
            if ($index -ge 0 -and $index -lt $excelFiles.Count) {
                $ExcelPath = $excelFiles[$index].FullName
                Write-Host "Arquivo selecionado: $ExcelPath" -ForegroundColor Green
            } else {
                Write-Host "Erro: Número inválido" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "Erro: Entrada inválida" -ForegroundColor Red
            exit 1
        }
    }
}

# Verifica se o arquivo Excel existe
if (-not (Test-Path $ExcelPath)) {
    Write-Host "Erro: Arquivo Excel não encontrado: $ExcelPath" -ForegroundColor Red
    exit 1
}

Write-Host "Lendo planilha Excel: $ExcelPath" -ForegroundColor Green
Write-Host "Vinculando dados ao usuário ID: $UserId (maria.santos@email.com)" -ForegroundColor Cyan

# Lê a aba "Movimentações"
try {
    $data = Import-Excel -Path $ExcelPath -WorksheetName "Movimentações" -ErrorAction Stop
} catch {
    Write-Host "Erro ao ler a aba 'Movimentações': $_" -ForegroundColor Red
    exit 1
}

if ($data.Count -eq 0) {
    Write-Host "Nenhum dado encontrado na aba 'Movimentações'" -ForegroundColor Yellow
    exit 0
}

Write-Host "Encontrados $($data.Count) registros" -ForegroundColor Green

# Função para converter data DD/MM/YYYY para YYYY-MM-DD
function Convert-Date {
    param([string]$dateStr)
    
    if ([string]::IsNullOrWhiteSpace($dateStr)) {
        return $null
    }
    
    try {
        # Tenta parsear a data no formato brasileiro
        $date = [DateTime]::ParseExact($dateStr, "dd/MM/yyyy", [System.Globalization.CultureInfo]::InvariantCulture)
        return $date.ToString("yyyy-MM-dd")
    } catch {
        try {
            # Tenta parsear como DateTime do Excel
            $date = [DateTime]$dateStr
            return $date.ToString("yyyy-MM-dd")
        } catch {
            Write-Host "Aviso: Não foi possível converter a data: $dateStr" -ForegroundColor Yellow
            return $null
        }
    }
}

# Função para converter número brasileiro (vírgula como decimal) para número
function Convert-Number {
    param([string]$numberStr)
    
    if ([string]::IsNullOrWhiteSpace($numberStr)) {
        return 0
    }
    
    # Remove pontos (separador de milhares) e substitui vírgula por ponto
    $cleaned = $numberStr -replace '\.', '' -replace ',', '.'
    
    try {
        return [double]$cleaned
    } catch {
        Write-Host "Aviso: Não foi possível converter o número: $numberStr" -ForegroundColor Yellow
        return 0
    }
}

# Função para determinar o tipo de investimento baseado no nome do ativo
function Get-InvestmentType {
    param([string]$assetName)
    
    if ([string]::IsNullOrWhiteSpace($assetName)) {
        return "Outros"
    }
    
    $assetUpper = $assetName.ToUpper()
    
    # NTN-B é um título do Tesouro
    if ($assetUpper -like "*NTN-B*" -or $assetUpper -like "*NTNB*") {
        return "Tesouro"
    }
    
    # PETR é uma ação (PETR25, PETR4, etc.)
    if ($assetUpper -like "PETR*" -or $assetUpper -like "*AÇÃO*" -or $assetUpper -like "*ACAO*") {
        return "Ações"
    }
    
    # Outros títulos do tesouro
    if ($assetUpper -like "*TESOURO*" -or $assetUpper -like "*SELIC*" -or $assetUpper -like "*IPCA*") {
        return "Tesouro"
    }
    
    # Fundos
    if ($assetUpper -like "*FUNDO*") {
        return "Fundos"
    }
    
    # Por padrão, assume Ações
    return "Ações"
}

# Agrupa movimentos por ativo e calcula valores totais
$groupedData = @{}
$investmentId = 1

# Lê o arquivo JSON existente para obter o próximo ID
$existingInvestments = @()
$nextId = 1

if (Test-Path $OutputPath) {
    try {
        $existingJson = Get-Content $OutputPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $existingInvestments = $existingJson.investments
        
        # Encontra o maior ID existente
        $maxId = 0
        foreach ($inv in $existingInvestments) {
            if ($inv.id -match 'inv-(\d+)') {
                $idNum = [int]$matches[1]
                if ($idNum -gt $maxId) {
                    $maxId = $idNum
                }
            }
        }
        $nextId = $maxId + 1
        Write-Host "Arquivo JSON existente encontrado. Próximo ID será: inv-$nextId" -ForegroundColor Green
    } catch {
        Write-Host "Aviso: Não foi possível ler o arquivo JSON existente. Criando novo arquivo." -ForegroundColor Yellow
    }
}

# Processa cada linha da planilha
foreach ($row in $data) {
    $assetName = $row.'Ativo'
    $movementType = $row.'Tipo de Movimento'
    $movementValue = Convert-Number $row.'Valor Movimento'
    $movementDate = Convert-Date $row.'Data do Movimento'
    
    if ([string]::IsNullOrWhiteSpace($assetName)) {
        continue
    }
    
    # Cria chave única para o ativo
    $key = $assetName.Trim()
    
    if (-not $groupedData.ContainsKey($key)) {
        $groupedData[$key] = @{
            name = $key
            type = Get-InvestmentType $key
            totalValue = 0
            totalReturn = 0
            lastDate = $null
            movements = @()
        }
    }
    
    $asset = $groupedData[$key]
    $asset.movements += @{
        type = $movementType
        value = $movementValue
        date = $movementDate
    }
    
    # Processa diferentes tipos de movimento
    $movementTypeUpper = $movementType.ToUpper()
    
    # Aplicação: soma ao valor do investimento (sempre positivo)
    if ($movementTypeUpper -like "*APLICAÇÃO*" -or $movementTypeUpper -like "*APLICACAO*" -or $movementTypeUpper -like "*APLICA*") {
        if ($movementValue -gt 0) {
            $asset.totalValue += $movementValue
        }
    }
    
    # Juros: adiciona ao retorno (pode ser positivo ou negativo)
    if ($movementTypeUpper -like "*JUROS*" -or $movementTypeUpper -like "*JURO*") {
        $asset.totalReturn += $movementValue
    }
    
    # IR (Imposto de Renda): reduz o retorno (geralmente negativo)
    if ($movementTypeUpper -eq "IR" -or $movementTypeUpper -like "*IMPOSTO*") {
        $asset.totalReturn += $movementValue  # movimento já é negativo, então soma reduz
    }
    
    # Vencimento: pode ser resgate (positivo) ou perda (negativo)
    # Para vencimento, consideramos como parte do valor se positivo
    if ($movementTypeUpper -like "*VENCIMENTO*" -or $movementTypeUpper -like "*VENC*") {
        if ($movementValue -gt 0) {
            $asset.totalValue += $movementValue
        } else {
            # Se negativo, reduz o valor do investimento
            $asset.totalValue += $movementValue
        }
    }
    
    # Atualiza a data mais recente
    if ($movementDate -and (-not $asset.lastDate -or $movementDate -gt $asset.lastDate)) {
        $asset.lastDate = $movementDate
    }
}

# Verifica se já existem investimentos para este usuário e ativo
$existingForUser = $existingInvestments | Where-Object { $_.userId -eq $UserId }

# Converte dados agrupados para o formato JSON
$newInvestments = @()

foreach ($asset in $groupedData.Values) {
    # Verifica se já existe investimento para este ativo e usuário
    $existingInvestment = $existingForUser | Where-Object { 
        $_.name -eq $asset.name -and $_.userId -eq $UserId 
    }
    
    if ($existingInvestment) {
        Write-Host "Aviso: Investimento '$($asset.name)' já existe para o usuário. Será atualizado." -ForegroundColor Yellow
        # Remove o investimento existente para substituir pelo novo
        $existingInvestments = $existingInvestments | Where-Object { 
            -not ($_.name -eq $asset.name -and $_.userId -eq $UserId)
        }
    }
    
    # Se não há data, usa a data atual
    $investmentDate = $asset.lastDate
    if (-not $investmentDate) {
        $investmentDate = (Get-Date).ToString("yyyy-MM-dd")
    }
    
    # Garante que há pelo menos algum valor
    if ($asset.totalValue -le 0) {
        Write-Host "Aviso: Ativo '$($asset.name)' tem valor zero ou negativo. Usando valor mínimo de 1." -ForegroundColor Yellow
        $asset.totalValue = 1
    }
    
    $investment = @{
        id = "inv-$nextId"
        userId = $UserId
        type = $asset.type
        name = $asset.name
        value = [Math]::Round($asset.totalValue, 2)
        return = [Math]::Round($asset.totalReturn, 2)
        date = $investmentDate
    }
    
    Write-Host "  Criando investimento: $($asset.name) - Valor: R$ $($investment.value) - Retorno: R$ $($investment.return)" -ForegroundColor Cyan
    
    $newInvestments += $investment
    $nextId++
}

Write-Host "`nCriados $($newInvestments.Count) novos investimentos para o usuário: $UserId" -ForegroundColor Green

# Combina com investimentos existentes (já removemos duplicatas acima)
$allInvestments = $existingInvestments + $newInvestments

# Cria o objeto JSON final
$jsonOutput = @{
    investments = $allInvestments
} | ConvertTo-Json -Depth 10

# Salva o arquivo JSON
try {
    $jsonOutput | Out-File -FilePath $OutputPath -Encoding UTF8 -Force
    Write-Host "Arquivo JSON salvo com sucesso: $OutputPath" -ForegroundColor Green
    Write-Host "Total de investimentos no arquivo: $($allInvestments.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao salvar arquivo JSON: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nImportação concluída com sucesso!" -ForegroundColor Green

