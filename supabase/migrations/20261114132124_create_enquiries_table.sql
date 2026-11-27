/*
# Create enquiries table for site2 enquiry form

1. New Tables
- `enquiries`
  - `id` (uuid, primary key)
  - `parent_name` (text, not null) - name of the parent/student submitting the enquiry
  - `student_year` (text, not null) - student's year level (e.g. "Year 7")
  - `subject` (text, not null) - subject of interest (Mathematics, English, Both)
  - `lesson_format` (text, not null) - preferred format (In-person, Online, Not sure)
  - `email` (text, not null) - contact email
  - `phone` (text) - optional contact phone
  - `message` (text) - optional message
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `enquiries`.
- Grant INSERT to `anon, authenticated` so visitors can submit enquiries without signing in.
- Grant SELECT to `authenticated` so the site owner can read enquiries if they sign in.
- No UPDATE or DELETE grants needed for the public flow.
- INSERT policy allows anyone (anon + authenticated) to submit — the form is public.
*/

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name text NOT NULL,
  student_year text NOT NULL,
  subject text NOT NULL,
  lesson_format text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON enquiries TO anon, authenticated;
GRANT SELECT ON enquiries TO authenticated;

DROP POLICY IF EXISTS "anon_insert_enquiries" ON enquiries;
CREATE POLICY "anon_insert_enquiries"
  ON enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_enquiries" ON enquiries;
CREATE POLICY "authenticated_select_enquiries"
  ON enquiries FOR SELECT
  TO authenticated
  USING (true);
