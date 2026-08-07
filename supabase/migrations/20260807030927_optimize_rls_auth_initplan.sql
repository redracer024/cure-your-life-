-- Optimize live Supabase RLS auth evaluation (auth_rls_initplan)
-- Replace direct auth.uid() with (select auth.uid()) in policy expressions.
-- Authorization semantics unchanged: policies remain own-only for the same
-- roles (public), permissive, same names, same USING/WITH CHECK columns.

alter policy "profiles_select_own" on "public"."profiles"
  using ((select auth.uid()) = id);

alter policy "profiles_update_own" on "public"."profiles"
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "subscriptions_select_own" on "public"."subscriptions"
  using ((select auth.uid()) = user_id);

alter policy "decoder_reports_select_own" on "public"."decoder_reports"
  using ((select auth.uid()) = user_id);

alter policy "decoder_reports_insert_own" on "public"."decoder_reports"
  with check ((select auth.uid()) = user_id);

alter policy "decoder_reports_delete_own" on "public"."decoder_reports"
  using ((select auth.uid()) = user_id);

alter policy "journal_entries_select_own" on "public"."journal_entries"
  using ((select auth.uid()) = user_id);

alter policy "journal_entries_insert_own" on "public"."journal_entries"
  with check ((select auth.uid()) = user_id);

alter policy "journal_entries_update_own" on "public"."journal_entries"
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "journal_entries_delete_own" on "public"."journal_entries"
  using ((select auth.uid()) = user_id);