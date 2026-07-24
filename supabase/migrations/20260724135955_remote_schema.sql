drop extension if exists "pg_net";

revoke references on table "public"."vendor_profiles" from "anon";

revoke trigger on table "public"."vendor_profiles" from "anon";

revoke truncate on table "public"."vendor_profiles" from "anon";

revoke references on table "public"."vendor_profiles" from "authenticated";

revoke trigger on table "public"."vendor_profiles" from "authenticated";

revoke truncate on table "public"."vendor_profiles" from "authenticated";

revoke references on table "public"."vendor_profiles" from "service_role";

revoke trigger on table "public"."vendor_profiles" from "service_role";

revoke truncate on table "public"."vendor_profiles" from "service_role";

alter table "public"."vendor_profiles" drop constraint "vendor_profiles_pkey";

drop index if exists "public"."vendor_profiles_pkey";

drop table "public"."vendor_profiles";

grant delete on table "public"."ads" to "anon";

grant insert on table "public"."ads" to "anon";

grant select on table "public"."ads" to "anon";

grant update on table "public"."ads" to "anon";

grant delete on table "public"."ads" to "authenticated";

grant insert on table "public"."ads" to "authenticated";

grant select on table "public"."ads" to "authenticated";

grant update on table "public"."ads" to "authenticated";

grant delete on table "public"."ads" to "service_role";

grant insert on table "public"."ads" to "service_role";

grant select on table "public"."ads" to "service_role";

grant update on table "public"."ads" to "service_role";

grant delete on table "public"."ai_messages" to "anon";

grant insert on table "public"."ai_messages" to "anon";

grant select on table "public"."ai_messages" to "anon";

grant update on table "public"."ai_messages" to "anon";

grant delete on table "public"."ai_messages" to "authenticated";

grant insert on table "public"."ai_messages" to "authenticated";

grant select on table "public"."ai_messages" to "authenticated";

grant update on table "public"."ai_messages" to "authenticated";

grant delete on table "public"."ai_messages" to "service_role";

grant insert on table "public"."ai_messages" to "service_role";

grant select on table "public"."ai_messages" to "service_role";

grant update on table "public"."ai_messages" to "service_role";

grant delete on table "public"."ai_sessions" to "anon";

grant insert on table "public"."ai_sessions" to "anon";

grant select on table "public"."ai_sessions" to "anon";

grant update on table "public"."ai_sessions" to "anon";

grant delete on table "public"."ai_sessions" to "authenticated";

grant insert on table "public"."ai_sessions" to "authenticated";

grant select on table "public"."ai_sessions" to "authenticated";

grant update on table "public"."ai_sessions" to "authenticated";

grant delete on table "public"."ai_sessions" to "service_role";

grant insert on table "public"."ai_sessions" to "service_role";

grant select on table "public"."ai_sessions" to "service_role";

grant update on table "public"."ai_sessions" to "service_role";

grant delete on table "public"."analytics_events" to "anon";

grant insert on table "public"."analytics_events" to "anon";

grant select on table "public"."analytics_events" to "anon";

grant update on table "public"."analytics_events" to "anon";

grant delete on table "public"."analytics_events" to "authenticated";

grant insert on table "public"."analytics_events" to "authenticated";

grant select on table "public"."analytics_events" to "authenticated";

grant update on table "public"."analytics_events" to "authenticated";

grant delete on table "public"."analytics_events" to "service_role";

grant insert on table "public"."analytics_events" to "service_role";

grant select on table "public"."analytics_events" to "service_role";

grant update on table "public"."analytics_events" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."badges" to "anon";

grant insert on table "public"."badges" to "anon";

grant select on table "public"."badges" to "anon";

grant update on table "public"."badges" to "anon";

grant delete on table "public"."badges" to "authenticated";

grant insert on table "public"."badges" to "authenticated";

grant select on table "public"."badges" to "authenticated";

grant update on table "public"."badges" to "authenticated";

grant delete on table "public"."badges" to "service_role";

grant insert on table "public"."badges" to "service_role";

grant select on table "public"."badges" to "service_role";

grant update on table "public"."badges" to "service_role";

grant delete on table "public"."booking_answers" to "anon";

grant insert on table "public"."booking_answers" to "anon";

grant select on table "public"."booking_answers" to "anon";

grant update on table "public"."booking_answers" to "anon";

grant delete on table "public"."booking_answers" to "authenticated";

grant insert on table "public"."booking_answers" to "authenticated";

grant select on table "public"."booking_answers" to "authenticated";

grant update on table "public"."booking_answers" to "authenticated";

grant delete on table "public"."booking_answers" to "service_role";

grant insert on table "public"."booking_answers" to "service_role";

grant select on table "public"."booking_answers" to "service_role";

grant update on table "public"."booking_answers" to "service_role";

grant delete on table "public"."booking_engine_settings" to "anon";

grant insert on table "public"."booking_engine_settings" to "anon";

grant select on table "public"."booking_engine_settings" to "anon";

grant update on table "public"."booking_engine_settings" to "anon";

grant delete on table "public"."booking_engine_settings" to "authenticated";

grant insert on table "public"."booking_engine_settings" to "authenticated";

grant select on table "public"."booking_engine_settings" to "authenticated";

grant update on table "public"."booking_engine_settings" to "authenticated";

grant delete on table "public"."booking_engine_settings" to "service_role";

grant insert on table "public"."booking_engine_settings" to "service_role";

grant select on table "public"."booking_engine_settings" to "service_role";

grant update on table "public"."booking_engine_settings" to "service_role";

grant delete on table "public"."booking_questions" to "anon";

