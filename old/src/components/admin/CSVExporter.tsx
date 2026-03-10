import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, Users, Home, Briefcase, ChefHat, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MemberData {
  id: string;
  email: string;
  name: string;
  roles: string[];
  created_at: string;
}

type RoleType = 'host' | 'cohost' | 'landowner' | 'staff' | 'attendee';

const roleConfig: Record<RoleType, { label: string; icon: React.ElementType; description: string }> = {
  host: { 
    label: 'Hosts', 
    icon: Users, 
    description: 'Retreat hosts and organizers' 
  },
  cohost: { 
    label: 'Cohosts', 
    icon: UserCheck, 
    description: 'Co-facilitators and collaborators' 
  },
  landowner: { 
    label: 'Landowners', 
    icon: Home, 
    description: 'Venue and property owners' 
  },
  staff: { 
    label: 'Staff', 
    icon: Briefcase, 
    description: 'Chefs, photographers, service providers' 
  },
  attendee: { 
    label: 'Attendees', 
    icon: ChefHat, 
    description: 'Retreat participants and guests' 
  },
};

export function CSVExporter() {
  const [loading, setLoading] = useState<RoleType | 'all' | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [fetched, setFetched] = useState(false);

  const fetchMembers = async () => {
    if (fetched) return members;
    
    const { data, error } = await supabase.rpc('get_all_profiles_admin');
    if (error) {
      toast.error('Failed to fetch members');
      return [];
    }
    
    const memberData = (data || []) as MemberData[];
    setMembers(memberData);
    setFetched(true);
    return memberData;
  };

  const generateCSV = (data: MemberData[], role?: RoleType): string => {
    // Headers for Go High Level smart lists
    const headers = ['email', 'first_name', 'last_name', 'full_name', 'role', 'all_roles', 'signup_date', 'user_id'];
    
    const filteredData = role 
      ? data.filter(m => m.roles.includes(role))
      : data;

    const rows = filteredData.map(member => {
      const nameParts = (member.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const primaryRole = role || member.roles[0] || 'user';
      const signupDate = new Date(member.created_at).toISOString().split('T')[0];

      return [
        member.email,
        firstName,
        lastName,
        member.name || '',
        primaryRole,
        member.roles.join(';'),
        signupDate,
        member.id
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (role?: RoleType) => {
    const loadingKey = role || 'all';
    setLoading(loadingKey);
    
    try {
      const data = await fetchMembers();
      if (data.length === 0) {
        toast.error('No members found');
        return;
      }

      const csv = generateCSV(data, role);
      const filename = role 
        ? `ghl_${role}s_${new Date().toISOString().split('T')[0]}.csv`
        : `ghl_all_members_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csv, filename);
      
      const count = role 
        ? data.filter(m => m.roles.includes(role)).length
        : data.length;
      
      toast.success(`Exported ${count} ${role || 'member'}${count !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setLoading(null);
    }
  };

  const collaboratorRoles: RoleType[] = ['host', 'cohost', 'landowner', 'staff'];

  return (
    <div className="space-y-6">
      {/* Collaborators Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Export Collaborators for Go High Level
          </CardTitle>
          <CardDescription>
            Download CSV files segmented by collaborator type for smart list imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collaboratorRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              
              return (
                <Card key={role} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{config.label}</h4>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExport(role)}
                        disabled={loading !== null}
                        className="w-full"
                      >
                        {loading === role ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendees Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Export Attendees Only
          </CardTitle>
          <CardDescription>
            Separate list for retreat participants - perfect for event announcements and guest communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <p>This export includes only users with the attendee role.</p>
              <p>Ideal for: Event updates, retreat announcements, guest-only promotions</p>
            </div>
            <Button 
              onClick={() => handleExport('attendee')}
              disabled={loading !== null}
              className="shrink-0"
            >
              {loading === 'attendee' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Attendees CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export All Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium">Export All Members</h4>
              <p className="text-sm text-muted-foreground">
                Download complete member list with all roles included
              </p>
            </div>
            <Button 
              variant="secondary"
              onClick={() => handleExport()}
              disabled={loading !== null}
            >
              {loading === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
