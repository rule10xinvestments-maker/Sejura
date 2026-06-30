alter table public.property_settings
alter column calendar_required_for_confirmation set default false;

update public.property_settings
set calendar_required_for_confirmation = false
where calendar_required_for_confirmation = true;