grant insert on table "public"."booking_questions" to "anon";

grant select on table "public"."booking_questions" to "anon";

grant update on table "public"."booking_questions" to "anon";

grant delete on table "public"."booking_questions" to "authenticated";

grant insert on table "public"."booking_questions" to "authenticated";

grant select on table "public"."booking_questions" to "authenticated";

grant update on table "public"."booking_questions" to "authenticated";

grant delete on table "public"."booking_questions" to "service_role";

grant insert on table "public"."booking_questions" to "service_role";

grant select on table "public"."booking_questions" to "service_role";

grant update on table "public"."booking_questions" to "service_role";

grant delete on table "public"."booking_scopes" to "anon";

grant insert on table "public"."booking_scopes" to "anon";

grant select on table "public"."booking_scopes" to "anon";

grant update on table "public"."booking_scopes" to "anon";

grant delete on table "public"."booking_scopes" to "authenticated";

grant insert on table "public"."booking_scopes" to "authenticated";

grant select on table "public"."booking_scopes" to "authenticated";

grant update on table "public"."booking_scopes" to "authenticated";

grant delete on table "public"."booking_scopes" to "service_role";

grant insert on table "public"."booking_scopes" to "service_role";

grant select on table "public"."booking_scopes" to "service_role";

grant update on table "public"."booking_scopes" to "service_role";

grant delete on table "public"."boosts" to "anon";

grant insert on table "public"."boosts" to "anon";

grant select on table "public"."boosts" to "anon";

grant update on table "public"."boosts" to "anon";

grant delete on table "public"."boosts" to "authenticated";

grant insert on table "public"."boosts" to "authenticated";

grant select on table "public"."boosts" to "authenticated";

grant update on table "public"."boosts" to "authenticated";

grant delete on table "public"."boosts" to "service_role";

grant insert on table "public"."boosts" to "service_role";

grant select on table "public"."boosts" to "service_role";

grant update on table "public"."boosts" to "service_role";

grant delete on table "public"."call_logs" to "anon";

grant insert on table "public"."call_logs" to "anon";

grant select on table "public"."call_logs" to "anon";

grant update on table "public"."call_logs" to "anon";

grant delete on table "public"."call_logs" to "authenticated";

grant insert on table "public"."call_logs" to "authenticated";

grant select on table "public"."call_logs" to "authenticated";

grant update on table "public"."call_logs" to "authenticated";

grant delete on table "public"."call_logs" to "service_role";

grant insert on table "public"."call_logs" to "service_role";

grant select on table "public"."call_logs" to "service_role";

grant update on table "public"."call_logs" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."content_guides" to "anon";

grant insert on table "public"."content_guides" to "anon";

grant select on table "public"."content_guides" to "anon";

grant update on table "public"."content_guides" to "anon";

grant delete on table "public"."content_guides" to "authenticated";

grant insert on table "public"."content_guides" to "authenticated";

grant select on table "public"."content_guides" to "authenticated";

grant update on table "public"."content_guides" to "authenticated";

grant delete on table "public"."content_guides" to "service_role";

grant insert on table "public"."content_guides" to "service_role";

grant select on table "public"."content_guides" to "service_role";

grant update on table "public"."content_guides" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."crm_notes" to "anon";

grant insert on table "public"."crm_notes" to "anon";

grant select on table "public"."crm_notes" to "anon";

grant update on table "public"."crm_notes" to "anon";

grant delete on table "public"."crm_notes" to "authenticated";

grant insert on table "public"."crm_notes" to "authenticated";

grant select on table "public"."crm_notes" to "authenticated";

grant update on table "public"."crm_notes" to "authenticated";

grant delete on table "public"."crm_notes" to "service_role";

grant insert on table "public"."crm_notes" to "service_role";

grant select on table "public"."crm_notes" to "service_role";

grant update on table "public"."crm_notes" to "service_role";

grant delete on table "public"."crm_pipeline" to "anon";

grant insert on table "public"."crm_pipeline" to "anon";

grant select on table "public"."crm_pipeline" to "anon";

grant update on table "public"."crm_pipeline" to "anon";

grant delete on table "public"."crm_pipeline" to "authenticated";

grant insert on table "public"."crm_pipeline" to "authenticated";

grant select on table "public"."crm_pipeline" to "authenticated";

grant update on table "public"."crm_pipeline" to "authenticated";

grant delete on table "public"."crm_pipeline" to "service_role";

grant insert on table "public"."crm_pipeline" to "service_role";

grant select on table "public"."crm_pipeline" to "service_role";

grant update on table "public"."crm_pipeline" to "service_role";

grant delete on table "public"."crm_pipeline_events" to "anon";

grant insert on table "public"."crm_pipeline_events" to "anon";

grant select on table "public"."crm_pipeline_events" to "anon";

grant update on table "public"."crm_pipeline_events" to "anon";

grant delete on table "public"."crm_pipeline_events" to "authenticated";

grant insert on table "public"."crm_pipeline_events" to "authenticated";

grant select on table "public"."crm_pipeline_events" to "authenticated";

grant update on table "public"."crm_pipeline_events" to "authenticated";

grant delete on table "public"."crm_pipeline_events" to "service_role";

grant insert on table "public"."crm_pipeline_events" to "service_role";

grant select on table "public"."crm_pipeline_events" to "service_role";

grant update on table "public"."crm_pipeline_events" to "service_role";

grant delete on table "public"."disputes" to "anon";

grant insert on table "public"."disputes" to "anon";

grant select on table "public"."disputes" to "anon";

