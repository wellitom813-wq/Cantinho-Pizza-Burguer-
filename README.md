# Cantinho Pizza Burguer — versão limpa

Esta versão NÃO possui painel /admin.

Arquivos:
- index.html
- style.css
- script.js
- config.js

## Antes de publicar
Abra `script.js` e troque:
`COLOQUE_SEU_NUMERO_AQUI`
pelo número do WhatsApp no formato 55 + DDD + número.

Exemplo de estrutura:
5587999999999

## Recursos mantidos
- Loja pública
- Horário automático: terça, quarta, sexta, sábado e domingo, 18h–22h
- Botões travados quando a loja está fechada
- Estoque global lido do Supabase
- Produto esgotado continua visível e fica bloqueado
- Taxas: N1 R$4, N3 R$3, N5 R$5, C2 R$6
- Carrinho
- Finalização pelo WhatsApp
- Sem rota administrativa

## Publicação recomendada
Crie um NOVO repositório GitHub limpo e envie somente estes 4 arquivos.
Depois crie um NOVO projeto Vercel importando esse repositório.
Framework: Other
Root Directory: ./
Build Command: vazio
Output Directory: vazio
