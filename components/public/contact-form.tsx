"use client";

import { useState, type ComponentProps } from "react";

type ContactFormState = Readonly<{
  name: string;
  email: string;
  message: string;
}>;

const initialState: ContactFormState = {
  name: "",
  email: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (
    event: Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialState);
  };

  return (
    <form onSubmit={onSubmit} className="ui-panel space-y-4 rounded-2xl p-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Name
        </label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="ui-input"
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          className="ui-input"
          placeholder="name@company.com"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200/90 bg-white/85 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder="How can we help?"
          required
        />
      </div>

      {submitted ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks! Your message has been captured. We will contact you soon.
        </p>
      ) : null}

      <button type="submit" className="ui-btn-primary w-full sm:w-auto">
        Send Message
      </button>
    </form>
  );
}