grant update on table "public"."disputes" to "anon";

grant delete on table "public"."disputes" to "authenticated";

grant insert on table "public"."disputes" to "authenticated";

grant select on table "public"."disputes" to "authenticated";

grant update on table "public"."disputes" to "authenticated";

grant delete on table "public"."disputes" to "service_role";

grant insert on table "public"."disputes" to "service_role";

grant select on table "public"."disputes" to "service_role";

grant update on table "public"."disputes" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."financial_statements" to "anon";

grant insert on table "public"."financial_statements" to "anon";

grant select on table "public"."financial_statements" to "anon";

grant update on table "public"."financial_statements" to "anon";

grant delete on table "public"."financial_statements" to "authenticated";

grant insert on table "public"."financial_statements" to "authenticated";

grant select on table "public"."financial_statements" to "authenticated";

grant update on table "public"."financial_statements" to "authenticated";

grant delete on table "public"."financial_statements" to "service_role";

grant insert on table "public"."financial_statements" to "service_role";

grant select on table "public"."financial_statements" to "service_role";

grant update on table "public"."financial_statements" to "service_role";

grant delete on table "public"."freshness_scores" to "anon";

grant insert on table "public"."freshness_scores" to "anon";

grant select on table "public"."freshness_scores" to "anon";

grant update on table "public"."freshness_scores" to "anon";

grant delete on table "public"."freshness_scores" to "authenticated";

grant insert on table "public"."freshness_scores" to "authenticated";

grant select on table "public"."freshness_scores" to "authenticated";

grant update on table "public"."freshness_scores" to "authenticated";

grant delete on table "public"."freshness_scores" to "service_role";

grant insert on table "public"."freshness_scores" to "service_role";

grant select on table "public"."freshness_scores" to "service_role";

grant update on table "public"."freshness_scores" to "service_role";

grant delete on table "public"."generated_pages" to "anon";

grant insert on table "public"."generated_pages" to "anon";

grant select on table "public"."generated_pages" to "anon";

grant update on table "public"."generated_pages" to "anon";

grant delete on table "public"."generated_pages" to "authenticated";

grant insert on table "public"."generated_pages" to "authenticated";

grant select on table "public"."generated_pages" to "authenticated";

grant update on table "public"."generated_pages" to "authenticated";

grant delete on table "public"."generated_pages" to "service_role";

grant insert on table "public"."generated_pages" to "service_role";

grant select on table "public"."generated_pages" to "service_role";

grant update on table "public"."generated_pages" to "service_role";

grant delete on table "public"."intent_edges" to "anon";

grant insert on table "public"."intent_edges" to "anon";

grant select on table "public"."intent_edges" to "anon";

grant update on table "public"."intent_edges" to "anon";

grant delete on table "public"."intent_edges" to "authenticated";

grant insert on table "public"."intent_edges" to "authenticated";

grant select on table "public"."intent_edges" to "authenticated";

grant update on table "public"."intent_edges" to "authenticated";

grant delete on table "public"."intent_edges" to "service_role";

grant insert on table "public"."intent_edges" to "service_role";

grant select on table "public"."intent_edges" to "service_role";

grant update on table "public"."intent_edges" to "service_role";

grant delete on table "public"."intent_nodes" to "anon";

grant insert on table "public"."intent_nodes" to "anon";

grant select on table "public"."intent_nodes" to "anon";

grant update on table "public"."intent_nodes" to "anon";

grant delete on table "public"."intent_nodes" to "authenticated";

grant insert on table "public"."intent_nodes" to "authenticated";

grant select on table "public"."intent_nodes" to "authenticated";

grant update on table "public"."intent_nodes" to "authenticated";

grant delete on table "public"."intent_nodes" to "service_role";

grant insert on table "public"."intent_nodes" to "service_role";

grant select on table "public"."intent_nodes" to "service_role";

grant update on table "public"."intent_nodes" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."job_assignments" to "anon";

grant insert on table "public"."job_assignments" to "anon";

grant select on table "public"."job_assignments" to "anon";

grant update on table "public"."job_assignments" to "anon";

grant delete on table "public"."job_assignments" to "authenticated";

grant insert on table "public"."job_assignments" to "authenticated";

grant select on table "public"."job_assignments" to "authenticated";

grant update on table "public"."job_assignments" to "authenticated";

grant delete on table "public"."job_assignments" to "service_role";

grant insert on table "public"."job_assignments" to "service_role";

grant select on table "public"."job_assignments" to "service_role";

grant update on table "public"."job_assignments" to "service_role";

grant delete on table "public"."lead_routing_rules" to "anon";

grant insert on table "public"."lead_routing_rules" to "anon";

grant select on table "public"."lead_routing_rules" to "anon";

grant update on table "public"."lead_routing_rules" to "anon";

grant delete on table "public"."lead_routing_rules" to "authenticated";

grant insert on table "public"."lead_routing_rules" to "authenticated";

grant select on table "public"."lead_routing_rules" to "authenticated";

grant update on table "public"."lead_routing_rules" to "authenticated";

grant delete on table "public"."lead_routing_rules" to "service_role";

grant insert on table "public"."lead_routing_rules" to "service_role";

grant select on table "public"."lead_routing_rules" to "service_role";

grant update on table "public"."lead_routing_rules" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."legal_acceptance" to "anon";

grant insert on table "public"."legal_acceptance" to "anon";

grant select on table "public"."legal_acceptance" to "anon";

grant update on table "public"."legal_acceptance" to "anon";

grant delete on table "public"."legal_acceptance" to "authenticated";

grant insert on table "public"."legal_acceptance" to "authenticated";

