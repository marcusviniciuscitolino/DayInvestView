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

# Listar abas disponíveis e encontrar a aba "Posição"
$worksheetName = $null
try {
    $excel = Open-ExcelPackage -Path $ExcelPath
    $worksheets = $excel.Workbook.Worksheets
    Write-Host "`nAbas disponíveis:" -ForegroundColor Cyan
    foreach ($ws in $worksheets) {
        Write-Host "  - $($ws.Name)" -ForegroundColor Gray
        # Procurar pela aba "Posição" (pode ter encoding diferente)
        if ($ws.Name -like "*Posi*" -or $ws.Name -like "*posi*") {
            $worksheetName = $ws.Name
        }
    }
    Close-ExcelPackage $excel
    
    if ([string]::IsNullOrWhiteSpace($worksheetName)) {
        Write-Host "`nAviso: Aba 'Posição' não encontrada. Tentando usar o nome exato..." -ForegroundColor Yellow
        $worksheetName = "Posição"
    } else {
        Write-Host "`nAba encontrada: $worksheetName" -ForegroundColor Green
    }
} catch {
    Write-Host "Aviso: Não foi possível listar abas: $_" -ForegroundColor Yellow
    $worksheetName = "Posição"
}

# Ler a aba
Write-Host "`nLendo aba: $worksheetName" -ForegroundColor Cyan
try {
    $data = Import-Excel -Path $ExcelPath -WorksheetName $worksheetName -ErrorAction Stop
    if ($null -eq $data -or $data.Count -eq 0) {
        throw "Nenhum dado encontrado"
    }
    Write-Host "Dados lidos com sucesso: $($data.Count) linhas" -ForegroundColor Green
} catch {
    Write-Host "Erro ao ler a aba '$worksheetName': $_" -ForegroundColor Red
    Write-Host "Tentando ler sem especificar nome da aba..." -ForegroundColor Yellow
    try {
        # Tentar ler todas as abas e encontrar a correta
        $allSheets = Get-ExcelSheetInfo -Path $ExcelPath
        foreach ($sheet in $allSheets) {
            if ($sheet.Name -like "*Posi*") {
                Write-Host "Tentando aba: $($sheet.Name)" -ForegroundColor Yellow
                $data = Import-Excel -Path $ExcelPath -WorksheetName $sheet.Name -ErrorAction Stop
                if ($data -and $data.Count -gt 0) {
                    $worksheetName = $sheet.Name
                    Write-Host "Sucesso! Aba: $worksheetName" -ForegroundColor Green
                    break
                }
            }
        }
    } catch {
        Write-Host "Erro: Não foi possível ler a aba 'Posição'. $_" -ForegroundColor Red
        exit 1
    }
}

if ($null -eq $data -or $data.Count -eq 0) {
    Write-Host "Erro: Nenhum dado encontrado na aba." -ForegroundColor Red
    exit 1
}

if ($data.Count -eq 0) {
    Write-Host "Nenhum dado encontrado na aba 'Posição'" -ForegroundColor Yellow
    exit 0
}

Write-Host "Encontradas $($data.Count) linhas de dados" -ForegroundColor Green

# Função para converter data DD/MM/YYYY para YYYY-MM-DD
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
        $date = [DateTime]::ParseExact($dateStr, "dd/MM/yyyy", [System.Globalization.CultureInfo]::InvariantCulture)
        return $date.ToString("yyyy-MM-dd")
    } catch {
        try {
            # Tenta parsear como DateTime do Excel
            $date = [DateTime]$dateObj
            return $date.ToString("yyyy-MM-dd")
        } catch {
            Write-Host "Aviso: Não foi possível converter a data: $dateObj" -ForegroundColor Yellow
            return $null
        }
    }
}

# Função para converter número brasileiro (vírgula como decimal) para número
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
        Write-Host "Aviso: Não foi possível converter o número: $numberStr" -ForegroundColor Yellow
        return 0
    }
}

# Identificar as colunas dos ativos
# A planilha tem grupos de 4 colunas para cada ativo: Data, Quantidade Movimento, Estoque Movimento, Posição
$assetColumns = @()

# Lista de ativos esperados
$expectedAssets = @(
    "NTN-B 05/15/35",
    "PETR25",
    "BOGARI VALUE ADV FC FIA",
    "CDB DAYCOVAL 110% CDI Vencto: 19/12/2025",
    "PETR4"
)

# Obter os nomes das colunas
$columnNames = $data[0].PSObject.Properties.Name

Write-Host "`nColunas encontradas ($($columnNames.Count)):" -ForegroundColor Cyan
foreach ($col in $columnNames) {
    Write-Host "  - $col" -ForegroundColor Gray
}

