
ALTER TABLE public.app_users
    ADD COLUMN provider character varying(255),
    ADD COLUMN provider_id character varying(255),
    ADD COLUMN avatar_url character varying(255);

ALTER TABLE public.app_users ALTER COLUMN password DROP NOT NULL;