grant select on table "public"."legal_acceptance" to "authenticated";

grant update on table "public"."legal_acceptance" to "authenticated";

grant delete on table "public"."legal_acceptance" to "service_role";

grant insert on table "public"."legal_acceptance" to "service_role";

grant select on table "public"."legal_acceptance" to "service_role";

grant update on table "public"."legal_acceptance" to "service_role";

grant delete on table "public"."legal_documents" to "anon";

grant insert on table "public"."legal_documents" to "anon";

grant select on table "public"."legal_documents" to "anon";

grant update on table "public"."legal_documents" to "anon";

grant delete on table "public"."legal_documents" to "authenticated";

grant insert on table "public"."legal_documents" to "authenticated";

grant select on table "public"."legal_documents" to "authenticated";

grant update on table "public"."legal_documents" to "authenticated";

grant delete on table "public"."legal_documents" to "service_role";

grant insert on table "public"."legal_documents" to "service_role";

grant select on table "public"."legal_documents" to "service_role";

grant update on table "public"."legal_documents" to "service_role";

grant delete on table "public"."listings" to "anon";

grant insert on table "public"."listings" to "anon";

grant select on table "public"."listings" to "anon";

grant update on table "public"."listings" to "anon";

grant delete on table "public"."listings" to "authenticated";

grant insert on table "public"."listings" to "authenticated";

grant select on table "public"."listings" to "authenticated";

grant update on table "public"."listings" to "authenticated";

grant delete on table "public"."listings" to "service_role";

grant insert on table "public"."listings" to "service_role";

grant select on table "public"."listings" to "service_role";

grant update on table "public"."listings" to "service_role";

grant delete on table "public"."loyalty_points" to "anon";

grant insert on table "public"."loyalty_points" to "anon";

grant select on table "public"."loyalty_points" to "anon";

grant update on table "public"."loyalty_points" to "anon";

grant delete on table "public"."loyalty_points" to "authenticated";

grant insert on table "public"."loyalty_points" to "authenticated";

grant select on table "public"."loyalty_points" to "authenticated";

grant update on table "public"."loyalty_points" to "authenticated";

grant delete on table "public"."loyalty_points" to "service_role";

grant insert on table "public"."loyalty_points" to "service_role";

grant select on table "public"."loyalty_points" to "service_role";

grant update on table "public"."loyalty_points" to "service_role";

grant delete on table "public"."marketplace_metrics" to "anon";

grant insert on table "public"."marketplace_metrics" to "anon";

grant select on table "public"."marketplace_metrics" to "anon";

grant update on table "public"."marketplace_metrics" to "anon";

grant delete on table "public"."marketplace_metrics" to "authenticated";

grant insert on table "public"."marketplace_metrics" to "authenticated";

grant select on table "public"."marketplace_metrics" to "authenticated";

grant update on table "public"."marketplace_metrics" to "authenticated";

grant delete on table "public"."marketplace_metrics" to "service_role";

grant insert on table "public"."marketplace_metrics" to "service_role";

grant select on table "public"."marketplace_metrics" to "service_role";

grant update on table "public"."marketplace_metrics" to "service_role";

grant delete on table "public"."melissa_actions" to "anon";

grant insert on table "public"."melissa_actions" to "anon";

grant select on table "public"."melissa_actions" to "anon";

grant update on table "public"."melissa_actions" to "anon";

grant delete on table "public"."melissa_actions" to "authenticated";

grant insert on table "public"."melissa_actions" to "authenticated";

grant select on table "public"."melissa_actions" to "authenticated";

grant update on table "public"."melissa_actions" to "authenticated";

grant delete on table "public"."melissa_actions" to "service_role";

grant insert on table "public"."melissa_actions" to "service_role";

grant select on table "public"."melissa_actions" to "service_role";

grant update on table "public"."melissa_actions" to "service_role";

grant delete on table "public"."melissa_alerts" to "anon";

grant insert on table "public"."melissa_alerts" to "anon";

grant select on table "public"."melissa_alerts" to "anon";

grant update on table "public"."melissa_alerts" to "anon";

grant delete on table "public"."melissa_alerts" to "authenticated";

grant insert on table "public"."melissa_alerts" to "authenticated";

grant select on table "public"."melissa_alerts" to "authenticated";

grant update on table "public"."melissa_alerts" to "authenticated";

grant delete on table "public"."melissa_alerts" to "service_role";

grant insert on table "public"."melissa_alerts" to "service_role";

grant select on table "public"."melissa_alerts" to "service_role";

grant update on table "public"."melissa_alerts" to "service_role";

grant delete on table "public"."melissa_outbound_comms" to "anon";

grant insert on table "public"."melissa_outbound_comms" to "anon";

grant select on table "public"."melissa_outbound_comms" to "anon";

grant update on table "public"."melissa_outbound_comms" to "anon";

grant delete on table "public"."melissa_outbound_comms" to "authenticated";

grant insert on table "public"."melissa_outbound_comms" to "authenticated";

grant select on table "public"."melissa_outbound_comms" to "authenticated";

grant update on table "public"."melissa_outbound_comms" to "authenticated";

grant delete on table "public"."melissa_outbound_comms" to "service_role";

grant insert on table "public"."melissa_outbound_comms" to "service_role";

grant select on table "public"."melissa_outbound_comms" to "service_role";

grant update on table "public"."melissa_outbound_comms" to "service_role";

grant delete on table "public"."melissa_reports" to "anon";

grant insert on table "public"."melissa_reports" to "anon";

grant select on table "public"."melissa_reports" to "anon";

