"use client";

import { DollarSign, Wallet, Mountain, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { RevenueMetrics } from "@/lib/queries/admin";

interface MetricsBarProps {
  metrics: RevenueMetrics;
}

export default function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-semibold">
            Revenue Potential
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={DollarSign}
            label="Pipeline Value"
            value={`$${metrics.pipelineValue.toLocaleString()}`}
            sub="Total if sold out"
          />
          <MetricCard
            icon={Wallet}
            label="Host Wealth Index"
            value={`$${Math.round(metrics.hostWealthIndex).toLocaleString()}`}
            sub="Average per host"
          />
          <MetricCard
            icon={Mountain}
            label="Total Retreats"
            value={metrics.totalRetreats.toString()}
            sub={`${metrics.pendingSubmissions} pending · ${metrics.approvedRetreats} approved`}
          />
          <MetricCard
            icon={Users}
            label="Unique Hosts"
            value={metrics.uniqueHosts.toString()}
            sub={`${metrics.pendingProperties} venues pending`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {label}
        </span>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-xl sm:text-2xl font-bold text-primary">{value}</div>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
