-- ============================================================
-- Migration : noyau curriculum LMS
-- Modèle    :
--   program <-> course
--   course <-> learning_module
--   learning_module -> chapter
--   chapter <-> lesson
--
-- Notes :
-- - Les objets réutilisables ne portent pas leur position.
-- - L'ordre et le caractère obligatoire vivent sur les placements.
-- - La progression par session existante reste inchangée.
-- - Les blocs de contenu et la progression par leçon seront ajoutés
--   dans des migrations dédiées.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Objets pédagogiques réutilisables
-- ------------------------------------------------------------

CREATE TABLE public.course (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  summary     text NOT NULL,
  description text NOT NULL,
  status      publication_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_module (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  summary     text NOT NULL,
  description text NOT NULL,
  status      publication_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chapter (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_module_id uuid NOT NULL
    REFERENCES public.learning_module(id) ON DELETE CASCADE,
  slug               text NOT NULL,
  title              text NOT NULL,
  summary            text NOT NULL,
  status             publication_status NOT NULL DEFAULT 'draft',
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chapter_learning_module_slug_unique
    UNIQUE (learning_module_id, slug),

  CONSTRAINT chapter_sort_order_non_negative
    CHECK (sort_order >= 0)
);

CREATE TABLE public.lesson (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  summary     text NOT NULL,
  description text NOT NULL,
  status      publication_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. Placements du curriculum
-- ------------------------------------------------------------

CREATE TABLE public.program_course (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id  uuid NOT NULL
    REFERENCES public.program(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL
    REFERENCES public.course(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT program_course_unique
    UNIQUE (program_id, course_id),

  CONSTRAINT program_course_sort_order_non_negative
    CHECK (sort_order >= 0)
);

CREATE TABLE public.course_module (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id          uuid NOT NULL
    REFERENCES public.course(id) ON DELETE CASCADE,
  learning_module_id uuid NOT NULL
    REFERENCES public.learning_module(id) ON DELETE CASCADE,
  sort_order         integer NOT NULL DEFAULT 0,
  is_required        boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT course_module_unique
    UNIQUE (course_id, learning_module_id),

  CONSTRAINT course_module_sort_order_non_negative
    CHECK (sort_order >= 0)
);

CREATE TABLE public.chapter_lesson (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id  uuid NOT NULL
    REFERENCES public.chapter(id) ON DELETE CASCADE,
  lesson_id   uuid NOT NULL
    REFERENCES public.lesson(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chapter_lesson_unique
    UNIQUE (chapter_id, lesson_id),

  CONSTRAINT chapter_lesson_sort_order_non_negative
    CHECK (sort_order >= 0)
);

-- ------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------

CREATE INDEX idx_program_course_program_id
  ON public.program_course(program_id);

CREATE INDEX idx_program_course_course_id
  ON public.program_course(course_id);

CREATE INDEX idx_program_course_order
  ON public.program_course(program_id, sort_order);

CREATE INDEX idx_course_module_course_id
  ON public.course_module(course_id);

CREATE INDEX idx_course_module_learning_module_id
  ON public.course_module(learning_module_id);

CREATE INDEX idx_course_module_order
  ON public.course_module(course_id, sort_order);

CREATE INDEX idx_chapter_learning_module_id
  ON public.chapter(learning_module_id);

CREATE INDEX idx_chapter_order
  ON public.chapter(learning_module_id, sort_order);

CREATE INDEX idx_chapter_lesson_chapter_id
  ON public.chapter_lesson(chapter_id);

CREATE INDEX idx_chapter_lesson_lesson_id
  ON public.chapter_lesson(lesson_id);

CREATE INDEX idx_chapter_lesson_order
  ON public.chapter_lesson(chapter_id, sort_order);

-- ------------------------------------------------------------
-- 4. updated_at
-- ------------------------------------------------------------

CREATE TRIGGER trg_course_updated_at
  BEFORE UPDATE ON public.course
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_learning_module_updated_at
  BEFORE UPDATE ON public.learning_module
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_chapter_updated_at
  BEFORE UPDATE ON public.chapter
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_lesson_updated_at
  BEFORE UPDATE ON public.lesson
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_program_course_updated_at
  BEFORE UPDATE ON public.program_course
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_course_module_updated_at
  BEFORE UPDATE ON public.course_module
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_chapter_lesson_updated_at
  BEFORE UPDATE ON public.chapter_lesson
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------

ALTER TABLE public.course ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_course ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_lesson ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- program_course
-- ------------------------------------------------------------

CREATE POLICY program_course_select_access
ON public.program_course
FOR SELECT
USING (
  private.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.enrollment e
    JOIN public.participant p
      ON p.id = e.participant_id
    WHERE e.program_id = program_course.program_id
      AND e.status IN ('pending', 'active', 'completed')
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY program_course_insert_admin
ON public.program_course
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY program_course_update_admin
ON public.program_course
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY program_course_delete_admin
ON public.program_course
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- course
-- ------------------------------------------------------------

CREATE POLICY course_select_access
ON public.course
FOR SELECT
USING (
  private.is_admin()
  OR (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.program_course pc
      JOIN public.enrollment e
        ON e.program_id = pc.program_id
      JOIN public.participant p
        ON p.id = e.participant_id
      WHERE pc.course_id = course.id
        AND e.status IN ('pending', 'active', 'completed')
        AND p.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY course_insert_admin
ON public.course
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY course_update_admin
ON public.course
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY course_delete_admin
ON public.course
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- course_module
-- ------------------------------------------------------------

CREATE POLICY course_module_select_access
ON public.course_module
FOR SELECT
USING (
  private.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.program_course pc
    JOIN public.enrollment e
      ON e.program_id = pc.program_id
    JOIN public.participant p
      ON p.id = e.participant_id
    WHERE pc.course_id = course_module.course_id
      AND e.status IN ('pending', 'active', 'completed')
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY course_module_insert_admin
ON public.course_module
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY course_module_update_admin
ON public.course_module
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY course_module_delete_admin
ON public.course_module
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- learning_module
-- ------------------------------------------------------------

CREATE POLICY learning_module_select_access
ON public.learning_module
FOR SELECT
USING (
  private.is_admin()
  OR (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.course_module cm
      JOIN public.program_course pc
        ON pc.course_id = cm.course_id
      JOIN public.enrollment e
        ON e.program_id = pc.program_id
      JOIN public.participant p
        ON p.id = e.participant_id
      WHERE cm.learning_module_id = learning_module.id
        AND e.status IN ('pending', 'active', 'completed')
        AND p.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY learning_module_insert_admin
ON public.learning_module
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY learning_module_update_admin
ON public.learning_module
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY learning_module_delete_admin
ON public.learning_module
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- chapter
-- ------------------------------------------------------------

CREATE POLICY chapter_select_access
ON public.chapter
FOR SELECT
USING (
  private.is_admin()
  OR (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.course_module cm
      JOIN public.program_course pc
        ON pc.course_id = cm.course_id
      JOIN public.enrollment e
        ON e.program_id = pc.program_id
      JOIN public.participant p
        ON p.id = e.participant_id
      WHERE cm.learning_module_id = chapter.learning_module_id
        AND e.status IN ('pending', 'active', 'completed')
        AND p.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY chapter_insert_admin
ON public.chapter
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY chapter_update_admin
ON public.chapter
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY chapter_delete_admin
ON public.chapter
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- chapter_lesson
-- ------------------------------------------------------------

CREATE POLICY chapter_lesson_select_access
ON public.chapter_lesson
FOR SELECT
USING (
  private.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.chapter ch
    JOIN public.course_module cm
      ON cm.learning_module_id = ch.learning_module_id
    JOIN public.program_course pc
      ON pc.course_id = cm.course_id
    JOIN public.enrollment e
      ON e.program_id = pc.program_id
    JOIN public.participant p
      ON p.id = e.participant_id
    WHERE ch.id = chapter_lesson.chapter_id
      AND e.status IN ('pending', 'active', 'completed')
      AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY chapter_lesson_insert_admin
ON public.chapter_lesson
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY chapter_lesson_update_admin
ON public.chapter_lesson
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY chapter_lesson_delete_admin
ON public.chapter_lesson
FOR DELETE
USING (private.is_admin());

-- ------------------------------------------------------------
-- lesson
-- ------------------------------------------------------------

CREATE POLICY lesson_select_access
ON public.lesson
FOR SELECT
USING (
  private.is_admin()
  OR (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.chapter_lesson cl
      JOIN public.chapter ch
        ON ch.id = cl.chapter_id
      JOIN public.course_module cm
        ON cm.learning_module_id = ch.learning_module_id
      JOIN public.program_course pc
        ON pc.course_id = cm.course_id
      JOIN public.enrollment e
        ON e.program_id = pc.program_id
      JOIN public.participant p
        ON p.id = e.participant_id
      WHERE cl.lesson_id = lesson.id
        AND e.status IN ('pending', 'active', 'completed')
        AND p.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY lesson_insert_admin
ON public.lesson
FOR INSERT
WITH CHECK (private.is_admin());

CREATE POLICY lesson_update_admin
ON public.lesson
FOR UPDATE
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY lesson_delete_admin
ON public.lesson
FOR DELETE
USING (private.is_admin());