# Verificar a estrutura: pode ser que cada coluna seja um ativo e as linhas sejam datas
# Ou pode ter uma estrutura mais complexa com grupos de 4 colunas por ativo

# Primeiro, verificar se há uma coluna "Data" ou se a primeira linha tem datas
$firstRow = $data[0]
$hasDateColumn = $false
$dateColumnName = $null

foreach ($colName in $columnNames) {
    $value = $firstRow.$colName
    if ($null -ne $value) {
        $valueStr = $value.ToString()
        # Verificar se parece uma data
        if ($valueStr -match '\d{2}/\d{2}/\d{4}' -or $colName -like "*Data*") {
            $hasDateColumn = $true
            $dateColumnName = $colName
            Write-Host "`nColuna de data encontrada: $colName" -ForegroundColor Green
            break
        }
    }
}

# Se não encontrou coluna de data, assumir que a estrutura é diferente
# Baseado na imagem, parece que cada ativo tem suas próprias colunas: Data, Quantidade, Estoque, Posição
# Mas as colunas mostradas são apenas os nomes dos ativos

# Tentar identificar a estrutura real
# Vamos verificar se há múltiplas colunas com o mesmo padrão
$assetGroups = @()

# Se as colunas são apenas nomes de ativos, a estrutura pode ser:
# - Cada grupo de 4 colunas consecutivas representa um ativo
# - Ou a planilha tem uma estrutura diferente

# Vamos tentar uma abordagem diferente: verificar se há padrões nas primeiras linhas
Write-Host "`nAnalisando estrutura da planilha..." -ForegroundColor Cyan
Write-Host "Primeiras 3 linhas:" -ForegroundColor Gray
for ($i = 0; $i -lt [math]::Min(3, $data.Count); $i++) {
    $row = $data[$i]
    Write-Host "Linha $($i + 1):" -ForegroundColor Yellow
    foreach ($colName in $columnNames) {
        $val = $row.$colName
        if ($null -ne $val) {
            Write-Host "  $colName = $val" -ForegroundColor DarkGray
        }
    }
}

# Baseado na descrição da imagem, parece que a planilha tem grupos de 4 colunas por ativo
# Mas as colunas mostradas são apenas os nomes dos ativos
# Vamos assumir que o Import-Excel está lendo apenas os valores, não a estrutura completa

# Tentar ler usando uma abordagem diferente: ler todas as células
try {
    $excel = Open-ExcelPackage -Path $ExcelPath
    $worksheet = $excel.Workbook.Worksheets | Where-Object { $_.Name -like "*Posi*" } | Select-Object -First 1
    
    if ($null -ne $worksheet) {
        Write-Host "`nLendo estrutura completa da planilha..." -ForegroundColor Cyan
        
        # Procurar cabeçalhos de ativos (podem estar em linhas diferentes)
        # A estrutura parece ser: grupos de 4 colunas (Data, Quantidade Movimento, Estoque Movimento, Posição)
        
        # Vamos procurar na primeira linha por padrões
        $row1 = $worksheet.Cells[1, 1].Value
        Write-Host "Primeira célula: $row1" -ForegroundColor Gray
        
        # Tentar identificar onde começam os grupos de ativos
        # Baseado na imagem, cada ativo tem 4 colunas
        
        Close-ExcelPackage $excel
    }
} catch {
    Write-Host "Aviso: Não foi possível ler estrutura completa: $_" -ForegroundColor Yellow
}

# Por enquanto, vamos usar uma abordagem mais simples:
# Assumir que cada coluna de ativo contém os valores de posição
# E que precisamos encontrar as colunas de data e estoque em outro lugar
# Ou que a estrutura é: Data está em uma coluna separada, e cada ativo tem suas colunas

# Vamos criar grupos baseados nos nomes de ativos encontrados
foreach ($colName in $columnNames) {
    if ($colName -eq "Total") {
        continue
    }
    
    # Verificar se é um dos ativos esperados
    $isExpectedAsset = $false
    foreach ($expectedAsset in $expectedAssets) {
        if ($colName -like "*$expectedAsset*" -or $expectedAsset -like "*$colName*") {
            $assetGroups += @{
                AssetName = $expectedAsset
                PositionColumn = $colName
            }
            $isExpectedAsset = $true
            break
        }
    }
    
    if (-not $isExpectedAsset -and $colName -notlike "*Data*" -and $colName -notlike "*Total*") {
        # Pode ser um ativo não esperado
        $assetGroups += @{
            AssetName = $colName
            PositionColumn = $colName
        }
    }
}

