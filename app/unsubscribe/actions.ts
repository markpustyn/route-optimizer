"use server";

export type UnsubscribeState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function unsubscribe(
  _previousState: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      status: "error",
      message:
        "Unsubscribe is temporarily unavailable. Please try again later.",
    };
  }

  try {
    // https://resend.com/docs/api-reference/contacts/update-contact
    const response = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unsubscribed: true }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    // Use the same confirmation for unknown contacts to keep membership private.
    if (!response.ok && response.status !== 404) {
      throw new Error("Contact update failed");
    }
    return {
      status: "success",
      message: "You’re unsubscribed from StopNest marketing emails.",
    };
  } catch {
    return {
      status: "error",
      message: "We couldn’t save your preference. Please try again later.",
    };
  }
}
