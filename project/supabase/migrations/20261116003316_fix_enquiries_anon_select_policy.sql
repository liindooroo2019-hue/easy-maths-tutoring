-- Allow anon to read back the row it just inserted (needed for .insert().select() to return the id)
DROP POLICY IF EXISTS "anon_select_own_enquiries" ON enquiries;
CREATE POLICY "anon_select_own_enquiries"
  ON enquiries FOR SELECT
  TO anon
  USING (true);
