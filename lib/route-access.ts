type SessionUser = { email?: string | null };

export async function checkRouteAccess(
  request: Request,
  user: SessionUser | null | undefined,
  checkPremium: (user: SessionUser) => Promise<boolean>,
): Promise<Response | null> {
  if (!user)
    return Response.json(
      { error: "Sign in with Google to optimize a route." },
      { status: 401 },
    );
  let input;
  try {
    input = await request.clone().json();
  } catch {
    return null; // The route handler returns the validation error.
  }
  if (
    Array.isArray(input?.destinations) &&
    input.destinations.length > 8 &&
    input.destinations.length <= 50
  ) {
    if (!(await checkPremium(user))) {
      return Response.json(
        {
          code: "PREMIUM_REQUIRED",
          error:
            "Upgrade to Premium to plan routes with more than 8 destinations.",
        },
        { status: 403 },
      );
    }
  }
  return null;
}