Write-Host "`nGrupos de ativos identificados: $($assetGroups.Count)" -ForegroundColor Cyan
foreach ($group in $assetGroups) {
    Write-Host "  - $($group.AssetName): Posição=$($group.PositionColumn)" -ForegroundColor Gray
}

# Encontrar coluna de data
$dateColumn = $null
foreach ($colName in $columnNames) {
    if ($colName -like "*Data*" -or $colName -eq "Data") {
        $dateColumn = $colName
        break
    }
}

# Se não encontrou, verificar se a primeira coluna tem datas
if ([string]::IsNullOrWhiteSpace($dateColumn)) {
    $firstColName = $columnNames[0]
    $firstValue = $data[0].$firstColName
    if ($null -ne $firstValue) {
        $firstValueStr = $firstValue.ToString()
        if ($firstValueStr -match '\d{2}/\d{2}/\d{4}') {
            $dateColumn = $firstColName
            Write-Host "`nColuna de data identificada (primeira coluna): $dateColumn" -ForegroundColor Green
        }
    }
}

if ([string]::IsNullOrWhiteSpace($dateColumn)) {
    Write-Host "`nAviso: Coluna de data não encontrada. Tentando usar índice de linha como data..." -ForegroundColor Yellow
}

# Ler o arquivo JSON atual
$jsonPath = Join-Path $PSScriptRoot "..\$OutputPath"
$jsonPath = [System.IO.Path]::GetFullPath($jsonPath)

if (-not (Test-Path $jsonPath)) {
    Write-Host "Erro: Arquivo JSON não encontrado: $jsonPath" -ForegroundColor Red
    exit 1
}

$jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json
$existingPositions = $jsonContent.positions | Where-Object { $_.userId -ne $UserId }

Write-Host "`nRemovendo posições antigas de $UserId" -ForegroundColor Yellow
$oldCount = ($jsonContent.positions | Where-Object { $_.userId -eq $UserId }).Count
Write-Host "  Posições antigas removidas: $oldCount" -ForegroundColor Gray

# Processar dados e criar novas posições
$newPositions = @()
$positionId = 1

# Encontrar o maior ID existente
foreach ($pos in $jsonContent.positions) {
    $idNum = 0
    if ($pos.id -match 'pos-(\d+)') {
        $idNum = [int]$matches[1]
    }
    if ($idNum -ge $positionId) {
        $positionId = $idNum + 1
    }
}

Write-Host "`nProcessando dados da planilha..." -ForegroundColor Green

foreach ($group in $assetGroups) {
    if ([string]::IsNullOrWhiteSpace($group.AssetName)) {
        continue
    }
    
    Write-Host "`nProcessando $($group.AssetName)..." -ForegroundColor Cyan
    
    $assetPositions = 0
    $rowIndex = 0
    
    foreach ($row in $data) {
        $rowIndex++
        
        # Ler data
        $date = $null
        if (-not [string]::IsNullOrWhiteSpace($dateColumn)) {
            $date = Convert-Date $row.$dateColumn
        }
        
        # Se não encontrou data na coluna, tentar inferir da primeira coluna ou usar índice
        if ([string]::IsNullOrWhiteSpace($date)) {
            $firstColName = $columnNames[0]
            $date = Convert-Date $row.$firstColName
        }
        
        if ([string]::IsNullOrWhiteSpace($date)) {
            # Pular linha se não tem data
            continue
        }
        
        # Ler posição
        $position = 0
        if (-not [string]::IsNullOrWhiteSpace($group.PositionColumn)) {
            $position = Convert-Number $row.($group.PositionColumn)
        }
        
        # Tentar ler quantidade/estoque se houver coluna correspondente
        $quantity = 0
        # Procurar coluna de estoque para este ativo (pode ter nome similar)
        foreach ($colName in $columnNames) {
            if ($colName -like "*Estoque*" -and $colName -like "*$($group.AssetName)*") {
                $quantity = Convert-Number $row.$colName
                break
            }
        }
        
        # Se não encontrou quantidade específica, usar 0 ou tentar calcular
        # Por enquanto, vamos usar 0 se não encontrar
        
        # Adicionar posição se houver valor
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
            $assetPositions++
        }
    }
    
    Write-Host "  $assetPositions posições criadas" -ForegroundColor Gray
}

Write-Host "`nTotal de novas posições: $($newPositions.Count)" -ForegroundColor Green

# Atualizar JSON
$jsonContent.positions = @($existingPositions) + $newPositions

# Salvar arquivo
$jsonContent | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

Write-Host "`nArquivo atualizado com sucesso: $jsonPath" -ForegroundColor Green
Write-Host "Total de posições no arquivo: $($jsonContent.positions.Count)" -ForegroundColor Cyan

