import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = "default" | "elevated" | "glass" | "accent"
type AccentColor = "blue" | "green" | "amber" | "red"

interface CardProps extends React.ComponentProps<"div"> {
  variant?: CardVariant
  accentColor?: AccentColor
}

function Card({ className, variant = "default", accentColor = "blue", ...props }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return cn(
          "relative bg-slate-800/80 border-slate-700/50 shadow-lg shadow-black/20 backdrop-blur-sm",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-400/20 before:to-transparent before:rounded-t-xl"
        )
      case "glass":
        return cn(
          "relative bg-slate-800/40 border-slate-600/30 backdrop-blur-md",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-400/30 before:to-transparent before:rounded-t-xl"
        )
      case "accent":
        return cn(
          "relative bg-card border-l-[3px]",
          accentColor === "blue" && "border-l-blue-500 hover:shadow-blue-500/20",
          accentColor === "green" && "border-l-green-500 hover:shadow-green-500/20",
          accentColor === "amber" && "border-l-amber-500 hover:shadow-amber-500/20",
          accentColor === "red" && "border-l-red-500 hover:shadow-red-500/20",
          "hover:shadow-lg"
        )
      default:
        return "bg-card"
    }
  }

  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        "transition-all duration-150 ease-in-out",
        "hover:-translate-y-1 hover:shadow-md hover:border-slate-600/60",
        getVariantStyles(),
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
