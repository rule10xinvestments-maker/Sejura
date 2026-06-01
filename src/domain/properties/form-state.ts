export type PropertyFormState = {
  ok: boolean;
  errors: Record<string, string[]>;
  message: string | null;
  values: Record<string, string>;
};

export const PROPERTY_FORM_INITIAL_STATE: PropertyFormState = {
  ok: false,
  errors: {},
  message: null,
  values: {}
};

export function getPropertyFormValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    contact_phone: String(formData.get("contact_phone") ?? ""),
    contact_email: String(formData.get("contact_email") ?? ""),
    check_in_time: String(formData.get("check_in_time") ?? ""),
    check_out_time: String(formData.get("check_out_time") ?? ""),
    rules: String(formData.get("rules") ?? "")
  };
}
