import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { LanguageProvider, useLanguage } from "./hooks/use-language";
import { FontSizeProvider } from "./hooks/use-font-size";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useMedicationReminders } from "./hooks/useMedicationReminders";

// Loading fallback component - must be rendered inside LanguageProvider
function PageLoader() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
}

// Public Pages - Lazy loaded
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Logout = lazy(() => import("@/pages/Logout"));
const Landing = lazy(() => import("@/pages/Landing"));
const Subscribe = lazy(() => import("@/pages/Subscribe"));

// Protected Pages - Health & Wellness - Lazy loaded
const Nutrition = lazy(() => import("@/pages/Nutrition"));
const MealPlanner = lazy(() => import("@/pages/MealPlanner"));
const HealthMonitoring = lazy(() => import("@/pages/HealthMonitoring"));
const Predictions = lazy(() => import("@/pages/Predictions"));
const HealthReport = lazy(() => import("@/pages/HealthReport"));
const HealthJournal = lazy(() => import("@/pages/HealthJournal"));
const Emergency = lazy(() => import("@/pages/Emergency"));
const Medications = lazy(() => import("@/pages/Medications"));

// Protected Pages - Smart Tools - Lazy loaded
const AIAssistant = lazy(() => import("@/pages/AIAssistant"));
const SymptomChecker = lazy(() => import("@/pages/SymptomChecker"));
const DrugInteractions = lazy(() => import("@/pages/DrugInteractions"));
const FoodDatabase = lazy(() => import("@/pages/FoodDatabase"));
const BMICalculator = lazy(() => import("@/pages/BMICalculator"));

// Protected Pages - Coaching - Lazy loaded
const CoachingConsultation = lazy(() => import("@/pages/CoachingConsultation"));
const CoachingSessions = lazy(() => import("@/pages/CoachingSessions"));
const CoachingChat = lazy(() => import("@/pages/CoachingChat"));
const DoctorDashboard = lazy(() => import("@/pages/DoctorDashboard"));

// Protected Pages - Secondary - Lazy loaded
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const WaterTracking = lazy(() => import("@/pages/WaterTracking"));

// Admin
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminPractitioners = lazy(() => import("@/pages/AdminPractitioners"));
const AdminClientCustomization = lazy(() => import("@/pages/AdminClientCustomization"));

function MedicationReminderActivator() {
  const { language } = useLanguage();
  useMedicationReminders(language);
  return null;
}

function hasActiveAccess(user: any) {
  if (!user) return false;
  if (user.subscriptionStatus === "active") {
    if (!user.subscriptionEndsAt) return true;
    const endsAt = new Date(user.subscriptionEndsAt);
    return endsAt.getTime() > Date.now();
  }
  if (user.subscriptionStatus === "trial") {
    const endsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    return !!endsAt && endsAt.getTime() > Date.now();
  }
  return false;
}

function RootRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Suspense fallback={<PageLoader />}><Landing /></Suspense>;
  if (hasActiveAccess(user)) return <Suspense fallback={<PageLoader />}><AppLayout><MedicationReminderActivator /><Dashboard /></AppLayout></Suspense>;
  return <Redirect to="/subscribe" />;
}

function SubscribeRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (hasActiveAccess(user)) return <Redirect to="/" />;
  return <Suspense fallback={<PageLoader />}><Subscribe /></Suspense>;
}

function ProtectedRouter() {
  return (
    <AppLayout>
      <MedicationReminderActivator />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Health & Wellness */}
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/meal-planner" component={MealPlanner} />
          <Route path="/health" component={HealthMonitoring} />
          <Route path="/medications" component={Medications} />
          <Route path="/predictions" component={Predictions} />
          <Route path="/health-report" component={HealthReport} />
          <Route path="/health-journal" component={HealthJournal} />
          <Route path="/emergency" component={Emergency} />

          {/* Smart Tools */}
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/symptom-checker" component={SymptomChecker} />
          <Route path="/drug-interactions" component={DrugInteractions} />
          <Route path="/food-database" component={FoodDatabase} />
          <Route path="/bmi-calculator" component={BMICalculator} />

          {/* Coaching */}
          <Route path="/doctor" component={DoctorDashboard} />
          <Route path="/coaching/consultation" component={CoachingConsultation} />
          <Route path="/coaching/sessions" component={CoachingSessions} />
          <Route path="/coaching/chat" component={CoachingChat} />

          {/* User Settings */}
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/water" component={WaterTracking} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function AdminRoute() {
  const { isAuthenticated, isAdmin, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to={role === "doctor" || role === "coach" ? "/doctor" : "/"} />;
  return <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>;
}

function AdminPractitionersRoute() {
  const { isAuthenticated, isAdmin, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to={role === "doctor" || role === "coach" ? "/doctor" : "/"} />;
  return <Suspense fallback={<PageLoader />}><AdminPractitioners /></Suspense>;
}

function AdminClientCustomizationRoute() {
  const { isAuthenticated, isAdmin, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to={role === "doctor" || role === "coach" ? "/doctor" : "/"} />;
  return <Suspense fallback={<PageLoader />}><AdminClientCustomization /></Suspense>;
}

function PractitionerClientCustomizationRoute() {
  const { isAuthenticated, isAdmin, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (isAdmin) return <Redirect to="/admin/customization" />;
  if (role !== "doctor" && role !== "coach") return <Redirect to="/" />;
  return <Suspense fallback={<PageLoader />}><AdminClientCustomization /></Suspense>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={RootRoute} />

        {/* Public Auth Routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/logout" component={Logout} />
        <Route path="/subscribe" component={SubscribeRoute} />

        {/* Admin Route */}
        <Route path="/admin/customization" component={AdminClientCustomizationRoute} />
        <Route path="/doctor/customization" component={PractitionerClientCustomizationRoute} />
        <Route path="/admin/practitioners" component={AdminPractitionersRoute} />
        <Route path="/admin" component={AdminRoute} />

        {/* Protected Routes - Wrapped with PrivateRoute */}
        <Route component={(props) => <PrivateRoute component={ProtectedRouter} {...(props as unknown as Record<string, unknown>)} />} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <FontSizeProvider>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
              </AuthProvider>
            </TooltipProvider>
          </FontSizeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
