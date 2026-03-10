"use client";

import { Search, Handshake, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function CohostTab() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Handshake className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collaborations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Rating</p>
              <p className="text-2xl font-bold">&mdash;</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applications</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Find Opportunities */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              Find Opportunities
            </h3>
            <p className="text-sm text-muted-foreground">
              Browse retreats looking for co-hosts and collaborators.
            </p>
          </div>
          <Button href="/retreats" size="sm">
            <Search className="w-4 h-4 mr-1" />
            Browse Retreats
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          My Collaborations
        </h2>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No active collaborations yet. Browse retreats to find
              opportunities to partner with hosts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
