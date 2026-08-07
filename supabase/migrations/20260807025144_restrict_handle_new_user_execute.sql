-- Reconcile repository migration history with live state.
-- This migration was previously applied directly to the live database.
-- It exists here only to make local history faithful to live history.
-- Captures the already-applied live change: handle_new_user is not
-- executable by public/anon/authenticated (service_role retains execute).

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
