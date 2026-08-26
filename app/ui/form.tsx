"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

const formSchema = z.object({
  gateCode: z
    .string()
    .trim()
    .min(1, "Gate code is required.")
    .max(255, "Gate code is too long."),

  street: z
    .string()
    .trim()
    .min(2, "Street is required.")
    .max(255, "Street is too long."),

  city: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(255, "City is too long."),

  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Enter a two letter state code."),

  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code."),

  latitude: z
    .string()
    .trim()
    .min(1, "Latitude is required.")
    .refine((value) => {
      const latitude = Number(value);

      return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90
      );
    }, "Enter a valid latitude."),

  longitude: z
    .string()
    .trim()
    .min(1, "Longitude is required.")
    .refine((value) => {
      const longitude = Number(value);

      return (
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      );
    }, "Enter a valid longitude."),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1,000 characters."),
});

type FormValues = z.infer<typeof formSchema>;

type FormProps = {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
};

export default function Form({
  street = "",
  city = "",
  state = "",
  zipCode = "",
  latitude,
  longitude,
}: FormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gateCode: "",
      street,
      city,
      state,
      zipCode,
      latitude: latitude?.toString() ?? "",
      longitude: longitude?.toString() ?? "",
      notes: "",
    },
  });

  useEffect(() => {
    if (street) {
      form.setValue("street", street);
    }

    if (city) {
      form.setValue("city", city);
    }

    if (state) {
      form.setValue("state", state);
    }

    if (zipCode) {
      form.setValue("zipCode", zipCode);
    }

    if (latitude !== undefined) {
      form.setValue("latitude", latitude.toString());
    }

    if (longitude !== undefined) {
      form.setValue("longitude", longitude.toString());
    }
  }, [
    street,
    city,
    state,
    zipCode,
    latitude,
    longitude,
    form,
  ]);

  async function onSubmit(data: FormValues) {
    try {
      const response = await fetch("/api/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Unable to save gate code.");
      }

      toast.success("Gate code added successfully.");
      form.reset();
    } catch {
      toast.error("Unable to save gate code.");
    }
  }

  return (
    <div className="w-full border-0 bg-transparent text-left shadow-none">

      <div className="px-0">
        <form
          id="gate-code-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="gateCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="gate-code">
                    Gate Code
                  </FieldLabel>

                  <Input
                    {...field}
                    id="gate-code"
                    placeholder="#1234"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="street"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="street">
                    Street
                  </FieldLabel>

                  <Input
                    {...field}
                    id="street"
                    placeholder="1234 Main Street"
                    autoComplete="street-address"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="zipCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="zip-code">
                    ZIP Code
                  </FieldLabel>

                  <Input
                    {...field}
                    id="zip-code"
                    placeholder="95814"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div></div>
          </FieldGroup>
        </form>
      </div>

      <div className="px-0 pb-0">
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>

          <Button
            type="submit"
            form="gate-code-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : "Add Gate Code"}
          </Button>
        </Field>
      </div>
    </div>
  );
}