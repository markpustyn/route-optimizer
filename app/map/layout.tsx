import { auth } from "@/auth";
import MapAccount from "@/components/map-account";
import PremiumProvider from "@/components/premium-provider";
import { isPremiumUser } from "@/lib/premium";

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const premium = await isPremiumUser(session?.user);
  return (
    <PremiumProvider premium={premium}>
      <MapAccount session={session}>{children}</MapAccount>
    </PremiumProvider>
  );
}
