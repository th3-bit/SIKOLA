import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { Plus, Edit2, Trash2, User, Mail, Key, Shield, Check, Search, ArrowLeft, Users, UserCheck, UserX, AlertTriangle, Eye, EyeOff, Loader2, Clock, Wand2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SubscriptionType = "free_trial" | "per_course" | "daily" | "weekly" | "monthly";

interface Subscription {
  id: string;
  plan_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  payment_reference: string | null;
  plan: {
    name: string;
    price: number;
    plan_type: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  email_confirmed?: boolean;
  last_sign_in?: string | null;
  subscription_type: SubscriptionType;
  status: "active" | "inactive";
  created_at: string;
  subscriptions?: Subscription[];
}

interface UserActivity {
  id: string;
  topic_id: string;
  score: number;
  completed_at: string;
  topic_title: string;
  lesson_title?: string;
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
    password: "",
    expires_at: "",
    subscription_id: null as string | null
  });

  const [loadingActivity, setLoadingActivity] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<UserProfile | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // 1. Fetch ALL auth users (Source of Truth)
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // 2. Fetch profiles with subscription data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          subscriptions:user_subscriptions(
            id,
            plan_id,
            started_at,
            expires_at,
            is_active,
            payment_reference,
            plan:subscription_plans(
              name,
              price,
              plan_type
            )
          )
        `);
      
      if (profilesError) throw profilesError;

      // 3. Merge: Drive from Auth Users to ensure everyone is seen
      const allUsers = (authUsers || []).map(authUser => {
        const profile = profilesData?.find(p => p.id === authUser.id);
        
        // If profile exists, merge; otherwise create placeholder
        if (profile) {
          return {
            ...profile,
            email: authUser.email,
            phone: authUser.phone || profile.phone,
            email_confirmed: authUser.email_confirmed_at ? true : false,
            last_sign_in: authUser.last_sign_in_at,
          };
        } else {
          // Ghost user (has account but no profile DB row)
          return {
            id: authUser.id,
            full_name: "No Profile Set",
            email: authUser.email || "No Email",
            phone: authUser.phone,
            email_confirmed: authUser.email_confirmed_at ? true : false,
            last_sign_in: authUser.last_sign_in_at,
            subscription_type: "free_trial",
            status: "inactive",
            created_at: authUser.created_at,
            subscriptions: []
          } as UserProfile;
        }
      });

      // Sort by recently created
      allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setProfiles(allUsers);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast.error(error.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
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
    
    // Find active subscription to get expiry date
    const activeSub = user.subscriptions?.find(sub => sub.is_active && new Date(sub.expires_at) > new Date());
    
    // Format date for input type="date" (YYYY-MM-DD)
    const formattedDate = activeSub 
      ? new Date(activeSub.expires_at).toISOString().split('T')[0] 
      : "";

    setEditFormData({
      full_name: user.full_name,
      subscription_type: user.subscription_type,
      password: "",
      expires_at: formattedDate,
      subscription_id: activeSub?.id || null
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFormData.full_name) return;
    
    try {
      // 1. Update Profile (Name, Subscription Type Label)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          subscription_type: editFormData.subscription_type,
        })
        .eq('id', id);
      
      if (profileError) throw profileError;

      // 2. Update Subscription Expiry (if active sub exists and date changed)
      if (editFormData.subscription_id && editFormData.expires_at) {
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            expires_at: new Date(editFormData.expires_at).toISOString()
          })
          .eq('id', editFormData.subscription_id);
          
        if (subError) throw subError;
      }

      // 3. Update Password (if provided)
      let passwordMessage = "";
      if (editFormData.password) {
        if (editFormData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        
        const { error: passError } = await supabase.auth.admin.updateUserById(
          id,
          { password: editFormData.password }
        );
        
        if (passError) throw passError;
        passwordMessage = " & Password updated";
      }
      
      // Refresh local state
      toast.success(`Profile updated${passwordMessage}`);
      setEditingUserId(null);
      fetchProfiles(); // Reload to see changes
      
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Resolve titles
        const activitiesWithTitles = await Promise.all(
          data.map(async (act) => {
            // Check if it's a lesson or topic
            const { data: lesson } = await supabase
              .from('lessons')
              .select('title, topics(title)')
              .eq('id', act.topic_id)
              .single();

            if (lesson) {
              return {
                ...act,
                lesson_title: lesson.title,
                topic_title: (lesson.topics as any)?.title || "Unknown Topic"
              };
            }

            const { data: topic } = await supabase
              .from('topics')
              .select('title')
              .eq('id', act.topic_id)
              .single();

            return {
              ...act,
              topic_title: topic?.title || "Unknown Activity"
            };
          })
        );
        setUserActivities(activitiesWithTitles);
      } else {
        setUserActivities([]);
      }
    } catch (err: any) {
      console.error("Error fetching activity:", err);
      toast.error("Failed to load user activity");
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleViewActivity = (user: UserProfile) => {
    setSelectedUserForActivity(user);
    fetchUserActivity(user.id);
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <img src="/logo.jpg" alt="Teachers Content Generator" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">
                      <span className="gradient-text">User Management</span>
                    </h1>
                    <p className="text-xs text-muted-foreground">Manage student access and subscriptions</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GlassButton variant="ghost" size="sm" onClick={() => navigate("/settings/ai")} title="AI Connection">
                  <Wand2 className="w-5 h-5" />
                </GlassButton>
                <div className="text-sm text-muted-foreground">
                  {profiles.length} total students
                </div>
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
                          
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text" 
                              placeholder="Set New Password"
                              value={editFormData.password}
                              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                              className="glass-input pl-10 w-full"
                            />
                          </div>

                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="date"
                              value={editFormData.expires_at}
                              onChange={(e) => setEditFormData({ ...editFormData, expires_at: e.target.value })}
                              className="glass-input pl-10 w-full"
                              title="Subscription Expiry"
                            />
                          </div>
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
                              {user.email_confirmed && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  ✓ Verified
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                              </div>
                              {user.last_sign_in && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Last login: {new Date(user.last_sign_in).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Active Subscriptions */}
                            {user.subscriptions && user.subscriptions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Active Subscriptions:</p>
                                {user.subscriptions
                                  .filter(sub => sub.is_active && new Date(sub.expires_at) > new Date())
                                  .map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between text-xs bg-primary/20 px-2 py-1 rounded">
                                      <span className="font-medium">{sub.plan.name}</span>
                                      <span className="text-muted-foreground">
                                        Expires: {new Date(sub.expires_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
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
                          <GlassButton variant="ghost" size="sm" onClick={() => handleViewActivity(user)} title="View Learning Activity">
                            <Eye className="w-4 h-4" />
                          </GlassButton>
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

      <Dialog open={!!selectedUserForActivity} onOpenChange={(open) => !open && setSelectedUserForActivity(null)}>
        <DialogContent className="glass-panel max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Learning Activity: {selectedUserForActivity?.full_name}
            </DialogTitle>
            <DialogDescription>
              Recent lessons and topics completed by this student.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3 custom-scrollbar">
            {loadingActivity ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading recent activity...</p>
              </div>
            ) : userActivities.length > 0 ? (
              userActivities.map((activity) => (
                <div key={activity.id} className="glass-panel p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {activity.lesson_title || activity.topic_title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-primary/20 text-primary-foreground px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        {activity.lesson_title ? "Lesson" : "Topic"}
                      </span>
                      {activity.lesson_title && (
                        <>
                          <span>•</span>
                          <span>{activity.topic_title}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(activity.completed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${activity.score >= 80 ? "text-emerald-400" : activity.score >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                      {activity.score}%
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Score</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No learning activity recorded yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

