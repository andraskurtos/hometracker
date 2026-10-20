--
-- PostgreSQL database dump
--

\restrict F0a0hghUgNInspUuNvHHfUOjJgesIiJVkQ2bAbS9M6J5utO25HaG6HxWSM3q5hs

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: payment_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_enum AS ENUM (
    'CARD',
    'CASH'
);


--
-- Name: settled_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.settled_status AS ENUM (
    'unsettled',
    'pending',
    'settled'
);


--
-- Name: size_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.size_enum AS ENUM (
    'none',
    'volume',
    'weight',
    'pcs'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: household_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.household_members (
    household_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'member'::character varying,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


--
-- Name: households; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.households (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    join_code character varying(20) NOT NULL,
    base_currency character varying(10) DEFAULT 'HUF'::character varying,
    created_by uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: item_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_owners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    receipt_item_id uuid,
    user_id uuid,
    amount numeric NOT NULL,
    settled public.settled_status DEFAULT 'unsettled'::public.settled_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    receipt_name character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    size numeric,
    size_type public.size_enum
);


--
-- Name: receipt_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    receipt_id uuid,
    item_id uuid,
    quantity numeric NOT NULL,
    price_paid numeric NOT NULL
);


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    total numeric NOT NULL,
    payment_method public.payment_enum,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    household_id uuid,
    payee uuid
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    logo character varying(255)
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    display_name character varying(255),
    gender character varying(50),
    date_of_birth date,
    profile_pic_url text,
    revolut_username character varying(255),
    discord_id character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: household_members household_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_pkey PRIMARY KEY (household_id, user_id);


--
-- Name: households households_join_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_join_code_key UNIQUE (join_code);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: item_owners item_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_owners
    ADD CONSTRAINT item_owners_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_receipt_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_receipt_name_key UNIQUE (receipt_name);


--
-- Name: receipt_items receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: stores stores_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_name_key UNIQUE (name);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: idx_push_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);


--
-- Indexes on foreign keys and hot filters
--
-- PostgreSQL indexes primary keys and unique constraints, not foreign keys.
-- Without these, every cascade and every RESTRICT check scans the child table,
-- and the debt summary scans receipt_items for each household.
--

CREATE INDEX idx_household_members_user_id ON public.household_members USING btree (user_id);


CREATE INDEX idx_households_created_by ON public.households USING btree (created_by);


CREATE INDEX idx_item_owners_receipt_item_id ON public.item_owners USING btree (receipt_item_id);


CREATE INDEX idx_item_owners_user_id ON public.item_owners USING btree (user_id);


CREATE INDEX idx_receipt_items_item_id ON public.receipt_items USING btree (item_id);


CREATE INDEX idx_receipt_items_receipt_id ON public.receipt_items USING btree (receipt_id);


-- The receipt list filters by household and orders by date, so one composite
-- index serves both the filter and the sort, and still leads on household_id
-- for the RESTRICT check when a household is deleted.
CREATE INDEX idx_receipts_household_id_created_at ON public.receipts USING btree (household_id, created_at DESC);


CREATE INDEX idx_receipts_payee ON public.receipts USING btree (payee);


CREATE INDEX idx_receipts_store_id ON public.receipts USING btree (store_id);


--
-- Foreign keys
--
-- Delete policy:
--   CASCADE    rows that exist only as part of their parent: memberships,
--              receipt lines, item splits, push subscriptions
--   RESTRICT   financial records and product identity: refuse the delete rather
--              than silently destroying money or receipt history
--   SET NULL   optional attribution: the row survives, the link does not
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


ALTER TABLE ONLY public.item_owners
    ADD CONSTRAINT item_owners_receipt_item_id_fkey FOREIGN KEY (receipt_item_id) REFERENCES public.receipt_items(id) ON DELETE CASCADE;


ALTER TABLE ONLY public.item_owners
    ADD CONSTRAINT item_owners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id) ON DELETE CASCADE;


ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE RESTRICT;


ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_payee_fkey FOREIGN KEY (payee) REFERENCES public.users(id) ON DELETE RESTRICT;


ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict F0a0hghUgNInspUuNvHHfUOjJgesIiJVkQ2bAbS9M6J5utO25HaG6HxWSM3q5hs
