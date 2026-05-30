import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Sun, Moon } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { MenuToggleIcon } from "@/components/landing/MenuToggleIcon";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Recursos", href: "#features" },
  { label: "Sobre", href: "#about" },
];

interface LandingNavbarProps {
  disableSticky?: boolean;
  forceBlur?: boolean;
  trailingSlot?: React.ReactNode;
}

export function LandingNavbar({
  disableSticky = false,
  forceBlur = false,
  trailingSlot,
}: LandingNavbarProps) {
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(10);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isLoggedIn = !!user;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "z-50 w-full border-b border-transparent",
        !disableSticky && "fixed top-0 right-0 left-0",
        disableSticky && "relative",
        {
          "bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg":
            (scrolled && !disableSticky) || forceBlur,
        },
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 select-none">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 rounded-md p-2">
            <div className="p-1 bg-primary rounded-md text-primary-foreground">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Cogniux</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className={cn(buttonVariants({ variant: "ghost" }), "rounded-md")}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {trailingSlot ?? (
            isLoggedIn ? (
              <Link
                to="/dashboard"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className={cn(buttonVariants({ variant: "default" }), "rounded-full px-6")}
              >
                Entrar
              </Link>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          <MenuToggleIcon open={open} className="size-5" />
        </Button>
      </nav>

      <MobileMenu open={open}>
        <div className="grid w-full gap-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className={cn(buttonVariants({ variant: "default" }), "justify-start")}
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
            )}
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <><Sun className="h-4 w-4" /> Tema claro</>
              ) : (
                <><Moon className="h-4 w-4" /> Tema escuro</>
              )}
            </Button>
          </div>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & { open: boolean };

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden",
      )}
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn(
          "data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out",
          "size-full p-4",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
