'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * Toast — إشعارات منبثقة (built on Radix)
 * ═══════════════════════════════════════════════════════════════
 *
 * استخدام:
 *   1. ضع <ToastProvider><ToastViewport /></ToastProvider> في layout
 *   2. ضع <Toast> في أي component
 *
 *   <Toast variant="success">
 *     <ToastTitle>تم!</ToastTitle>
 *     <ToastDescription>الإجراء نُفّذ بنجاح</ToastDescription>
 *   </Toast>
 */

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-4 z-[100] flex max-h-screen w-full flex-col-reverse',
      'left-1/2 -translate-x-1/2 max-w-[480px] p-4',
      'gap-2 outline-none',
      'sm:top-4 sm:flex-col',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  cn(
    'group pointer-events-auto relative flex w-full items-center justify-between',
    'gap-3 overflow-hidden rounded-xl border p-4 pl-6 pr-4',
    'shadow-lg transition-all',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=move]:transition-none',
    'data-[state=open]:animate-slide-in-from-top',
    'data-[state=closed]:animate-fade-out',
    'data-[state=closed]:animate-slide-out-to-top'
  ),
  {
    variants: {
      variant: {
        default:
          'bg-white border-[var(--line,rgba(15,26,28,0.08))] text-[var(--ink,#0F1A1C)]',
        success:
          'bg-[var(--emerald-soft,#D9E5DF)] border-[var(--emerald,#0E5C4D)] text-[var(--emerald-deep,#073B30)]',
        warning:
          'bg-[var(--amber-soft,#F0DBC2)] border-[var(--amber,#B8540C)] text-[var(--amber,#B8540C)]',
        destructive:
          'bg-[var(--rose-soft,#F0D7D8)] border-[var(--rose,#A82E3D)] text-[var(--rose,#A82E3D)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      dir="rtl"
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md',
      'border bg-transparent px-3 text-sm font-bold transition-colors',
      'hover:bg-white/50',
      'focus:outline-none focus:ring-2',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute left-2 top-2 rounded-md p-1',
      'opacity-60 transition-opacity hover:opacity-100',
      'focus:outline-none focus:opacity-100',
      className
    )}
    toast-close=""
    aria-label="إغلاق"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-bold leading-tight', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-xs opacity-90 mt-0.5', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
