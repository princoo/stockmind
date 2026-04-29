import { ContactForm } from "@/components/public/contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-8 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">Contact us</h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 sm:text-lg">
          Questions about stockmind? Send us a message and we will get back to you.
        </p>
        <div className="mt-6 space-y-2 text-sm text-zinc-600">
          <p>Email: hello@stockmind.app</p>
          <p>Hours: Monday - Friday, 9:00 - 18:00</p>
        </div>
      </section>
      <ContactForm />
    </div>
  );
}
