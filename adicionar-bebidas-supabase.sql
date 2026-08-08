insert into public.produtos_estoque (produto_id, nome, disponivel)
values
('refri-laranja', 'Refri Laranja', true),
('refri-cola', 'Refri Cola', true)
on conflict (produto_id)
do update set
  nome = excluded.nome,
  disponivel = excluded.disponivel;
