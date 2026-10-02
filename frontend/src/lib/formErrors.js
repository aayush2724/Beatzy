/** Map the API's validation `details` ([{ field: 'body.email', message }]) onto form fields. */
export function fieldErrorsFrom(err) {
  const details = err?.response?.data?.error?.details;
  const out = {};
  if (Array.isArray(details)) {
    for (const d of details) {
      const key = String(d.field || '').split('.').pop();
      if (key && !out[key]) out[key] = d.message;
    }
  }
  return out;
}
