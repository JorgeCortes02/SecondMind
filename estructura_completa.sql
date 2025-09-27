-- ======================================
-- ENUMS
-- ======================================
CREATE TYPE public.activity_status AS ENUM ('on','off');

-- ======================================
-- PROJECTS
-- ======================================
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    external_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description_project TEXT,
    status public.activity_status DEFAULT 'on' NOT NULL,
    last_opened_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE
);

-- ======================================
-- EVENTS
-- ======================================
DROP TABLE IF EXISTS public.events CASCADE;

CREATE TABLE public.events (
    id SERIAL PRIMARY KEY,
    external_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description_event TEXT,
    status public.activity_status DEFAULT 'on' NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    -- Localización
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
    external_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    is_favorite BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL
);

-- ======================================
-- TASK ITEMS
-- ======================================
DROP TABLE IF EXISTS public.task_items CASCADE;

CREATE TABLE public.task_items (
    id SERIAL PRIMARY KEY,
    external_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description_task TEXT,
    status public.activity_status DEFAULT 'on' NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    complete_date TIMESTAMP WITHOUT TIME ZONE,
    create_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- ======================================
-- UPLOADED DOCUMENTS
-- ======================================
DROP TABLE IF EXISTS public.uploaded_documents CASCADE;

CREATE TABLE public.uploaded_documents (
    id SERIAL PRIMARY KEY,
    external_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    local_url TEXT NOT NULL,
    upload_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- ======================================
-- LAST DELETE TASK
-- ======================================
DROP TABLE IF EXISTS public.last_delete_tasks CASCADE;

CREATE TABLE public.last_delete_tasks (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    date TIMESTAMP WITHOUT TIME ZONE
);