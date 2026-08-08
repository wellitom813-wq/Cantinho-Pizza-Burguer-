-- =========================================================
-- CANTINHO PIZZA BURGUER - ESTOQUE GLOBAL
-- Cole este SQL no Supabase > SQL Editor > New query > Run
-- =========================================================

create table if not exists public.produtos_estoque (
  produto_id text primary key,
  disponivel boolean not null default true,
  atualizado_em timestamptz not null default now()
);

alter table public.produtos_estoque
enable row level security;

-- Limpa políticas antigas com estes nomes para poder rodar novamente.
drop policy if exists "estoque_publico_leitura" on public.produtos_estoque;
drop policy if exists "estoque_admin_insert" on public.produtos_estoque;
drop policy if exists "estoque_admin_update" on public.produtos_estoque;

-- Todos os clientes podem apenas LER o estoque.
create policy "estoque_publico_leitura"
on public.produtos_estoque
for select
to anon, authenticated
using (true);

-- Somente usuário autenticado no painel pode criar/alterar linhas.
create policy "estoque_admin_insert"
on public.produtos_estoque
for insert
to authenticated
with check (true);

create policy "estoque_admin_update"
on public.produtos_estoque
for update
to authenticated
using (true)
with check (true);

grant select on public.produtos_estoque to anon;
grant select, insert, update on public.produtos_estoque to authenticated;

-- Estoque inicial
insert into public.produtos_estoque (produto_id, disponivel)
values
  ('x-salada', true),
  ('x-burguer', true),
  ('x-bacon', true),
  ('x-tudao', true),
  ('x-tudo', true),
  ('moda-da-casa', true),
  ('artesanal-simples', true),
  ('x-calabresa-artesanal', true),
  ('x-bacon-artesanal', true),
  ('pizza-mucarela', true),
  ('pizza-calabresa', true),
  ('pizza-frango', true),
  ('pizza-portuguesa', true),
  ('pizza-baiana', true),
  ('pizza-milho', true),
  ('calzone-calabresa', true),
  ('calzone-frango', true),
  ('calzone-presunto', true),
  ('coca-lata-zero', true),
  ('coca-2l', true),
  ('coca-zero-2l', true),
  ('guarana-1l', true),
  ('pepsi-1l', true),
  ('refri-guarana', true)
on conflict (produto_id) do nothing;

-- Para atualização instantânea no site.
-- Se der erro dizendo que a tabela já está na publication,
-- pode ignorar essa linha.
alter publication supabase_realtime
add table public.produtos_estoque;
