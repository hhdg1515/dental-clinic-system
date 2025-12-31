// Common UI components for the dental clinic admin system

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export {
  InputField,
  SelectField,
  TextareaField,
  CheckboxField,
  FormGroup,
  default as FormField
} from './FormField';
export type {
  InputFieldProps,
  SelectFieldProps,
  TextareaFieldProps,
  CheckboxFieldProps,
  FormGroupProps,
  SelectOption
} from './FormField';

export { default as Badge, StatusBadge, CountBadge } from './Badge';
export type {
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  StatusBadgeProps,
  CountBadgeProps
} from './Badge';
