import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import type { Semaforo, StageStatus, TaskPriority, TaskStatus } from '../domain/model';

export function cx(...classes: (string | false | undefined | null)[]) { return classes.filter(Boolean).join(' '); }

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={cx('panel', className)}>{children}</section>; }
export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <div className="section-action">{action}</div>}</div>;
}
export function Badge({ children, tone = 'slate', dot = false }: { children: ReactNode; tone?: string; dot?: boolean }) { return <span className={`badge badge-${tone}`}>{dot && <i />}{children}</span>; }
export function TrafficBadge({ value }: { value: Semaforo }) { return <Badge tone={`traffic-${value.toLowerCase()}`} dot>{value}</Badge>; }
export function StatusBadge({ value }: { value: TaskStatus | StageStatus | string }) {
  const tone = value === 'Completado' || value === 'Completada' ? 'green' : value === 'En Proceso' || value === 'En curso' ? 'blue' : value === 'En Revisión' || value === 'En revisión' ? 'violet' : value === 'Bloqueada' ? 'red' : 'slate';
  return <Badge tone={tone}>{value}</Badge>;
}
export function PriorityBadge({ value }: { value: TaskPriority }) { return <Badge tone={`priority-${value.toLowerCase()}`}>{value}</Badge>; }
export function Avatar({ name, color = '#5367d8', size = 'md' }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  return <span className={`avatar avatar-${size}`} style={{ background: `${color}1c`, color }}>{initials}</span>;
}
export function ProgressBar({ value, color }: { value: number; color?: string }) { return <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>; }
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><Info size={18} /></span><b>{title}</b><p>{text}</p>{action}</div>; }
export function Modal({ title, subtitle, open, onClose, children, size = 'md' }: { title: string; subtitle?: string; open: boolean; onClose: () => void; children: ReactNode; size?: 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></header><div className="modal-body">{children}</div></section></div>;
}
export function FormField({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) { return <label className={`form-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...props} />; }
export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className="input" {...props} />; }
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="input textarea" {...props} />; }
export function Button({ children, variant = 'secondary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) { return <button className={cx('button', `button-${variant}`, className)} {...props}>{children}</button>; }
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { if (!message) return; const timer = window.setTimeout(onClose, 3800); return () => window.clearTimeout(timer); }, [message, onClose]);
  if (!message) return null;
  return <div className="toast"><span className="toast-icon"><Check size={16} /></span><span>{message}</span><button onClick={onClose} aria-label="Cerrar"><X size={15} /></button></div>;
}
export function ErrorBanner({ text }: { text: string }) { return text ? <div className="error-banner"><AlertTriangle size={17} /><span>{text}</span></div> : null; }
export function FieldGrid({ children }: { children: ReactNode }) { return <div className="form-grid">{children}</div>; }
export function useFormState<T>(initial: T) { return useState<T>(initial); }
export type Submit = (event: FormEvent<HTMLFormElement>) => void;

export function dateLabel(value: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
export function compactNumber(value: number) { return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value); }
