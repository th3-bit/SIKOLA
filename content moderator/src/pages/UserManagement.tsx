import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { Plus, Edit2, Trash2, User, Mail, Key, Shield, Check, Search, ArrowLeft, Users, UserCheck, UserX, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SubscriptionType = "free_trial" | "per_course" | "daily" | "weekly" | "monthly";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  subscription_type: SubscriptionType;
  status: "active" | "inactive";
  created_at: string;
}

const subscriptionLabels: Record<SubscriptionType, string> = {
  free_trial: "🆓 Free Trial",
  per_course: "📘 Per Course",
  daily: "☀️ Daily",
  weekly: "📅 Weekly",
  monthly: "🗓 Monthly",
};

const subscriptionColors: Record<SubscriptionType, string> = {
  free_trial: "from-slate-500 to-gray-500",
  per_course: "from-blue-500 to-cyan-500",
  daily: "from-orange-500 to-yellow-500",
  weekly: "from-violet-500 to-purple-500",
  monthly: "from-emerald-500 to-teal-500",
};

const subscriptionBgColors: Record<SubscriptionType, string> = {
  free_trial: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  per_course: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  daily: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  weekly: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  monthly: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const UserManagement = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | SubscriptionType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    subscription_type: "free_trial" as SubscriptionType,
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch profiles");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filteredUsers = profiles.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubscription = subscriptionFilter === "all" || user.subscription_type === subscriptionFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesSubscription && matchesStatus;
  });

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
    if (error) {
      toast.error("Failed to delete profile");
    } else {
      setProfiles(profiles.filter((u) => u.id !== userToDelete.id));
      toast.success("User profile deleted");
    }
    setUserToDelete(null);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
      toast.error("Failed to update status");
    } else {
      setProfiles(profiles.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      toast.success(`User set to ${newStatus}`);
    }
  };

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditFormData({
      full_name: user.full_name,
      subscription_type: user.subscription_type,
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFormData.full_name) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editFormData.full_name,
        subscription_type: editFormData.subscription_type,
      })
      .eq('id', id);
    
    if (error) {
      toast.error("Failed to save changes");
    } else {
      setProfiles(profiles.map(p => p.id === id ? { ...p, ...editFormData } : p));
      toast.success("Profile updated");
      setEditingUserId(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
        <header className="animate-fade-up">
          <div className="glass-panel-strong px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GlassButton variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <ArrowLeft className="w-4 h-4" />
                </GlassButton>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" /> : <Users className="w-5 h-5 text-primary-foreground" />}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">
                      <span className="gradient-text">User Management</span>
                    </h1>
                    <p className="text-xs text-muted-foreground">Manage student access and subscriptions</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {profiles.length} total students
              </div>
            </div>
          </div>
        </header>

        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <GlassCard hover={false}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input pl-10 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value as any)}
                    className="glass-input text-sm"
                  >
                    <option value="all">All Plans</option>
                    {Object.entries(subscriptionLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="glass-input text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="group glass-panel p-4 hover:bg-foreground/5 transition-all duration-300"
                  >
                    {editingUserId === user.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <GlassInput
                            placeholder="Full Name"
                            value={editFormData.full_name}
                            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                          />
                          <select
                            value={editFormData.subscription_type}
                            onChange={(e) => setEditFormData({ ...editFormData, subscription_type: e.target.value as SubscriptionType })}
                            className="glass-input"
                          >
                            {Object.entries(subscriptionLabels).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <GlassButton variant="ghost" size="sm" onClick={() => setEditingUserId(null)}>
                            Cancel
                          </GlassButton>
                          <GlassButton variant="primary" size="sm" onClick={() => handleSaveEdit(user.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </GlassButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subscriptionColors[user.subscription_type]} flex items-center justify-center shadow-lg flex-shrink-0`}
                          >
                            <span className="text-lg font-bold text-white">
                              {user.full_name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <h4 className="font-semibold text-foreground">{user.full_name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${subscriptionBgColors[user.subscription_type]}`}>
                                {subscriptionLabels[user.subscription_type]}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status === "active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>
                                {user.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                <span>{user.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${user.status === "active" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"}`}
                          >
                            {user.status === "active" ? (
                              <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                            )}
                          </button>
                          <GlassButton variant="ghost" size="sm" onClick={() => handleStartEdit(user)}>
                            <Edit2 className="w-4 h-4" />
                          </GlassButton>
                          <GlassButton variant="ghost" size="sm" onClick={() => setUserToDelete(user)} className="hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No students found matching filters</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="glass-panel border-destructive/30">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-foreground">Delete Profile</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete profile for <span className="font-semibold text-foreground">{userToDelete?.full_name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="glass-input border-border/50 hover:bg-foreground/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;

