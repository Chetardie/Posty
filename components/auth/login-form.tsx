"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { loginAction } from "@/lib/actions/auth"
import type { LoginFormValues } from "@/lib/validations/auth"
import { loginSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function handleSubmit(data: LoginFormValues) {
    form.clearErrors("root")
    const result = await loginAction(data)
    if (!result.success) {
      form.setError("root", { message: result.error })
      return
    }
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(handleSubmit)}>
          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} className="mb-4" />
          )}
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="name@example.com"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="login-form"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Logging in..." : "Log in"}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
