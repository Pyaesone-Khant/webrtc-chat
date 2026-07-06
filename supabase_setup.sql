-- 1. Create Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Trigger to create a profile automatically when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists (for safe re-running)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Friendships table
-- Drop table if it exists (for safe re-running)
drop table if exists public.friendships;

create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they are a part of
create policy "Users can view their friendships" 
  on friendships for select 
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can send friend requests (user_id = themselves)
create policy "Users can send friend requests" 
  on friendships for insert 
  with check (auth.uid() = user_id);

-- Users can update (accept) requests sent TO them
create policy "Users can update received friend requests" 
  on friendships for update 
  using (auth.uid() = friend_id);

-- Users can delete (reject/remove) friendships they are part of
create policy "Users can delete their friendships" 
  on friendships for delete 
  using (auth.uid() = user_id or auth.uid() = friend_id);
