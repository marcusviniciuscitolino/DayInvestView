# Como substituir o favicon (logo da aba)

Para substituir o logo que aparece na aba do navegador:

## Opção 1: Substituir o favicon.ico diretamente
1. Substitua o arquivo `src/favicon.ico` pelo seu novo logo
2. O arquivo deve estar no formato .ico (16x16 ou 32x32 pixels recomendado)

## Opção 2: Usar PNG/SVG nos assets
1. Coloque sua imagem em `src/assets/images/` com um dos seguintes nomes:
   - `favicon-32x32.png` (32x32 pixels)
   - `favicon-16x16.png` (16x16 pixels)
   - `apple-touch-icon.png` (180x180 pixels para dispositivos Apple)
   - `favicon.svg` (formato vetorial, recomendado)

2. O `index.html` já está configurado para usar esses arquivos automaticamente

## Ferramentas úteis
- Para converter imagens para .ico: https://convertio.co/pt/png-ico/
- Para gerar favicons de múltiplos tamanhos: https://realfavicongenerator.net/

