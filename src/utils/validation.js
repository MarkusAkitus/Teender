const validators = {
  required: (value) => String(value ?? "").trim().length > 0,
  minLen: (min) => (value) => String(value ?? "").trim().length >= min,
  ageRange: (min, max) => (value) => {
    const num = Number(value || 0);
    return num >= min && num <= max;
  },
};

const SCHEMAS = {
  signIn: {
    username: [validators.required],
    password: [validators.required],
  },
  signUp: {
    name: [validators.required, validators.minLen(2)],
    username: [validators.required, validators.minLen(3)],
    password: [validators.required, validators.minLen(4)],
  },
  onboarding: {
    name: [validators.required, validators.minLen(2)],
    age: [validators.required, validators.ageRange(13, 19)],
  },
  message: {
    message: [validators.required, validators.minLen(1)],
  },
};

export function validate(schemaName, data) {
  const schema = SCHEMAS[schemaName];
  if (!schema) return { ok: true, errors: {} };
  const errors = {};
  Object.keys(schema).forEach((key) => {
    const rules = schema[key];
    const value = data[key];
    const ok = rules.every((rule) => rule(value));
    if (!ok) errors[key] = true;
  });
  return { ok: Object.keys(errors).length === 0, errors };
}