grant update on table "public"."melissa_reports" to "anon";

grant delete on table "public"."melissa_reports" to "authenticated";

grant insert on table "public"."melissa_reports" to "authenticated";

grant select on table "public"."melissa_reports" to "authenticated";

grant update on table "public"."melissa_reports" to "authenticated";

grant delete on table "public"."melissa_reports" to "service_role";

grant insert on table "public"."melissa_reports" to "service_role";

grant select on table "public"."melissa_reports" to "service_role";

grant update on table "public"."melissa_reports" to "service_role";

grant delete on table "public"."melissa_safety_rules" to "anon";

grant insert on table "public"."melissa_safety_rules" to "anon";

grant select on table "public"."melissa_safety_rules" to "anon";

grant update on table "public"."melissa_safety_rules" to "anon";

grant delete on table "public"."melissa_safety_rules" to "authenticated";

grant insert on table "public"."melissa_safety_rules" to "authenticated";

grant select on table "public"."melissa_safety_rules" to "authenticated";

grant update on table "public"."melissa_safety_rules" to "authenticated";

grant delete on table "public"."melissa_safety_rules" to "service_role";

grant insert on table "public"."melissa_safety_rules" to "service_role";

grant select on table "public"."melissa_safety_rules" to "service_role";

grant update on table "public"."melissa_safety_rules" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."outreach_businesses" to "anon";

grant insert on table "public"."outreach_businesses" to "anon";

grant select on table "public"."outreach_businesses" to "anon";

grant update on table "public"."outreach_businesses" to "anon";

grant delete on table "public"."outreach_businesses" to "authenticated";

grant insert on table "public"."outreach_businesses" to "authenticated";

grant select on table "public"."outreach_businesses" to "authenticated";

grant update on table "public"."outreach_businesses" to "authenticated";

grant delete on table "public"."outreach_businesses" to "service_role";

grant insert on table "public"."outreach_businesses" to "service_role";

grant select on table "public"."outreach_businesses" to "service_role";

grant update on table "public"."outreach_businesses" to "service_role";

grant delete on table "public"."outreach_followups" to "anon";

grant insert on table "public"."outreach_followups" to "anon";

grant select on table "public"."outreach_followups" to "anon";

grant update on table "public"."outreach_followups" to "anon";

grant delete on table "public"."outreach_followups" to "authenticated";

grant insert on table "public"."outreach_followups" to "authenticated";

grant select on table "public"."outreach_followups" to "authenticated";

grant update on table "public"."outreach_followups" to "authenticated";

grant delete on table "public"."outreach_followups" to "service_role";

grant insert on table "public"."outreach_followups" to "service_role";

grant select on table "public"."outreach_followups" to "service_role";

grant update on table "public"."outreach_followups" to "service_role";

grant delete on table "public"."outreach_messages" to "anon";

grant insert on table "public"."outreach_messages" to "anon";

grant select on table "public"."outreach_messages" to "anon";

grant update on table "public"."outreach_messages" to "anon";

grant delete on table "public"."outreach_messages" to "authenticated";

grant insert on table "public"."outreach_messages" to "authenticated";

grant select on table "public"."outreach_messages" to "authenticated";

grant update on table "public"."outreach_messages" to "authenticated";

grant delete on table "public"."outreach_messages" to "service_role";

grant insert on table "public"."outreach_messages" to "service_role";

grant select on table "public"."outreach_messages" to "service_role";

grant update on table "public"."outreach_messages" to "service_role";

grant delete on table "public"."outreach_stats" to "anon";

grant insert on table "public"."outreach_stats" to "anon";

grant select on table "public"."outreach_stats" to "anon";

grant update on table "public"."outreach_stats" to "anon";

grant delete on table "public"."outreach_stats" to "authenticated";

grant insert on table "public"."outreach_stats" to "authenticated";

grant select on table "public"."outreach_stats" to "authenticated";

grant update on table "public"."outreach_stats" to "authenticated";

grant delete on table "public"."outreach_stats" to "service_role";

grant insert on table "public"."outreach_stats" to "service_role";

grant select on table "public"."outreach_stats" to "service_role";

grant update on table "public"."outreach_stats" to "service_role";

grant delete on table "public"."payouts" to "anon";

grant insert on table "public"."payouts" to "anon";

grant select on table "public"."payouts" to "anon";

grant update on table "public"."payouts" to "anon";

grant delete on table "public"."payouts" to "authenticated";

grant insert on table "public"."payouts" to "authenticated";

grant select on table "public"."payouts" to "authenticated";

grant update on table "public"."payouts" to "authenticated";

grant delete on table "public"."payouts" to "service_role";

grant insert on table "public"."payouts" to "service_role";

grant select on table "public"."payouts" to "service_role";

grant update on table "public"."payouts" to "service_role";

grant delete on table "public"."points_transactions" to "anon";

grant insert on table "public"."points_transactions" to "anon";

grant select on table "public"."points_transactions" to "anon";

grant update on table "public"."points_transactions" to "anon";

grant delete on table "public"."points_transactions" to "authenticated";

grant insert on table "public"."points_transactions" to "authenticated";

grant select on table "public"."points_transactions" to "authenticated";

grant update on table "public"."points_transactions" to "authenticated";

grant delete on table "public"."points_transactions" to "service_role";

grant insert on table "public"."points_transactions" to "service_role";

grant select on table "public"."points_transactions" to "service_role";

grant update on table "public"."points_transactions" to "service_role";

grant delete on table "public"."quality_flags" to "anon";

grant insert on table "public"."quality_flags" to "anon";

