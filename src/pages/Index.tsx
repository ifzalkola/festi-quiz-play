import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { useEffect } from "react";
import { 
  Sparkles, 
  Users, 
  Zap, 
  Trophy, 
  Clock, 
  Target,
  Crown,
  Play,
  Shield,
  LogOut
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, signOut } = useAuth();
  const { clearRoomState } = useQuiz();
  
  // Clear any existing room state when landing on the home page
  useEffect(() => {
    clearRoomState();
  }, [clearRoomState]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Quiz Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{currentUser?.userId}</span>
            </div>
            {isAdmin() && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Real-time Multiplayer Quiz Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
                Quiz. Compete. Win.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create engaging quiz rooms, invite players, and compete in real-time. 
              Perfect for education, team building, or just having fun!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" variant="hero" className="group" onClick={() => navigate('/create')}>
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Create a Quiz Room
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/join')}>
                Join with Code
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/how-to-play')}>
                <Target className="w-5 h-5 mr-2" />
                How to Play
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Why Choose Our Platform?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Packed with features that make hosting and playing quizzes a breeze
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-time Gameplay"
              description="Experience lightning-fast question delivery and instant score updates with our WebSocket technology"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Multiplayer Support"
              description="Host quiz rooms with up to 100+ concurrent players. Perfect for large events!"
            />
            <FeatureCard
              icon={<Trophy className="w-8 h-8" />}
              title="Dynamic Leaderboards"
              description="Live scoring with time-based, order-based, and first-answer scoring modes"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Flexible Timing"
              description="Set custom time limits per question and control the pace of your quiz"
            />
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Multiple Question Types"
              description="True/False, Multiple Choice, and Text Input questions to keep it engaging"
            />
            <FeatureCard
              icon={<Crown className="w-8 h-8" />}
              title="Easy Management"
              description="Intuitive dashboard for hosts to create, edit, and manage quiz rooms effortlessly"
            />
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're hosting, playing, or managing - we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <RoleCard
              title="Quiz Hosts"
              description="Create custom quiz rooms, upload questions via CSV, configure scoring rules, and control the entire game flow"
              features={[
                "Easy room setup",
                "CSV import support",
                "Live control panel",
                "Custom scoring rules"
              ]}
              gradient="from-primary to-secondary"
            />
            <RoleCard
              title="Players"
              description="Join with a simple code, answer questions in real-time, and compete on the live leaderboard"
              features={[
                "One-click join",
                "Mobile-friendly",
                "Live scoring",
                "Auto-reconnect"
              ]}
              gradient="from-secondary to-primary"
            />
            <RoleCard
              title="Admins"
              description="Oversee all quiz rooms, manage users, moderate games, and ensure everything runs smoothly"
              features={[
                "Full oversight",
                "Room management",
                "User moderation",
                "Analytics dashboard"
              ]}
              gradient="from-primary via-secondary to-primary"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Create your first quiz room in seconds and invite your friends to join the fun
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="hero" onClick={() => navigate('/create')}>
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/join')}>
              Join a Quiz
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>© 2025 Fun Quiz Platform. Built with ❤️ for quiz enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/50">
    <CardContent className="pt-6 space-y-4">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const RoleCard = ({ 
  title, 
  description, 
  features, 
  gradient 
}: { 
  title: string; 
  description: string; 
  features: string[];
  gradient: string;
}) => (
  <Card className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden border-border/50 hover:border-primary/50">
    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
    <CardContent className="pt-6 space-y-6">
      <div className="space-y-3">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default Index;
