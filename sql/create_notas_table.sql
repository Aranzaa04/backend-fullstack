create extension if not exists "pgcrypto";

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  user_id integer not null references public.usuarios(id) on delete cascade,
  text text not null,
  color text not null default '#fce7f3',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notas_text_length check (char_length(text) <= 5000)
);

create index if not exists notas_user_id_idx on public.notas(user_id);
create index if not exists notas_user_created_at_idx on public.notas(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notas_set_updated_at on public.notas;

create trigger notas_set_updated_at
before update on public.notas
for each row
execute function public.set_updated_at();