grant select on table "public"."quality_flags" to "anon";

grant update on table "public"."quality_flags" to "anon";

grant delete on table "public"."quality_flags" to "authenticated";

grant insert on table "public"."quality_flags" to "authenticated";

grant select on table "public"."quality_flags" to "authenticated";

grant update on table "public"."quality_flags" to "authenticated";

grant delete on table "public"."quality_flags" to "service_role";

grant insert on table "public"."quality_flags" to "service_role";

grant select on table "public"."quality_flags" to "service_role";

grant update on table "public"."quality_flags" to "service_role";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant insert on table "public"."referrals" to "authenticated";

grant select on table "public"."referrals" to "authenticated";

grant update on table "public"."referrals" to "authenticated";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."refunds" to "anon";

grant insert on table "public"."refunds" to "anon";

grant select on table "public"."refunds" to "anon";

grant update on table "public"."refunds" to "anon";

grant delete on table "public"."refunds" to "authenticated";

grant insert on table "public"."refunds" to "authenticated";

grant select on table "public"."refunds" to "authenticated";

grant update on table "public"."refunds" to "authenticated";

grant delete on table "public"."refunds" to "service_role";

grant insert on table "public"."refunds" to "service_role";

grant select on table "public"."refunds" to "service_role";

grant update on table "public"."refunds" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."search_suggestions" to "anon";

grant insert on table "public"."search_suggestions" to "anon";

grant select on table "public"."search_suggestions" to "anon";

grant update on table "public"."search_suggestions" to "anon";

grant delete on table "public"."search_suggestions" to "authenticated";

grant insert on table "public"."search_suggestions" to "authenticated";

grant select on table "public"."search_suggestions" to "authenticated";

grant update on table "public"."search_suggestions" to "authenticated";

grant delete on table "public"."search_suggestions" to "service_role";

grant insert on table "public"."search_suggestions" to "service_role";

grant select on table "public"."search_suggestions" to "service_role";

grant update on table "public"."search_suggestions" to "service_role";

grant delete on table "public"."seller_profiles" to "anon";

grant insert on table "public"."seller_profiles" to "anon";

grant select on table "public"."seller_profiles" to "anon";

grant update on table "public"."seller_profiles" to "anon";

grant delete on table "public"."seller_profiles" to "authenticated";

grant insert on table "public"."seller_profiles" to "authenticated";

grant select on table "public"."seller_profiles" to "authenticated";

grant update on table "public"."seller_profiles" to "authenticated";

grant delete on table "public"."seller_profiles" to "service_role";

grant insert on table "public"."seller_profiles" to "service_role";

grant select on table "public"."seller_profiles" to "service_role";

grant update on table "public"."seller_profiles" to "service_role";

grant delete on table "public"."seo_logs" to "anon";

grant insert on table "public"."seo_logs" to "anon";

grant select on table "public"."seo_logs" to "anon";

grant update on table "public"."seo_logs" to "anon";

grant delete on table "public"."seo_logs" to "authenticated";

grant insert on table "public"."seo_logs" to "authenticated";

grant select on table "public"."seo_logs" to "authenticated";

grant update on table "public"."seo_logs" to "authenticated";

grant delete on table "public"."seo_logs" to "service_role";

grant insert on table "public"."seo_logs" to "service_role";

grant select on table "public"."seo_logs" to "service_role";

grant update on table "public"."seo_logs" to "service_role";

grant delete on table "public"."seo_pages" to "anon";

grant insert on table "public"."seo_pages" to "anon";

grant select on table "public"."seo_pages" to "anon";

grant update on table "public"."seo_pages" to "anon";

grant delete on table "public"."seo_pages" to "authenticated";

grant insert on table "public"."seo_pages" to "authenticated";

grant select on table "public"."seo_pages" to "authenticated";

grant update on table "public"."seo_pages" to "authenticated";

grant delete on table "public"."seo_pages" to "service_role";

grant insert on table "public"."seo_pages" to "service_role";

grant select on table "public"."seo_pages" to "service_role";

grant update on table "public"."seo_pages" to "service_role";

grant delete on table "public"."seo_tasks" to "anon";

grant insert on table "public"."seo_tasks" to "anon";

grant select on table "public"."seo_tasks" to "anon";

grant update on table "public"."seo_tasks" to "anon";

grant delete on table "public"."seo_tasks" to "authenticated";

grant insert on table "public"."seo_tasks" to "authenticated";

grant select on table "public"."seo_tasks" to "authenticated";

grant update on table "public"."seo_tasks" to "authenticated";

grant delete on table "public"."seo_tasks" to "service_role";

grant insert on table "public"."seo_tasks" to "service_role";

grant select on table "public"."seo_tasks" to "service_role";

grant update on table "public"."seo_tasks" to "service_role";

grant delete on table "public"."staff" to "anon";

grant insert on table "public"."staff" to "anon";

grant select on table "public"."staff" to "anon";

grant update on table "public"."staff" to "anon";

grant delete on table "public"."staff" to "authenticated";

grant insert on table "public"."staff" to "authenticated";

grant select on table "public"."staff" to "authenticated";

grant update on table "public"."staff" to "authenticated";

grant delete on table "public"."staff" to "service_role";

grant insert on table "public"."staff" to "service_role";

grant select on table "public"."staff" to "service_role";

grant update on table "public"."staff" to "service_role";

grant delete on table "public"."staff_availability" to "anon";

grant insert on table "public"."staff_availability" to "anon";

grant select on table "public"."staff_availability" to "anon";

grant update on table "public"."staff_availability" to "anon";

