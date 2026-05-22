export function SectionTitle({ title, desc }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );
}

export function Page({ title, desc, children, action }) {
  return (
    <section className="container page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}

export function Info({ icon, label, value }) {
  return (
    <div className="info-card">
      <span>{icon}</span>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export function Stat({ icon, value, label }) {
  return (
    <div className="panel stat-card">
      <span>{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  min,
  step,
  required = false,
  error,
  inputRef
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>
      <input
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        min={min}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
      />
      {error && <small className="field-error-text">{error}</small>}
    </label>
  );
}

export function FieldArea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  textareaRef
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>
      <textarea
        ref={textareaRef}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
      />
      {error && <small className="field-error-text">{error}</small>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = '선택해주세요',
  error,
  selectRef
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>
      <select
        ref={selectRef}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option value={option.id} key={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {error && <small className="field-error-text">{error}</small>}
    </label>
  );
}

export function AuthLayout({ title, desc, children }) {
  return (
    <section className="auth-page">
      <div className="panel auth-card">
        <h1>{title}</h1>
        <p>{desc}</p>
        {children}
      </div>
    </section>
  );
}