import { useId, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "md" | "sm"; href?: string };
export function Button({ variant = "primary", size = "md", href, className = "", children, ...rest }: BtnProps) {
  const cls = `v2-btn v2-btn-${variant} v2-btn-${size} ${className}`;
  if (href) return <a className={cls} href={href}>{children}</a>;
  return <button className={cls} {...rest}>{children}</button>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: ReactNode }) {
  return <span className={`v2-badge${tone === "neutral" ? "" : ` v2-badge-${tone}`}`}>{children}</span>;
}

export function Card({ index, icon, title, action, children }: { index?: string; icon?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <article className="v2-card">
      <div>
        <div className="v2-card-head">
          {index && <span className="v2-overline v2-card-index">{index}</span>}
          {icon && <img className="v2-card-icon" src={icon} alt="" />}
        </div>
        <h3 className="v2-card-title">{title}</h3>
      </div>
      <div className="v2-card-body">{children}</div>
      {action && <div className="v2-card-action">{action}</div>}
    </article>
  );
}

export function Input({ label, hint, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string | undefined; error?: string | undefined }) {
  const id = useId();
  return (
    <div className={`v2-field${error ? " v2-field-error" : ""}`}>
      <label className="v2-field-label" htmlFor={id}>{label}</label>
      <input id={id} className="v2-input" aria-invalid={!!error} {...rest} />
      {error ? <span className="v2-field-msg">{error}</span> : hint && <span className="v2-field-hint">{hint}</span>}
    </div>
  );
}

export function Select({ label, options, placeholder, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[]; placeholder?: string }) {
  const id = useId();
  return (
    <div className="v2-field">
      <label className="v2-field-label" htmlFor={id}>{label}</label>
      <div className="v2-select">
        <select id={id} className="v2-input v2-select-el" {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <svg className="v2-select-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </div>
  );
}

export function Checkbox({ label, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="v2-check">
      <input id={id} type="checkbox" className="v2-check-input" {...rest} />
      <label htmlFor={id} className="v2-check-label">
        <span className="v2-check-box"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg></span>
        <span>{label}{hint && <span className="v2-check-hint">{hint}</span>}</span>
      </label>
    </div>
  );
}

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [on, setOn] = useState(0);
  return (
    <div className="v2-tabs">
      <div className="v2-tablist" role="tablist">
        {tabs.map((t, i) => (
          <button key={t.label} role="tab" aria-selected={i === on} className={`v2-tab${i === on ? " v2-tab-on" : ""}`} onClick={() => setOn(i)}>{t.label}</button>
        ))}
      </div>
      <div className="v2-tabpanel" role="tabpanel">{tabs[on]?.content}</div>
    </div>
  );
}
