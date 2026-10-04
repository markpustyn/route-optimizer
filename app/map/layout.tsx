import { auth } from "@/auth";
import MapAccount from "@/components/map-account";
import PremiumProvider from "@/components/premium-provider";
import { isPremiumUser } from "@/lib/premium";
import { Metadata } from "next";




export const metadata: Metadata = {
  title: "Stop Nest | Map",
  description:
    "Optimize a driving route with multiple integrated directly with Google Maps. Address autofill,  optimized route, and directions. Free and premium plans available.",
};


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
