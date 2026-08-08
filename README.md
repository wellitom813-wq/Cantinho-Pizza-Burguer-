# Cantinho Pizza Burguer - Estoque Global

## O que esta versão faz

- Produto disponível: botão `Adicionar +`
- Produto esgotado: card continua no cardápio, aparece faixa `ESGOTADO` e botão fica bloqueado
- Alteração feita em `/admin/` vale para todos os clientes
- Atualização em tempo real pelo Supabase
- Verificação extra de estoque antes de enviar o pedido
- Mantém a trava automática de horário da loja

## Arquivos

- `index.html`
- `style.css`
- `script.js`
- `config.js`
- `supabase-setup.sql`
- `admin/index.html`
- `admin/admin.css`
- `admin/admin.js`

## PASSO 1 — Criar projeto no Supabase

Acesse supabase.com e crie um projeto gratuito.

## PASSO 2 — Criar tabela e políticas

Abra:
SQL Editor > New query

Cole todo o arquivo `supabase-setup.sql` e clique em Run.

## PASSO 3 — Criar seu usuário administrador

Abra:
Authentication > Users

Crie um usuário com o seu e-mail e uma senha forte.

Não cadastre clientes no Supabase. Esse login é só para você acessar o painel.

## PASSO 4 — Pegar URL e chave pública

Abra:
Project Settings > API

Copie:
- Project URL
- anon / publishable key

Abra `config.js` e substitua:

COLE_AQUI_SUA_PROJECT_URL
COLE_AQUI_SUA_ANON_KEY

A anon/publishable key pode ficar no navegador. NUNCA coloque `service_role` no projeto público.

## PASSO 5 — WhatsApp

No começo de `script.js`, troque:

const NUMERO_WHATSAPP = "5587999999999";

pelo número correto.

## PASSO 6 — GitHub/Vercel

Envie TODOS os arquivos e a pasta `admin` para o seu repositório.

Seu painel ficará em:

https://SEU-SITE.vercel.app/admin/

## Como usar

Entre em `/admin/`.

Exemplo:
X-Salada — 🟢 DISPONÍVEL — botão `Esgotar`

Ao apertar `Esgotar`, todos os clientes passam a ver:
- faixa `ESGOTADO`
- botão `Produto esgotado`
- botão bloqueado

Ao apertar `Reativar`, ele volta na hora.

## Segurança

O site público possui apenas permissão de leitura.
Alterações exigem login do Supabase por e-mail e senha.
As regras são protegidas com Row Level Security (RLS).
