-- ======================================
-- EXTENSIONES
-- ======================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ======================================
-- ENUMS
-- ======================================
CREATE TYPE public.activity_status AS ENUM ('on','off');

-- ======================================
-- USERS
-- ======================================
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    password_hash TEXT,
    verification_token TEXT,
    verification_expires TIMESTAMP WITHOUT TIME ZONE,
    is_verified BOOLEAN DEFAULT false
);

-- ======================================
-- PROJECTS
-- ======================================
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    status public.activity_status DEFAULT 'on' NOT NULL,
    last_opened_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description_project TEXT,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    external_id UUID UNIQUE DEFAULT gen_random_uuid()
);

-- ======================================
-- EVENTS
-- ======================================
DROP TABLE IF EXISTS public.events CASCADE;

CREATE TABLE public.events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status public.activity_status DEFAULT 'on' NOT NULL,
    description_event TEXT,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    external_id UUID UNIQUE DEFAULT gen_random_uuid(),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- ======================================
-- NOTES
-- ======================================
DROP TABLE IF EXISTS public.notes CASCADE;

CREATE TABLE public.notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    external_id UUID UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL
);

-- ======================================
-- TASK ITEMS
-- ======================================
DROP TABLE IF EXISTS public.task_items CASCADE;

CREATE TABLE public.task_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    complete_date TIMESTAMP WITHOUT TIME ZONE,
    status public.activity_status DEFAULT 'on' NOT NULL,
    description_task TEXT,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    external_id UUID UNIQUE DEFAULT gen_random_uuid()
);

-- ======================================
-- UPLOADED DOCUMENTS
-- ======================================
DROP TABLE IF EXISTS public.uploaded_documents CASCADE;

CREATE TABLE public.uploaded_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    local_url TEXT NOT NULL,
    upload_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    external_id UUID UNIQUE DEFAULT gen_random_uuid()
);

-- ======================================
-- LAST DELETE TASK
-- ======================================
DROP TABLE IF EXISTS public.last_delete_task CASCADE;

CREATE TABLE public.last_delete_task (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITHOUT TIME ZONE
);