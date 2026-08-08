# Cantinho Pizza Burguer — App completo

Versão oficial baseada no mostruário moderno de delivery.

Inclui:
- 26 produtos
- fotos
- busca
- categorias
- favoritos
- carrinho
- entrega/retirada
- N1 R$4, N3 R$3, N5 R$5, C2 R$6
- Pix, cartão e dinheiro
- troco e observações
- horário automático: terça, quarta, sexta, sábado e domingo, 18h às 22h
- botões travados fora do horário
- estoque global Supabase
- faixa ESGOTADO
- atualização do estoque em tempo real
- validação do estoque antes de enviar
- finalização pelo WhatsApp
- responsivo para celular

## Única configuração manual
No começo do `script.js`, substitua:
`COLOQUE_SEU_NUMERO_AQUI`
pelo WhatsApp correto no formato 55 + DDD + número.

## Supabase
Execute uma vez `sincronizar-produtos-supabase.sql`.

## Vercel
Framework: Other
Root Directory: ./
Build Command: vazio
Output Directory: vazio
