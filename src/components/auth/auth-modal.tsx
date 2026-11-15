"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(21, "Username must be at most 21 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  } = useAuth();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
    reset: resetSignIn,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    reset: resetSignUp,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSignIn = async (values: SignInFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await signInWithEmail(values.email, values.password);
    setIsSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      resetSignIn();
    }
  };

  const onSignUp = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await signUpWithEmail(
      values.email,
      values.password,
      values.username
    );
    setIsSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      resetSignUp();
    }
  };

  const onGoogleClick = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await signInWithGoogle();
    setIsSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-md bg-surface border-border p-6 shadow-glow">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-white shadow-glow">
            C
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Join the Curia Community
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Participate in technical discussions, vote on content, and build karma.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
            {errorMsg}
          </div>
        )}

        <Tabs
          value={authModalTab}
          onValueChange={(val) => {
            setErrorMsg(null);
            openAuthModal(val as "signin" | "signup");
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-surface-raised border border-border">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="mt-4 space-y-3">
            <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="alex@curia.dev"
                  {...registerSignIn("email")}
                  disabled={isSubmitting}
                />
                {signInErrors.email && (
                  <p className="text-[11px] text-danger">{signInErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...registerSignIn("password")}
                  disabled={isSubmitting}
                />
                {signInErrors.password && (
                  <p className="text-[11px] text-danger">
                    {signInErrors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="signup" className="mt-4 space-y-3">
            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-muted-foreground">
                    u/
                  </span>
                  <Input
                    className="pl-7 font-mono"
                    placeholder="alex_dev"
                    {...registerSignUp("username")}
                    disabled={isSubmitting}
                  />
                </div>
                {signUpErrors.username && (
                  <p className="text-[11px] text-danger">
                    {signUpErrors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="alex@curia.dev"
                  {...registerSignUp("email")}
                  disabled={isSubmitting}
                />
                {signUpErrors.email && (
                  <p className="text-[11px] text-danger">{signUpErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...registerSignUp("password")}
                  disabled={isSubmitting}
                />
                {signUpErrors.password && (
                  <p className="text-[11px] text-danger">
                    {signUpErrors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-[10px] text-muted-foreground font-mono">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onGoogleClick}
          disabled={isSubmitting}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