grant delete on table "public"."staff_availability" to "authenticated";

grant insert on table "public"."staff_availability" to "authenticated";

grant select on table "public"."staff_availability" to "authenticated";

grant update on table "public"."staff_availability" to "authenticated";

grant delete on table "public"."staff_availability" to "service_role";

grant insert on table "public"."staff_availability" to "service_role";

grant select on table "public"."staff_availability" to "service_role";

grant update on table "public"."staff_availability" to "service_role";

grant delete on table "public"."suburbs" to "anon";

grant insert on table "public"."suburbs" to "anon";

grant select on table "public"."suburbs" to "anon";

grant update on table "public"."suburbs" to "anon";

grant delete on table "public"."suburbs" to "authenticated";

grant insert on table "public"."suburbs" to "authenticated";

grant select on table "public"."suburbs" to "authenticated";

grant update on table "public"."suburbs" to "authenticated";

grant delete on table "public"."suburbs" to "service_role";

grant insert on table "public"."suburbs" to "service_role";

grant select on table "public"."suburbs" to "service_role";

grant update on table "public"."suburbs" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."system_logs" to "anon";

grant insert on table "public"."system_logs" to "anon";

grant select on table "public"."system_logs" to "anon";

grant update on table "public"."system_logs" to "anon";

grant delete on table "public"."system_logs" to "authenticated";

grant insert on table "public"."system_logs" to "authenticated";

grant select on table "public"."system_logs" to "authenticated";

grant update on table "public"."system_logs" to "authenticated";

grant delete on table "public"."system_logs" to "service_role";

grant insert on table "public"."system_logs" to "service_role";

grant select on table "public"."system_logs" to "service_role";

grant update on table "public"."system_logs" to "service_role";

grant delete on table "public"."tax_reports" to "anon";

grant insert on table "public"."tax_reports" to "anon";

grant select on table "public"."tax_reports" to "anon";

grant update on table "public"."tax_reports" to "anon";

grant delete on table "public"."tax_reports" to "authenticated";

grant insert on table "public"."tax_reports" to "authenticated";

grant select on table "public"."tax_reports" to "authenticated";

grant update on table "public"."tax_reports" to "authenticated";

grant delete on table "public"."tax_reports" to "service_role";

grant insert on table "public"."tax_reports" to "service_role";

grant select on table "public"."tax_reports" to "service_role";

grant update on table "public"."tax_reports" to "service_role";

grant delete on table "public"."templates" to "anon";

grant insert on table "public"."templates" to "anon";

grant select on table "public"."templates" to "anon";

grant update on table "public"."templates" to "anon";

grant delete on table "public"."templates" to "authenticated";

grant insert on table "public"."templates" to "authenticated";

grant select on table "public"."templates" to "authenticated";

grant update on table "public"."templates" to "authenticated";

grant delete on table "public"."templates" to "service_role";

grant insert on table "public"."templates" to "service_role";

grant select on table "public"."templates" to "service_role";

grant update on table "public"."templates" to "service_role";

grant delete on table "public"."user_alerts" to "anon";

grant insert on table "public"."user_alerts" to "anon";

grant select on table "public"."user_alerts" to "anon";

grant update on table "public"."user_alerts" to "anon";

grant delete on table "public"."user_alerts" to "authenticated";

grant insert on table "public"."user_alerts" to "authenticated";

grant select on table "public"."user_alerts" to "authenticated";

grant update on table "public"."user_alerts" to "authenticated";

grant delete on table "public"."user_alerts" to "service_role";

grant insert on table "public"."user_alerts" to "service_role";

grant select on table "public"."user_alerts" to "service_role";

grant update on table "public"."user_alerts" to "service_role";

grant delete on table "public"."user_behaviour" to "anon";

grant insert on table "public"."user_behaviour" to "anon";

grant select on table "public"."user_behaviour" to "anon";

grant update on table "public"."user_behaviour" to "anon";

grant delete on table "public"."user_behaviour" to "authenticated";

grant insert on table "public"."user_behaviour" to "authenticated";

grant select on table "public"."user_behaviour" to "authenticated";

grant update on table "public"."user_behaviour" to "authenticated";

grant delete on table "public"."user_behaviour" to "service_role";

grant insert on table "public"."user_behaviour" to "service_role";

grant select on table "public"."user_behaviour" to "service_role";

grant update on table "public"."user_behaviour" to "service_role";

grant delete on table "public"."user_device_fingerprints" to "anon";

grant insert on table "public"."user_device_fingerprints" to "anon";

grant select on table "public"."user_device_fingerprints" to "anon";

grant update on table "public"."user_device_fingerprints" to "anon";

grant delete on table "public"."user_device_fingerprints" to "authenticated";

grant insert on table "public"."user_device_fingerprints" to "authenticated";

grant select on table "public"."user_device_fingerprints" to "authenticated";

grant update on table "public"."user_device_fingerprints" to "authenticated";

grant delete on table "public"."user_device_fingerprints" to "service_role";

grant insert on table "public"."user_device_fingerprints" to "service_role";

grant select on table "public"."user_device_fingerprints" to "service_role";

grant update on table "public"."user_device_fingerprints" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

grant delete on table "public"."user_reputation" to "anon";

grant insert on table "public"."user_reputation" to "anon";

grant select on table "public"."user_reputation" to "anon";

grant update on table "public"."user_reputation" to "anon";

grant delete on table "public"."user_reputation" to "authenticated";

grant insert on table "public"."user_reputation" to "authenticated";

grant select on table "public"."user_reputation" to "authenticated";

grant update on table "public"."user_reputation" to "authenticated";

