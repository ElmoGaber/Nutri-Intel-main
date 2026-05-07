import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function isTrialActive(user: any) {
  if (!user) return false;
  if (user.subscriptionStatus === "active") {
    if (!user.subscriptionEndsAt) return true;
    const ends = new Date(user.subscriptionEndsAt);
    return ends.getTime() > Date.now();
  }
  if (user.subscriptionStatus === "trial") {
    const ends = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    return ends ? ends.getTime() > Date.now() : false;
  }
  return false;
}

export function PremiumGate({ children, featureLabel }: { children: React.ReactNode; featureLabel?: string }) {
  const { user } = useAuth();
  const allowed = isTrialActive(user);

  if (allowed) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent to-black/10">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{featureLabel ? `${featureLabel} — Premium` : "Premium Feature"}</h3>
          <p className="text-sm text-muted-foreground mt-1">Sign up to unlock this feature after your trial.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.assign("/subscribe")}>Subscribe</Button>
          <Button variant="ghost" onClick={() => window.location.assign("/")}>Learn more</Button>
        </div>
      </div>
    </div>
  );
}

export default PremiumGate;
