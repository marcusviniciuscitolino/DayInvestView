# Guia para Publicar no GitHub

## Passos para fazer push da aplicação

### 1. Verificar se o Git está instalado
Abra um terminal e execute:
```bash
git --version
```

Se não estiver instalado, baixe em: https://git-scm.com/download/win

### 2. Inicializar o repositório (se ainda não foi feito)
```bash
cd C:\DayInvestView
git init
```

### 3. Adicionar o remote do GitHub
```bash
git remote add origin https://github.com/marcusviniciuscitolino/DayInvestView.git
```

Ou se já existir um remote, atualize com:
```bash
git remote set-url origin https://github.com/marcusviniciuscitolino/DayInvestView.git
```

### 4. Adicionar todos os arquivos
```bash
git add .
```

### 5. Fazer o commit inicial
```bash
git commit -m "Initial commit: DayInvestView Angular app"
```

### 6. Configurar a branch principal (se necessário)
```bash
git branch -M main
```

### 7. Fazer o push para o GitHub
```bash
git push -u origin main
```

Se receber erro de autenticação, você pode:
- Usar token de acesso pessoal do GitHub
- Ou configurar SSH

## Alternativa: Usar GitHub Desktop ou VS Code

Você também pode usar:
- **GitHub Desktop**: Interface gráfica mais fácil
- **VS Code**: Tem integração Git built-in (Ctrl+Shift+G)

