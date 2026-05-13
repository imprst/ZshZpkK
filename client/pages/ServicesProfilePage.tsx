import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Briefcase,
  Gift,
  Star,
  Heart,
  Calendar,
  CreditCard,
  Download,
  Settings,
  Bell,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Wallet,
  TrendingUp,
  Award,
  Share2,
  Copy,
  Receipt,
  History,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Users,
  BarChart3,
  Zap,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import { format, addDays } from "date-fns";

type UserRole = "service_provider" | "manager" | "guest";

const ServicesProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("guest");
  const saveTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const userIdRef = useRef<string | null>(null);

  // User data from database
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    location: "",
    memberSince: new Date().toISOString().split('T')[0],
    profilePicture: "",
    preferences: {
      roleType: "manager",
      notificationType: "detailed",
      taskCategory: "all",
      theme: "modern",
      notifications: {
        tasks: true,
        reports: true,
        alerts: true,
        newsletter: false,
      },
    },
  });

  // Role-based copy templates
  const roleContent = {
    service_provider: {
      icon: Briefcase,
      badge: "Service Partner",
      greeting: `Welcome back, ${userData.firstName}!`,
      tagline: "Your service excellence continues",
      tierLabel: "Service Partner",
      dashboard: "Your Performance",
      recentLabel: "Recent Completions",
      oppTitle: "Active Opportunities",
      earnTitle: "Ways to Earn Recognition Points",
      perfLabel: "Service Performance",
      tierBenefit: "Service Partner Benefits",
      nextTierText: "Unlock Next Tier",
      notifyLabel: "Task Notifications",
      reportLabel: "Report Updates",
      alertLabel: "System Alerts",
      refTitle: "Refer Other Service Providers & Earn",
      refDesc: "For each service provider you refer who completes their first task",
    },
    manager: {
      icon: Users,
      badge: "Property Manager",
      greeting: `Welcome, ${userData.firstName}!`,
      tagline: "Your management dashboard",
      tierLabel: "Manager",
      dashboard: "Team Overview",
      recentLabel: "Recent Activities",
      oppTitle: "Team Opportunities",
      earnTitle: "Team Performance Metrics",
      perfLabel: "Team Performance",
      tierBenefit: "Manager Benefits",
      nextTierText: "Unlock Premium Features",
      notifyLabel: "Team Task Updates",
      reportLabel: "Performance Reports",
      alertLabel: "Team Alerts",
      refTitle: "Recruit Service Providers & Build Your Team",
      refDesc: "For each service provider you recruit and add to your team",
    },
    guest: {
      icon: User,
      badge: "Guest Member",
      greeting: `Welcome, ${userData.firstName}!`,
      tagline: "Explore our service platform",
      tierLabel: "Guest",
      dashboard: "Your Dashboard",
      recentLabel: "Recent Activity",
      oppTitle: "Available Services",
      earnTitle: "How to Get Started",
      perfLabel: "Your Activity",
      tierBenefit: "Member Benefits",
      nextTierText: "Learn More",
      notifyLabel: "Service Notifications",
      reportLabel: "Service Updates",
      alertLabel: "Important Notices",
      refTitle: "Share with Friends & Earn Rewards",
      refDesc: "For each friend you refer who joins",
    },
  };

  // Save field to database with debounce
  const saveFieldToDatabase = async (fieldName: string, value: string) => {
    if (!userIdRef.current) return;

    // Clear existing timeout for this field
    if (saveTimeoutsRef.current[fieldName]) {
      clearTimeout(saveTimeoutsRef.current[fieldName]);
    }

    // Debounce the save by 500ms
    saveTimeoutsRef.current[fieldName] = setTimeout(async () => {
      try {
        const dbFieldName = fieldName === 'firstName' ? 'first_name' :
                           fieldName === 'lastName' ? 'last_name' : fieldName;

        await supabase
          .from("user_profiles")
          .update({ [dbFieldName]: value })
          .eq("user_id", userIdRef.current);
      } catch (error) {
        console.error(`Error saving ${fieldName}:`, error);
      }
    }, 500);
  };

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        userIdRef.current = user.id;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setUserData((prev) => ({
            ...prev,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: user.email || "",
            phone: profile.phone || "",
            birthday: profile.birthday || "",
            location: profile.location || "",
            memberSince: profile.created_at ? profile.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            profilePicture: profile.profile_picture || "",
          }));

          // Determine user role based on profile data
          const role = (profile.user_type || "guest") as UserRole;
          setUserRole(role);

          setDataLoaded(true);
        }
      } catch (error) {
        navigate("/login");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const getPerformanceData = () => {
    if (userRole === "service_provider") {
      return {
        currentRating: 4.8,
        ratingOutOf: 5.0,
        tasksCompleted: 247,
        tasksInProgress: 12,
        avgCompletionTime: "2.3 days",
        qualityScore: 96,
        nextBadge: "Platinum Service Partner",
        badgeProgress: 83,
        pointsToNextBadge: 150,
        lifetimeTasks: 247,
        performanceTier: "Gold Service Partner",
        benefits: [
          "Priority task allocation",
          "15% performance bonus",
          "Featured service listing",
          "Extended support hours",
          "Direct account manager",
          "Training & development access",
        ],
        nextTierBenefits: [
          "All Gold benefits",
          "25% performance bonus",
          "Premium service listing",
          "24/7 dedicated support",
          "Business development manager",
          "Custom partnership agreement",
        ],
      };
    } else if (userRole === "manager") {
      return {
        currentRating: 4.6,
        ratingOutOf: 5.0,
        tasksCompleted: 127,
        tasksInProgress: 8,
        avgCompletionTime: "1.8 days",
        qualityScore: 94,
        nextBadge: "Premium Manager",
        badgeProgress: 68,
        pointsToNextBadge: 220,
        lifetimeTasks: 127,
        performanceTier: "Standard Manager",
        benefits: [
          "Team management tools",
          "10% team discount",
          "Priority support",
          "Advanced reporting",
          "Team analytics",
          "Training resources",
        ],
        nextTierBenefits: [
          "All Standard benefits",
          "20% team discount",
          "24/7 premium support",
          "Custom integrations",
          "Dedicated account manager",
          "Custom reporting",
        ],
      };
    } else {
      return {
        currentRating: 4.2,
        ratingOutOf: 5.0,
        tasksCompleted: 12,
        tasksInProgress: 2,
        avgCompletionTime: "3.1 days",
        qualityScore: 88,
        nextBadge: "Silver Member",
        badgeProgress: 45,
        pointsToNextBadge: 350,
        lifetimeTasks: 12,
        performanceTier: "Guest Member",
        benefits: [
          "Access to service marketplace",
          "Member discounts",
          "Community support",
          "Reviews and ratings",
        ],
        nextTierBenefits: [
          "All Guest benefits",
          "Priority booking",
          "Exclusive services",
          "Dedicated concierge",
        ],
      };
    }
  };

  const performanceData = getPerformanceData();

  const getRecentActivities = () => {
    if (userRole === "service_provider") {
      return [
        {
          id: "1",
          type: "completion",
          description: "Task completed - Housekeeping Service",
          points: "+50 pts",
          date: "2024-01-15",
          status: "completed",
        },
        {
          id: "2",
          type: "completion",
          description: "Task completed - Maintenance Work",
          points: "+75 pts",
          date: "2024-01-14",
          status: "completed",
        },
        {
          id: "3",
          type: "review",
          description: "5-star review received",
          points: "+25 pts",
          date: "2024-01-10",
          status: "completed",
        },
        {
          id: "4",
          type: "milestone",
          description: "100 tasks completed milestone",
          points: "+200 pts",
          date: "2024-01-08",
          status: "completed",
        },
        {
          id: "5",
          type: "referral",
          description: "Service provider referral bonus",
          points: "+100 pts",
          date: "2024-01-05",
          status: "completed",
        },
      ];
    } else if (userRole === "manager") {
      return [
        {
          id: "1",
          type: "completion",
          description: "Team member onboarded",
          points: "+100 pts",
          date: "2024-01-15",
          status: "completed",
        },
        {
          id: "2",
          type: "completion",
          description: "Team performance report generated",
          points: "+50 pts",
          date: "2024-01-14",
          status: "completed",
        },
        {
          id: "3",
          type: "review",
          description: "Team received 5-star rating",
          points: "+75 pts",
          date: "2024-01-10",
          status: "completed",
        },
        {
          id: "4",
          type: "milestone",
          description: "50 tasks managed milestone",
          points: "+150 pts",
          date: "2024-01-08",
          status: "completed",
        },
        {
          id: "5",
          type: "referral",
          description: "New manager referral bonus",
          points: "+200 pts",
          date: "2024-01-05",
          status: "completed",
        },
      ];
    } else {
      return [
        {
          id: "1",
          type: "booking",
          description: "Service booked - Maintenance",
          points: "+20 pts",
          date: "2024-01-15",
          status: "completed",
        },
        {
          id: "2",
          type: "completion",
          description: "Service completed",
          points: "+30 pts",
          date: "2024-01-14",
          status: "completed",
        },
        {
          id: "3",
          type: "review",
          description: "Review submitted",
          points: "+15 pts",
          date: "2024-01-10",
          status: "completed",
        },
        {
          id: "4",
          type: "milestone",
          description: "5 services booked milestone",
          points: "+100 pts",
          date: "2024-01-08",
          status: "completed",
        },
        {
          id: "5",
          type: "referral",
          description: "Friend referral bonus",
          points: "+50 pts",
          date: "2024-01-05",
          status: "completed",
        },
      ];
    }
  };

  const recentActivities = getRecentActivities();

  const getActiveOpportunities = () => {
    if (userRole === "service_provider") {
      return [
        {
          id: "1",
          title: "Maintenance Excellence Badge",
          description: "Complete 20 maintenance tasks with 5-star ratings",
          progress: 18,
          total: 20,
          type: "badge",
          emoji: "🏆",
        },
        {
          id: "2",
          title: "Service Partner Bonus",
          description: "Earn 2% bonus on all tasks this month",
          validUntil: "2024-02-29",
          type: "offer",
          emoji: "💰",
        },
        {
          id: "3",
          title: "Referral Program",
          description: "Refer other service providers and earn 500 points each",
          validUntil: "Ongoing",
          type: "referral",
          emoji: "👥",
        },
      ];
    } else if (userRole === "manager") {
      return [
        {
          id: "1",
          title: "Team Expansion Goal",
          description: "Recruit 5 service providers to your team",
          progress: 3,
          total: 5,
          type: "badge",
          emoji: "📈",
        },
        {
          id: "2",
          title: "Manager Performance Bonus",
          description: "Achieve 95% team quality score this month",
          validUntil: "2024-02-29",
          type: "offer",
          emoji: "⭐",
        },
        {
          id: "3",
          title: "Manager Referral Program",
          description: "Refer other managers and earn 750 points each",
          validUntil: "Ongoing",
          type: "referral",
          emoji: "🤝",
        },
      ];
    } else {
      return [
        {
          id: "1",
          title: "Loyal Customer Badge",
          description: "Complete 10 service bookings",
          progress: 7,
          total: 10,
          type: "badge",
          emoji: "⭐",
        },
        {
          id: "2",
          title: "Member Discount",
          description: "Get 10% off your next 3 services",
          validUntil: "2024-02-29",
          type: "offer",
          emoji: "🎁",
        },
        {
          id: "3",
          title: "Share & Earn",
          description: "Refer friends and get 50 points per signup",
          validUntil: "Ongoing",
          type: "referral",
          emoji: "💝",
        },
      ];
    }
  };

  const activeOpportunities = getActiveOpportunities();

  const getTaskEarningActivities = () => {
    if (userRole === "service_provider") {
      return [
        {
          activity: "Standard Task Completion",
          points: "Base rate + quality bonus",
          icon: CheckCircle,
        },
        {
          activity: "5-Star Reviews",
          points: "+25 bonus points",
          icon: Star,
        },
        {
          activity: "On-Time Completion",
          points: "+10 bonus points",
          icon: Clock,
        },
        {
          activity: "Milestone Achievements",
          points: "+200 points per milestone",
          icon: Target,
        },
        {
          activity: "Professional Photos",
          points: "+50 bonus points",
          icon: Camera,
        },
        {
          activity: "Service Provider Referrals",
          points: "+500 bonus points",
          icon: Users,
        },
      ];
    } else if (userRole === "manager") {
      return [
        {
          activity: "Team Task Completion",
          points: "Base management fee",
          icon: CheckCircle,
        },
        {
          activity: "Team Quality Score",
          points: "+50 bonus points",
          icon: Star,
        },
        {
          activity: "On-Time Project Delivery",
          points: "+30 bonus points",
          icon: Clock,
        },
        {
          activity: "Team Growth Milestones",
          points: "+150 points per milestone",
          icon: Target,
        },
        {
          activity: "Performance Reports",
          points: "+40 bonus points",
          icon: BarChart3,
        },
        {
          activity: "Manager Referrals",
          points: "+750 bonus points",
          icon: Users,
        },
      ];
    } else {
      return [
        {
          activity: "Service Booking",
          points: "+20 reward points",
          icon: CheckCircle,
        },
        {
          activity: "Service Review",
          points: "+15 reward points",
          icon: Star,
        },
        {
          activity: "On-Time Rating",
          points: "+10 reward points",
          icon: Clock,
        },
        {
          activity: "Booking Milestones",
          points: "+100 points per milestone",
          icon: Target,
        },
        {
          activity: "Photo Reviews",
          points: "+25 reward points",
          icon: Camera,
        },
        {
          activity: "Friend Referrals",
          points: "+100 reward points",
          icon: Users,
        },
      ];
    }
  };

  const taskEarningActivities = getTaskEarningActivities();

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const generateServiceCode = () => {
    return "SRVP-2024-" + userData.firstName.toUpperCase();
  };

  const copyServiceCode = () => {
    navigator.clipboard.writeText(generateServiceCode());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sheraton-cream to-background">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {roleContent[userRole].icon &&
              React.createElement(roleContent[userRole].icon, {
                className: "h-8 w-8 text-sheraton-gold mr-2"
              })
            }
            <Badge className="bg-sheraton-gold text-sheraton-navy px-4 py-2">
              {roleContent[userRole].badge}
            </Badge>
          </div>
          {userData.firstName && (
            <h1 className="text-4xl md:text-5xl font-bold text-sheraton-navy mb-4">
              {roleContent[userRole].greeting}
            </h1>
          )}
          <p className="text-lg text-muted-foreground">
            {roleContent[userRole].tagline} • {performanceData.performanceTier} Member
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-2 py-3"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2 py-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 py-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="flex items-center gap-2 py-3"
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Activities</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2 py-3"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center gap-2 py-3"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Refer</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Service Summary */}
              <Card className="lg:col-span-1">
                <CardHeader className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={userData.profilePicture} />
                      <AvatarFallback className="text-2xl font-bold bg-sheraton-gold text-sheraton-navy">
                        {userData.firstName[0]}
                        {userData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 sheraton-gradient"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-sheraton-navy">
                    {userData.firstName} {userData.lastName}
                  </CardTitle>
                  <Badge className="sheraton-gradient text-white">
                    {performanceData.performanceTier}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sheraton-gold mb-1">
                      {performanceData.currentRating}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userRole === "service_provider"
                        ? "Service Rating"
                        : userRole === "manager"
                        ? "Team Rating"
                        : "Member Rating"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to {performanceData.nextBadge}</span>
                      <span>{performanceData.badgeProgress}%</span>
                    </div>
                    <Progress
                      value={performanceData.badgeProgress}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground text-center">
                      {performanceData.pointsToNextBadge} points to next tier
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">
                        {format(new Date(userData.memberSince), "MMM yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Partner Since
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {performanceData.lifetimeTasks}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tasks Completed
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats & Opportunities */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-sheraton-gold" />
                    {roleContent[userRole].dashboard}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-700">
                        {performanceData.tasksInProgress}
                      </div>
                      <div className="text-xs text-blue-600">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-700">
                        {performanceData.qualityScore}%
                      </div>
                      <div className="text-xs text-green-600">Quality Score</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">
                        {performanceData.avgCompletionTime}
                      </div>
                      <div className="text-xs text-purple-600">Avg. Time</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/tasks/list">
                      <Button className="w-full h-20 flex flex-col gap-2 sheraton-gradient text-white">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-xs">View Tasks</span>
                      </Button>
                    </Link>
                    <Link to="/reports">
                      <Button
                        className="w-full h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <BarChart3 className="h-6 w-6 text-sheraton-gold" />
                        <span className="text-xs">Reports</span>
                      </Button>
                    </Link>
                    <Link to="/accounts">
                      <Button
                        className="w-full h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <Users className="h-6 w-6 text-sheraton-gold" />
                        <span className="text-xs">Team</span>
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button
                        className="w-full h-20 flex flex-col gap-2"
                        variant="outline"
                      >
                        <Settings className="h-6 w-6 text-sheraton-gold" />
                        <span className="text-xs">Settings</span>
                      </Button>
                    </Link>
                  </div>

                  {/* Active Opportunities */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sheraton-navy">
                      {roleContent[userRole].oppTitle}
                    </h3>
                    {activeOpportunities.slice(0, 2).map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="flex items-center justify-between p-3 bg-sheraton-gold/10 rounded-lg border border-sheraton-gold/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{opportunity.emoji}</div>
                          <div>
                            <h4 className="font-medium text-sheraton-navy">
                              {opportunity.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {opportunity.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="sheraton-gradient text-white"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-sheraton-gold" />
                  {roleContent[userRole].recentLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === "completion"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {activity.type === "completion" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Gift className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {activity.description}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          activity.type === "completion"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {activity.points}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Activities
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="sheraton-gradient text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {roleContent[userRole].perfLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {performanceData.currentRating}
                    </div>
                    <div className="text-white/80">
                      {userRole === "service_provider"
                        ? "Service Rating"
                        : userRole === "manager"
                        ? "Team Rating"
                        : "Member Rating"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">
                        {performanceData.tasksCompleted}
                      </div>
                      <div className="text-xs text-white/70">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {performanceData.qualityScore}%
                      </div>
                      <div className="text-xs text-white/70">Quality</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {performanceData.tasksInProgress}
                      </div>
                      <div className="text-xs text-white/70">In Progress</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-white text-sheraton-navy hover:bg-white/90">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-sheraton-gold" />
                    {roleContent[userRole].tierBenefit}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {performanceData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 text-sheraton-navy">
                      Unlock {performanceData.nextBadge}
                    </h4>
                    <div className="space-y-1">
                      {performanceData.nextTierBenefits
                        .slice(0, 3)
                        .map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-sheraton-gold" />
                            <span className="text-sm text-muted-foreground">
                              {benefit}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How to Improve Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sheraton-gold" />
                  {roleContent[userRole].earnTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskEarningActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="text-center p-4 border rounded-lg"
                    >
                      <activity.icon className="h-8 w-8 mx-auto mb-2 text-sheraton-gold" />
                      <h3 className="font-medium mb-1">{activity.activity}</h3>
                      <p className="text-sm text-muted-foreground">
                        {activity.points}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  onClick={() =>
                    isEditing ? handleSaveProfile() : setIsEditing(true)
                  }
                  className={isEditing ? "sheraton-gradient text-white" : ""}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={userData.firstName}
                      onChange={(e) => {
                        setUserData({ ...userData, firstName: e.target.value });
                        saveFieldToDatabase("firstName", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={userData.lastName}
                      onChange={(e) => {
                        setUserData({ ...userData, lastName: e.target.value });
                        saveFieldToDatabase("lastName", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => {
                        setUserData({ ...userData, email: e.target.value });
                        saveFieldToDatabase("email", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => {
                        setUserData({ ...userData, phone: e.target.value });
                        saveFieldToDatabase("phone", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={userData.birthday}
                      onChange={(e) => {
                        setUserData({ ...userData, birthday: e.target.value });
                        saveFieldToDatabase("birthday", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={userData.location}
                      onChange={(e) => {
                        setUserData({ ...userData, location: e.target.value });
                        saveFieldToDatabase("location", e.target.value);
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-sheraton-gold" />
                  Activity History & Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            activity.type === "completion"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {activity.type === "completion" ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Gift className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {activity.description}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.date), "MMM dd, yyyy")}{" "}
                            • {activity.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`font-semibold ${
                            activity.type === "completion"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {activity.points}
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-sheraton-gold" />
                  Your Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Service Preferences</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Preferred Role Type</Label>
                        <Select value={userData.preferences.roleType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">
                              Property Manager
                            </SelectItem>
                            <SelectItem value="provider">
                              Service Provider
                            </SelectItem>
                            <SelectItem value="coordinator">
                              Coordinator
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Task Category Focus</Label>
                        <Select value={userData.preferences.taskCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="maintenance">
                              Maintenance
                            </SelectItem>
                            <SelectItem value="housekeeping">
                              Housekeeping
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notification Type</Label>
                        <Select value={userData.preferences.notificationType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Notification Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tasks">Task Notifications</Label>
                        <Switch
                          id="tasks"
                          checked={userData.preferences.notifications.tasks}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reports">Report Updates</Label>
                        <Switch
                          id="reports"
                          checked={userData.preferences.notifications.reports}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alerts">System Alerts</Label>
                        <Switch
                          id="alerts"
                          checked={userData.preferences.notifications.alerts}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="newsletter">Newsletter</Label>
                        <Switch
                          id="newsletter"
                          checked={
                            userData.preferences.notifications.newsletter
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sheraton-gold" />
                  {roleContent[userRole].refTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-sheraton-gold/10 rounded-lg">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-sheraton-gold" />
                  <h3 className="text-xl font-bold mb-2">
                    {userRole === "service_provider"
                      ? "Earn 500 Points"
                      : userRole === "manager"
                      ? "Earn 750 Points"
                      : "Earn 100 Points"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {roleContent[userRole].refDesc}
                  </p>
                  <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border">
                    <code className="font-mono text-lg">
                      {generateServiceCode()}
                    </code>
                    <Button size="sm" onClick={copyServiceCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="mt-4 sheraton-gradient text-white">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Partner Invite
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-sheraton-gold">
                      8
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Partners Referred
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-sheraton-gold">
                      6
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Partners
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-sheraton-gold">
                      3,000
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Points Earned
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServicesProfilePage;
