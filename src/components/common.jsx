import { useEffect, useMemo, useRef, useState } from 'react';

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
  helperText,
  inputRef,
  maxLength,
  autoComplete
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
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
      />

      {error ? (
        <small className="field-error-text">{error}</small>
      ) : (
        helperText && <small className="field-helper-text">{helperText}</small>
      )}
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
  placeholder,
  error,
  selectRef
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>

      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'input-error' : ''}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      {error && <small className="error-text">{error}</small>}
    </label>
  );
}

export function TreeSelectField({
  label,
  value,
  onChange,
  groups = [],
  placeholder = '선택해주세요',
  error,
  selectRef
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedInfo = useMemo(() => {
    for (const group of groups) {
      const child = group.children?.find(
        (item) => String(item.id) === String(value)
      );

      if (child) {
        return {
          groupId: String(group.id),
          groupName: group.name,
          childName: child.name
        };
      }
    }

    return null;
  }, [groups, value]);

  const [activeGroupId, setActiveGroupId] = useState(
    selectedInfo?.groupId || String(groups[0]?.id || '')
  );

  useEffect(() => {
    if (selectedInfo?.groupId) {
      setActiveGroupId(selectedInfo.groupId);
    }
  }, [selectedInfo]);

  useEffect(() => {
    const close = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const activeGroup = groups.find(
    (group) => String(group.id) === String(activeGroupId)
  );

  return (
    <label className={`field tree-field ${error ? 'field-error' : ''}`} ref={wrapperRef}>
      <span>{label}</span>

      <button
        ref={selectRef}
        type="button"
        className={`tree-select-trigger ${selectedInfo ? 'has-value' : 'is-placeholder'} ${error ? 'input-error' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="tree-select-text">
          {selectedInfo
            ? `${selectedInfo.groupName} > ${selectedInfo.childName}`
            : placeholder}
        </span>
        <span className="tree-select-arrow">{open ? '⌃' : '⌄'}</span>
      </button>

      {open && (
        <div className="tree-select-panel">
          <div className="tree-select-groups">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`tree-select-group ${
                  String(activeGroupId) === String(group.id) ? 'active' : ''
                }`}
                onClick={() => setActiveGroupId(String(group.id))}
              >
                {group.name}
              </button>
            ))}
          </div>

          <div className="tree-select-items">
            {activeGroup?.children?.map((child) => (
              <button
                key={child.id}
                type="button"
                className={`tree-select-item ${
                  String(value) === String(child.id) ? 'selected' : ''
                }`}
                onClick={() => {
                  onChange(String(child.id));
                  setOpen(false);
                }}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <small className="field-error-text">{error}</small>}
    </label>
  );
}

export function CascadingSelectField({
  label,
  value,
  onChange,
  groups = [],
  groupPlaceholder = '큰 카테고리를 선택해주세요',
  childPlaceholder = '세부 카테고리를 선택해주세요',
  error,
  selectRef
}) {
  const currentGroup = useMemo(() => {
    return groups.find((group) =>
      group.children?.some((child) => String(child.id) === String(value))
    );
  }, [groups, value]);

  const [selectedGroupId, setSelectedGroupId] = useState(
    currentGroup ? String(currentGroup.id) : ''
  );

  useEffect(() => {
    if (currentGroup) {
      setSelectedGroupId(String(currentGroup.id));
    }

    if (!value) {
      setSelectedGroupId('');
    }
  }, [currentGroup, value]);

  const selectedGroup = groups.find(
    (group) => String(group.id) === String(selectedGroupId)
  );

  const children = selectedGroup?.children || [];

  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>

      <div className="cascade-selects">
        <select
          ref={selectRef}
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            onChange('');
          }}
          className={error ? 'input-error' : ''}
        >
          <option value="">{groupPlaceholder}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        {selectedGroupId && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'input-error' : ''}
          >
            <option value="">{childPlaceholder}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        )}
      </div>

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