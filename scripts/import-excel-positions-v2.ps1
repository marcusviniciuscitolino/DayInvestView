# Script para importar dados de posição do Excel para JSON
# Requer: ImportExcel module (Install-Module ImportExcel)

param(
    [Parameter(Mandatory=$false)]
    [string]$ExcelPath = "C:\Projetos\Dados.xlsx",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "src\assets\data\positions.json",
    
    [Parameter(Mandatory=$false)]
    [string]$UserId = "investor-1"
)

# Verifica se o módulo ImportExcel está instalado
if (-not (Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "Instalando módulo ImportExcel..." -ForegroundColor Yellow
    Install-Module -Name ImportExcel -Scope CurrentUser -Force
}

Import-Module ImportExcel

# Verifica se o arquivo Excel existe
if (-not (Test-Path $ExcelPath)) {
    Write-Host "Erro: Arquivo Excel não encontrado: $ExcelPath" -ForegroundColor Red
    exit 1
}

Write-Host "Lendo planilha Excel: $ExcelPath" -ForegroundColor Green
Write-Host "Vinculando dados ao usuário ID: $UserId (maria.santos@email.com)" -ForegroundColor Cyan

# Função para converter data
function Convert-Date {
    param([object]$dateObj)
    
    if ($null -eq $dateObj) {
        return $null
    }
    
    try {
        if ($dateObj -is [DateTime]) {
            return $dateObj.ToString("yyyy-MM-dd")
        }
        
        $dateStr = $dateObj.ToString()
        if ([string]::IsNullOrWhiteSpace($dateStr)) {
            return $null
        }
        
        # Tenta parsear a data no formato brasileiro
        if ($dateStr -match '(\d{2})/(\d{2})/(\d{4})') {
            $day = [int]$matches[1]
            $month = [int]$matches[2]
            $year = [int]$matches[3]
            $date = New-Object DateTime $year, $month, $day
            return $date.ToString("yyyy-MM-dd")
        }
        
        # Tenta parsear como DateTime do Excel
        $date = [DateTime]$dateObj
        return $date.ToString("yyyy-MM-dd")
    } catch {
        return $null
    }
}

# Função para converter número
function Convert-Number {
    param([object]$numberObj)
    
    if ($null -eq $numberObj) {
        return 0
    }
    
    $numberStr = $numberObj.ToString()
    if ([string]::IsNullOrWhiteSpace($numberStr) -or $numberStr -eq "0,00" -or $numberStr -eq "0") {
        return 0
    }
    
    # Remove pontos (separador de milhares) e substitui vírgula por ponto
    $cleaned = $numberStr -replace '\.', '' -replace ',', '.'
    
    try {
        return [double]$cleaned
    } catch {
        return 0
    }
}

# Abrir planilha Excel
$excel = Open-ExcelPackage -Path $ExcelPath
$worksheet = $excel.Workbook.Worksheets | Where-Object { $_.Name -like "*Posi*" } | Select-Object -First 1

if ($null -eq $worksheet) {
    Write-Host "Erro: Aba 'Posição' não encontrada" -ForegroundColor Red
    Close-ExcelPackage $excel
    exit 1
}

Write-Host "Aba encontrada: $($worksheet.Name)" -ForegroundColor Green

# Ler dados da planilha
# Baseado na imagem, a estrutura parece ser:
# - Grupos de 4 colunas por ativo: Data, Quantidade Movimento, Estoque Movimento, Posição
# - Ativos: NTN-B 05/15/35, PETR25, BOGARI VALUE ADV FC FIA, CDB DAYCOVAL, PETR4

$newPositions = @()
$positionId = 1

# Encontrar o maior ID existente no JSON
$jsonPath = Join-Path $PSScriptRoot "..\$OutputPath"
$jsonPath = [System.IO.Path]::GetFullPath($jsonPath)

if (Test-Path $jsonPath) {
    $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json
    $existingPositions = $jsonContent.positions | Where-Object { $_.userId -ne $UserId }
    
    foreach ($pos in $jsonContent.positions) {
        $idNum = 0
        if ($pos.id -match 'pos-(\d+)') {
            $idNum = [int]$matches[1]
        }
        if ($idNum -ge $positionId) {
            $positionId = $idNum + 1
        }
    }
} else {
    $existingPositions = @()
    $jsonContent = @{ positions = @() } | ConvertTo-Json | ConvertFrom-Json
}

Write-Host "`nAnalisando estrutura da planilha..." -ForegroundColor Cyan

# Procurar cabeçalhos de ativos
# Cada ativo tem 4 colunas: Data, Quantidade Movimento, Estoque Movimento, Posição
$assetGroups = @()
$maxCol = $worksheet.Dimension.End.Column
$maxRow = $worksheet.Dimension.End.Row

Write-Host "Dimensões: $maxRow linhas x $maxCol colunas" -ForegroundColor Gray

# Lista de ativos esperados
$expectedAssets = @(
    "NTN-B 05/15/35",
    "PETR25",
    "BOGARI VALUE ADV FC FIA",
    "CDB DAYCOVAL 110% CDI Vencto: 19/12/2025",
    "PETR4"
)

# Procurar cabeçalhos nas primeiras linhas
for ($row = 1; $row -le [math]::Min(5, $maxRow); $row++) {
    for ($col = 1; $col -le $maxCol; $col++) {
        $cellValue = $worksheet.Cells[$row, $col].Value
        if ($null -ne $cellValue) {
            $cellStr = $cellValue.ToString().Trim()
            
            # Verificar se é um nome de ativo
            foreach ($assetName in $expectedAssets) {
                if ($cellStr -like "*$assetName*" -or $assetName -like "*$cellStr*") {
                    # Encontrar as 4 colunas deste ativo
                    # Assumir que: col = Data, col+1 = Quantidade, col+2 = Estoque, col+3 = Posição
                    if ($col + 3 -le $maxCol) {
                        $dataCol = $col
                        $quantityCol = $col + 1
                        $stockCol = $col + 2
                        $positionCol = $col + 3
                        
                        # Verificar se já não adicionamos este ativo
                        $exists = $false
                        foreach ($existing in $assetGroups) {
                            if ($existing.AssetName -eq $assetName) {
                                $exists = $true
                                break
                            }
                        }
                        
                        if (-not $exists) {
                            $assetGroups += @{
                                AssetName = $assetName
                                DataCol = $dataCol
                                QuantityCol = $quantityCol
                                StockCol = $stockCol
                                PositionCol = $positionCol
                                StartRow = $row + 1
                            }
                            Write-Host "Ativo encontrado: $assetName (colunas $dataCol-$positionCol, linha $row)" -ForegroundColor Green
                        }
                    }
                }
            }
        }
    }
}

if ($assetGroups.Count -eq 0) {
    Write-Host "`nAviso: Nenhum ativo encontrado nos cabeçalhos. Tentando abordagem alternativa..." -ForegroundColor Yellow
    
    # Tentar ler usando Import-Excel (estrutura mais simples)
    Close-ExcelPackage $excel
    $data = Import-Excel -Path $ExcelPath -WorksheetName $worksheet.Name
    
    $columnNames = $data[0].PSObject.Properties.Name
    Write-Host "Colunas encontradas: $($columnNames -join ', ')" -ForegroundColor Cyan
    
    # Assumir que cada coluna (exceto Total) é um ativo com valores de posição
    # E que há uma coluna de data em algum lugar
    $dateColumn = $null
    foreach ($colName in $columnNames) {
        if ($colName -like "*Data*") {
            $dateColumn = $colName
            break
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($dateColumn) -and $columnNames.Count -gt 0) {
        # Tentar usar a primeira coluna como data
        $dateColumn = $columnNames[0]
    }
    
    foreach ($colName in $columnNames) {
        if ($colName -eq "Total" -or $colName -like "*Data*") {
            continue
        }
        
        Write-Host "`nProcessando $colName..." -ForegroundColor Cyan
        $count = 0
        
        foreach ($row in $data) {
            $date = Convert-Date $row.$dateColumn
            if ([string]::IsNullOrWhiteSpace($date)) {
                continue
            }
            
            $position = Convert-Number $row.$colName
            if ($position -gt 0) {
                $newPositions += @{
                    id = "pos-$positionId"
                    userId = $UserId
                    assetName = $colName
                    date = $date
                    quantity = 0
                    position = [math]::Round($position, 2)
                }
                $positionId++
                $count++
            }
        }
        
        Write-Host "  $count posições criadas" -ForegroundColor Gray
    }
} else {
    # Processar usando grupos encontrados
    Write-Host "`nProcessando $($assetGroups.Count) ativos..." -ForegroundColor Green
    
    foreach ($group in $assetGroups) {
        Write-Host "`nProcessando $($group.AssetName)..." -ForegroundColor Cyan
        $count = 0
        
        # Ler dados a partir da linha de início
        for ($row = $group.StartRow; $row -le $maxRow; $row++) {
            $dateValue = $worksheet.Cells[$row, $group.DataCol].Value
            $date = Convert-Date $dateValue
            
            if ([string]::IsNullOrWhiteSpace($date)) {
                continue
            }
            
            $quantityValue = $worksheet.Cells[$row, $group.StockCol].Value
            $quantity = Convert-Number $quantityValue
            
            $positionValue = $worksheet.Cells[$row, $group.PositionCol].Value
            $position = Convert-Number $positionValue
            
            if ($position -gt 0) {
                $newPositions += @{
                    id = "pos-$positionId"
                    userId = $UserId
                    assetName = $group.AssetName
                    date = $date
                    quantity = [math]::Round($quantity, 2)
                    position = [math]::Round($position, 2)
                }
                $positionId++
                $count++
            }
        }
        
        Write-Host "  $count posições criadas" -ForegroundColor Gray
    }
    
    Close-ExcelPackage $excel
}

Write-Host "`nTotal de novas posições: $($newPositions.Count)" -ForegroundColor Green

# Atualizar JSON
$jsonContent.positions = @($existingPositions) + $newPositions

# Salvar arquivo
$jsonContent | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

Write-Host "`nArquivo atualizado com sucesso: $jsonPath" -ForegroundColor Green
Write-Host "Total de posições no arquivo: $($jsonContent.positions.Count)" -ForegroundColor Cyan

