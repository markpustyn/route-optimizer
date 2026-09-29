"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Add your Formspree form ID to .env.local, then restart the dev server.
const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID?.trim();

export function ContactDialog() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formId || submitting.current) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    submitting.current = true;
    setStatus("sending");
    try {
      const response = await fetch(
        "https://formspree.io/f/" + encodeURIComponent(formId),
        { method: "POST", body, headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
        Contact <ArrowRight aria-hidden="true" className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <div className="p-4">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl">Contact StopNest</DialogTitle>
          <DialogDescription className="pb-2">
            Have a question or feedback? Send us a message.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-busy={status === "sending"}
        >
          <fieldset disabled={status === "sending"} className="space-y-4">
            <div className="space-y-4">
              <label htmlFor="contact-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                maxLength={200}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                maxLength={5000}
                className="min-h-32"
              />
            </div>
          </fieldset>
          {!formId && (
            <p role="status" className="text-sm text-muted-foreground">
              Our contact form is temporarily unavailable. Please check back
              soon.
            </p>
          )}
          {status === "success" && (
            <p role="status" className="text-sm text-green-700">
              Thanks! Your message has been sent.
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              Your message could not be sent. Please try again. Your entries
              have been kept.
            </p>
          )}
          <Button
            type="submit"
            disabled={!formId || status === "sending"}
            className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </Button>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
