import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

type BaseFieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
};

// Input field
export interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'datetime-local' | 'search' | 'url';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

export function InputField({
  label,
  error,
  hint,
  required,
  className = '',
  containerClassName = '',
  leftIcon,
  rightIcon,
  onRightIconClick,
  id,
  ...props
}: InputFieldProps) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            <i className={leftIcon}></i>
          </span>
        )}
        <input
          id={inputId}
          className={`
            form-input
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_4px_var(--color-error-glow)]' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <i className={rightIcon}></i>
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--color-error)] flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

// Select field
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends BaseFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className = '',
  containerClassName = '',
  options,
  placeholder,
  id,
  ...props
}: SelectFieldProps) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            form-input appearance-none pr-10 cursor-pointer
            ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_4px_var(--color-error-glow)]' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
          <i className="fas fa-chevron-down text-sm"></i>
        </span>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-[var(--color-error)] flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

// Textarea field
export interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  resizable?: boolean;
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  className = '',
  containerClassName = '',
  resizable = true,
  id,
  ...props
}: TextareaFieldProps) {
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          form-input min-h-[100px]
          ${!resizable ? 'resize-none' : 'resize-y'}
          ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_4px_var(--color-error-glow)]' : ''}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-[var(--color-error)] flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

// Checkbox field
export interface CheckboxFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  children?: ReactNode;
}

export function CheckboxField({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  children,
  id,
  ...props
}: CheckboxFieldProps) {
  const checkboxId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-field ${containerClassName}`}>
      <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            className={`
              w-5 h-5 rounded-md border-2 border-[var(--color-border-default)]
              checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)]
              focus:ring-2 focus:ring-[var(--color-primary-glow)] focus:ring-offset-2
              transition-all cursor-pointer
              ${error ? 'border-[var(--color-error)]' : ''}
              ${className}
            `}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        <div className="flex-1">
          {label && (
            <span className="text-[var(--color-text-secondary)] font-medium group-hover:text-[var(--color-text-primary)] transition-colors">
              {label}
            </span>
          )}
          {children}
        </div>
      </label>
      {error && (
        <p className="mt-1.5 text-sm text-[var(--color-error)] flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

// Form group (for grouping multiple fields)
export interface FormGroupProps {
  children: ReactNode;
  className?: string;
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
}

export function FormGroup({
  children,
  className = '',
  direction = 'column',
  gap = 'md'
}: FormGroupProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div
      className={`
        flex ${direction === 'row' ? 'flex-row' : 'flex-col'}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Default export for convenience
export default {
  Input: InputField,
  Select: SelectField,
  Textarea: TextareaField,
  Checkbox: CheckboxField,
  Group: FormGroup
};
