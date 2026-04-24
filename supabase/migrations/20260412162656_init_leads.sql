create table public.leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  score integer not null,
  age_group text not null,
  region text not null,
  consent_consultant boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Attiviamo la Row Level Security
alter table public.leads enable row level security;

-- Policy: chiunque (anche anonimo) può inserire un lead
create policy "Allow anonymous inserts" 
on public.leads for insert 
to anon 
with check (true);

-- Nessuna policy di SELECT per 'anon': i dati sono blindati in lettura dal client.