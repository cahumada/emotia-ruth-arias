"use client";

import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterMessages } from "@/features/newsletter/messages";
import {
  createNewsletterSchema,
  type NewsletterFormValues,
} from "@/features/newsletter/newsletter-schema";
import { subscribeToNews } from "@/features/newsletter/subscribe-to-news";
import { useIsHydrated } from "@/lib/use-is-hydrated";

const schema = createNewsletterSchema();

export function NewsletterForm() {
  const isHydrated = useIsHydrated();
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    field: "email" | "consent" | null;
    message: string;
  }>({ field: null, message: "" });
  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", consent: false, company: "" },
  });

  async function onValid(values: NewsletterFormValues) {
    setIsSending(true);
    setFeedback({ field: null, message: "" });

    try {
      const result = await subscribeToNews({
        email: values.email,
        consent: values.consent,
        company: values.company ?? "",
      });

      if (result.status === "success") {
        setFeedback({ field: null, message: newsletterMessages.success });
        form.reset();
        return;
      }

      if (result.status === "invalid") {
        setFeedback({ field: result.field, message: result.message });
        form.setFocus(result.field);
        return;
      }

      setFeedback({ field: null, message: newsletterMessages.sendError });
    } catch {
      setFeedback({ field: null, message: newsletterMessages.sendError });
    } finally {
      setIsSending(false);
    }
  }

  function onInvalid(errors: FieldErrors<NewsletterFormValues>) {
    if (errors.email) {
      setFeedback({ field: "email", message: newsletterMessages.invalidEmail });
      form.setFocus("email");
      return;
    }

    setFeedback({ field: "consent", message: newsletterMessages.missingConsent });
    form.setFocus("consent");
  }

  return (
    <form
      className="news-form"
      id="emotia-newsletter"
      data-hydrated={isHydrated ? "true" : "false"}
      noValidate
      onSubmit={form.handleSubmit(onValid, onInvalid)}
    >
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="news-company">{newsletterMessages.honeypotLabel}</label>
        <input
          id="news-company"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("company")}
        />
      </div>
      <label htmlFor="news-email">{newsletterMessages.emailLabel}</label>
      <div className="news-inputrow">
        <input
          id="news-email"
          type="email"
          autoComplete="email"
          placeholder={newsletterMessages.emailPlaceholder}
          aria-describedby="news-info news-response"
          aria-invalid={feedback.field === "email" || undefined}
          {...form.register("email")}
        />
        <button className="btn news-submit" type="submit" disabled={isSending}>
          {newsletterMessages.submit}
        </button>
      </div>
      <label className="news-accept" htmlFor="news-consent">
        <input
          id="news-consent"
          type="checkbox"
          aria-invalid={feedback.field === "consent" || undefined}
          {...form.register("consent")}
        />
        <span>{newsletterMessages.consent}</span>
      </label>
      <p className="news-note" id="news-info">
        {newsletterMessages.info}
      </p>
      <p aria-live="polite" className="news-response" id="news-response" role="status">
        {feedback.message}
      </p>
    </form>
  );
}