grant delete on table "public"."user_reputation" to "service_role";

grant insert on table "public"."user_reputation" to "service_role";

grant select on table "public"."user_reputation" to "service_role";

grant update on table "public"."user_reputation" to "service_role";

grant delete on table "public"."user_trust_profile" to "anon";

grant insert on table "public"."user_trust_profile" to "anon";

grant select on table "public"."user_trust_profile" to "anon";

grant update on table "public"."user_trust_profile" to "anon";

grant delete on table "public"."user_trust_profile" to "authenticated";

grant insert on table "public"."user_trust_profile" to "authenticated";

grant select on table "public"."user_trust_profile" to "authenticated";

grant update on table "public"."user_trust_profile" to "authenticated";

grant delete on table "public"."user_trust_profile" to "service_role";

grant insert on table "public"."user_trust_profile" to "service_role";

grant select on table "public"."user_trust_profile" to "service_role";

grant update on table "public"."user_trust_profile" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vendor_alerts" to "anon";

grant insert on table "public"."vendor_alerts" to "anon";

grant select on table "public"."vendor_alerts" to "anon";

grant update on table "public"."vendor_alerts" to "anon";

grant delete on table "public"."vendor_alerts" to "authenticated";

grant insert on table "public"."vendor_alerts" to "authenticated";

grant select on table "public"."vendor_alerts" to "authenticated";

grant update on table "public"."vendor_alerts" to "authenticated";

grant delete on table "public"."vendor_alerts" to "service_role";

grant insert on table "public"."vendor_alerts" to "service_role";

grant select on table "public"."vendor_alerts" to "service_role";

grant update on table "public"."vendor_alerts" to "service_role";

grant delete on table "public"."vendor_calendar_events" to "anon";

grant insert on table "public"."vendor_calendar_events" to "anon";

grant select on table "public"."vendor_calendar_events" to "anon";

grant update on table "public"."vendor_calendar_events" to "anon";

grant delete on table "public"."vendor_calendar_events" to "authenticated";

grant insert on table "public"."vendor_calendar_events" to "authenticated";

grant select on table "public"."vendor_calendar_events" to "authenticated";

grant update on table "public"."vendor_calendar_events" to "authenticated";

grant delete on table "public"."vendor_calendar_events" to "service_role";

grant insert on table "public"."vendor_calendar_events" to "service_role";

grant select on table "public"."vendor_calendar_events" to "service_role";

grant update on table "public"."vendor_calendar_events" to "service_role";

grant delete on table "public"."vendor_crm_quotes" to "anon";

grant insert on table "public"."vendor_crm_quotes" to "anon";

grant select on table "public"."vendor_crm_quotes" to "anon";

grant update on table "public"."vendor_crm_quotes" to "anon";

grant delete on table "public"."vendor_crm_quotes" to "authenticated";

grant insert on table "public"."vendor_crm_quotes" to "authenticated";

grant select on table "public"."vendor_crm_quotes" to "authenticated";

grant update on table "public"."vendor_crm_quotes" to "authenticated";

grant delete on table "public"."vendor_crm_quotes" to "service_role";

grant insert on table "public"."vendor_crm_quotes" to "service_role";

grant select on table "public"."vendor_crm_quotes" to "service_role";

grant update on table "public"."vendor_crm_quotes" to "service_role";

grant delete on table "public"."vendor_metrics" to "anon";

grant insert on table "public"."vendor_metrics" to "anon";

grant select on table "public"."vendor_metrics" to "anon";

grant update on table "public"."vendor_metrics" to "anon";

grant delete on table "public"."vendor_metrics" to "authenticated";

grant insert on table "public"."vendor_metrics" to "authenticated";

grant select on table "public"."vendor_metrics" to "authenticated";

grant update on table "public"."vendor_metrics" to "authenticated";

grant delete on table "public"."vendor_metrics" to "service_role";

grant insert on table "public"."vendor_metrics" to "service_role";

grant select on table "public"."vendor_metrics" to "service_role";

grant update on table "public"."vendor_metrics" to "service_role";

grant delete on table "public"."vendor_payouts" to "anon";

grant insert on table "public"."vendor_payouts" to "anon";

grant select on table "public"."vendor_payouts" to "anon";

grant update on table "public"."vendor_payouts" to "anon";

grant delete on table "public"."vendor_payouts" to "authenticated";

grant insert on table "public"."vendor_payouts" to "authenticated";

grant select on table "public"."vendor_payouts" to "authenticated";

grant update on table "public"."vendor_payouts" to "authenticated";

grant delete on table "public"."vendor_payouts" to "service_role";

grant insert on table "public"."vendor_payouts" to "service_role";

grant select on table "public"."vendor_payouts" to "service_role";

grant update on table "public"."vendor_payouts" to "service_role";

grant delete on table "public"."vendor_trust_scores" to "anon";

grant insert on table "public"."vendor_trust_scores" to "anon";

grant select on table "public"."vendor_trust_scores" to "anon";

grant update on table "public"."vendor_trust_scores" to "anon";

grant delete on table "public"."vendor_trust_scores" to "authenticated";

grant insert on table "public"."vendor_trust_scores" to "authenticated";

grant select on table "public"."vendor_trust_scores" to "authenticated";

grant update on table "public"."vendor_trust_scores" to "authenticated";

grant delete on table "public"."vendor_trust_scores" to "service_role";

grant insert on table "public"."vendor_trust_scores" to "service_role";

grant select on table "public"."vendor_trust_scores" to "service_role";

grant update on table "public"."vendor_trust_scores" to "service_role";


