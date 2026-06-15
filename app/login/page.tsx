"use client";

import { useState, type ComponentProps } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(
    event: Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0],
  ) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
      rememberMe: remember,
    });

    setIsLoading(false);

    if (!result || result.error) {
      if (result?.error === "Configuration") {
        setError("Authentication is temporarily unavailable due to server configuration.");
      } else {
        setError("Invalid email or password.");
      }
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign In"
      footer={
        <span className="text-[#575e70]">
          Accounts are created by an administrator. Contact your admin if you need access.
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-semibold text-[#424754]"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className="ui-input h-11"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-semibold text-[#424754]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="ui-input h-11 pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727785]"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>


        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="ui-btn-primary h-11 w-full"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}
