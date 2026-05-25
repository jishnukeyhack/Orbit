const { Client } = require('pg');

const URIs = [
  'postgresql://postgres.rcftkczrjfucbfowtjso:jishnuchauhan2006@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.rcftkczrjfucbfowtjso:jishnuchauhan2006@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres'
];

async function tryConnect() {
  for (let uri of URIs) {
    console.log(`Attempting connection with: ${uri.replace(/:[^:@]+@/, ':****@')}...`);
    const client = new Client({
      connectionString: uri,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log('Connected successfully!');
      return { client, uri };
    } catch (err) {
      console.log(`Connection failed: ${err.message}`);
    }
  }
  throw new Error('All connection attempts failed with Password Authentication errors.');
}

async function main() {
  const { client, uri } = await tryConnect();

  console.log('Running Orbit SaaS database migrations...');
  
  const migrationQuery = `
    -- 1. Pipeline Runs Table
    CREATE TABLE IF NOT EXISTS public.orbit_pipeline_runs (
        id TEXT PRIMARY KEY,
        user_id UUID,
        task_title TEXT NOT NULL,
        task_description TEXT,
        project_path TEXT,
        status TEXT DEFAULT 'running',
        started_at BIGINT NOT NULL,
        completed_at BIGINT,
        result_json TEXT,
        total_duration_ms INTEGER,
        iterations INTEGER DEFAULT 1,
        cost_usd DOUBLE PRECISION DEFAULT 0.0,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.orbit_pipeline_runs ENABLE ROW LEVEL SECURITY;

    -- Drop policy if exists and create
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_pipeline_runs' AND policyname = 'Users can manage their own runs'
      ) THEN
        CREATE POLICY "Users can manage their own runs"
            ON public.orbit_pipeline_runs
            FOR ALL
            USING (auth.uid() = user_id OR user_id IS NULL)
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
      END IF;
    END $$;

    -- 2. Pipeline Logs Table
    CREATE TABLE IF NOT EXISTS public.orbit_pipeline_logs (
        id BIGSERIAL PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES public.orbit_pipeline_runs(id) ON DELETE CASCADE,
        stage TEXT,
        level TEXT DEFAULT 'info',
        message TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.orbit_pipeline_logs ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_pipeline_logs' AND policyname = 'Users can view logs of their own runs'
      ) THEN
        CREATE POLICY "Users can view logs of their own runs"
            ON public.orbit_pipeline_logs
            FOR ALL
            USING (EXISTS (
                SELECT 1 FROM public.orbit_pipeline_runs r 
                WHERE r.id = run_id AND (r.user_id = auth.uid() OR r.user_id IS NULL)
            ));
      END IF;
    END $$;

    -- 3. Workspace Files Table
    CREATE TABLE IF NOT EXISTS public.orbit_workspace_files (
        id BIGSERIAL PRIMARY KEY,
        run_id TEXT REFERENCES public.orbit_pipeline_runs(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        content TEXT,
        action TEXT DEFAULT 'created',
        created_at BIGINT NOT NULL
    );

    -- Enable RLS
    ALTER TABLE public.orbit_workspace_files ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_workspace_files' AND policyname = 'Users can manage workspace files of their own runs'
      ) THEN
        CREATE POLICY "Users can manage workspace files of their own runs"
            ON public.orbit_workspace_files
            FOR ALL
            USING (EXISTS (
                SELECT 1 FROM public.orbit_pipeline_runs r 
                WHERE r.id = run_id AND (r.user_id = auth.uid() OR r.user_id IS NULL)
            ));
      END IF;
    END $$;

    -- 4. Chat Messages Table
    CREATE TABLE IF NOT EXISTS public.orbit_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        user_id UUID,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.orbit_chat_messages ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_chat_messages' AND policyname = 'Users can manage their own chat sessions'
      ) THEN
        CREATE POLICY "Users can manage their own chat sessions"
            ON public.orbit_chat_messages
            FOR ALL
            USING (auth.uid() = user_id OR user_id IS NULL)
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
      END IF;
    END $$;

    -- 5. Orbit Blogs Table
    CREATE TABLE IF NOT EXISTS public.orbit_blogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        avatar_url TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.orbit_blogs ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_blogs' AND policyname = 'Anyone can view blogs'
      ) THEN
        CREATE POLICY "Anyone can view blogs"
            ON public.orbit_blogs
            FOR SELECT
            USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orbit_blogs' AND policyname = 'Users can manage their own blogs'
      ) THEN
        CREATE POLICY "Users can manage their own blogs"
            ON public.orbit_blogs
            FOR ALL
            USING (auth.uid() = user_id OR user_id IS NULL)
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
      END IF;
    END $$;

    -- Add to Supabase Realtime publication safely
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orbit_blogs'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orbit_blogs;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END $$;
  `;

  await client.query(migrationQuery);
  console.log('PostgreSQL database migrations executed successfully!');

  // Save successful URL back to .env.local
  const fs = require('fs');
  fs.writeFileSync('.env.local', `DATABASE_URL=${uri}\n`, 'utf-8');
  console.log('Successful connection URI saved in .env.local');

  // Close connection
  await client.end();
  console.log('Database migration completed.');
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
