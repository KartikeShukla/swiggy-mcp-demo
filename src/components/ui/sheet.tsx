"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { usePhoneFrame } from "@/components/layout/phone-frame-context"

type SheetSide = "top" | "right" | "bottom" | "left"

function Sheet({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  const container = usePhoneFrame()
  return (
    <SheetPrimitive.Portal
      data-slot="sheet-portal"
      container={container ?? undefined}
      {...props}
    />
  )
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-[250ms] motion-reduce:transition-none data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:ease-out data-[state=closed]:ease-in",
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side,
  showCloseButton = true,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide
  showCloseButton?: boolean
  overlayClassName?: string
}) {
  const resolvedSide = side ?? "right"

  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex transform-gpu flex-col bg-background shadow-lg transition-[transform,opacity] duration-[250ms] motion-reduce:transition-none data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:ease-out data-[state=closed]:ease-in",
          resolvedSide === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full",
          resolvedSide === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
          resolvedSide === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full",
          resolvedSide === "bottom" &&
            "inset-x-0 bottom-0 max-h-[calc(100%-var(--safe-top,50px))] overflow-hidden rounded-t-[1.75rem] border border-border/70 border-b-0 bg-background pb-[calc(var(--safe-bottom)+0.75rem)] shadow-[0_-16px_40px_rgba(0,0,0,0.18)] data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="ring-offset-background focus:ring-ring absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-4 pb-3 pt-4 pr-12", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 px-4 pb-4 pt-3", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
