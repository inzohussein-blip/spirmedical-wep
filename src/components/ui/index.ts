/**
 * ═══════════════════════════════════════════════════════════════
 * UI Primitives — Spir Medical V25
 * ═══════════════════════════════════════════════════════════════
 *
 * كل المكوّنات الأساسية في مكان واحد للاستيراد السريع:
 *
 *   import { Button, Card, Input, Badge, Avatar } from '@/components/ui';
 */

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type { CardProps } from './Card';

// Input + Textarea
export { Input, Textarea } from './Input';
export type { InputProps, TextareaProps } from './Input';

// Badge + DotBadge
export { Badge, DotBadge } from './Badge';
export type { BadgeProps, DotBadgeProps } from './Badge';

// StatusBadge (للحالات الطبية المحددة)
export { StatusBadge } from './StatusBadge';
export type { StatusVariant, StatusSize } from './StatusBadge';

// Avatar
export { Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

// EmptyState + ErrorState
export { EmptyState, ErrorState } from './EmptyState';
export type { EmptyStateProps, ErrorStateProps } from './EmptyState';

// Skeleton
export {
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTable,
  SkeletonStats,
} from './Skeleton';
export type { SkeletonProps, SkeletonTableProps } from './Skeleton';

// Separator
export { Separator } from './Separator';
export type { SeparatorProps } from './Separator';

// Field + FieldGroup (V25.1 - UX)
export { Field, FieldGroup } from './Field';
export type { FieldProps, FieldGroupProps } from './Field';

// Toaster (V25.1 - UX)
export { toast, Toaster, useToasts } from './Toaster';
export type { ToastVariant, ToastMessage } from './Toaster';

// BottomSheet (V25.2 - Mobile UX)
export {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetBody,
  BottomSheetFooter,
} from './BottomSheet';
export type {
  BottomSheetProps,
  BottomSheetHeaderProps,
} from './BottomSheet';

// ConfirmDialog (V25.3 - بديل native confirm())
export { useConfirm } from './ConfirmDialog';
export type { ConfirmOptions, ConfirmVariant } from './ConfirmDialog';

// Map (Free Medical Map)
export { FreeMedicalMapWrapper } from './FreeMedicalMapWrapper';
export type { FreeMedicalMapProps } from './FreeMedicalMap';

// Map Picker (V25 - C1)
export { MapPickerWrapper } from './MapPickerWrapper';
export type { MapPickerProps } from './MapPicker';

// Map Heatmap (V25 - D1)
export { MapHeatmapWrapper } from './MapHeatmapWrapper';
export type { MapHeatmapProps, HeatmapPoint } from './MapHeatmap';

// Shadcn primitives (already in place)
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from './Dialog';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './DropdownMenu';

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './Toast';
