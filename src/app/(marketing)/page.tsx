import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale,
  Trophy,
  TrendingDown,
  Users,
  Award,
  Brain,
  Bell,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Smart Weigh-Ins",
    description:
      "Log daily or weekly weigh-ins with trend smoothing (EWMA), body fat tracking, measurements, and photo proof.",
  },
  {
    icon: Trophy,
    title: "Competitive Contests",
    description:
      "Create or join weight loss contests with friends. Multiple types: % loss, absolute, body fat, custom metrics.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Interactive charts with predicted trajectory, weekly rate of change, body composition tracking, and comparison views.",
  },
  {
    icon: Users,
    title: "Real-time Leaderboard",
    description:
      "Live rankings updated instantly. Momentum indicators, streak tracking, and privacy-respecting displays.",
  },
  {
    icon: Award,
    title: "30+ Achievements",
    description:
      "Earn badges from Common to Legendary. XP system with levels, weekly challenges, and confetti celebrations.",
  },
  {
    icon: Brain,
    title: "AI Coaching",
    description:
      "Personalized weekly insights powered by Claude AI. Plateau detection, motivation, and data-driven recommendations.",
  },
  {
    icon: Zap,
    title: "Connected Scales",
    description:
      "Auto-sync from Withings, Fitbit, and Garmin smart scales. Apple Health and Google Fit integration.",
  },
  {
    icon: Heart,
    title: "Social Features",
    description:
      "Activity feed, reactions, comments, and direct messaging. Encourage each other on the journey.",
  },
  {
    icon: Shield,
    title: "Stakes & Prizes",
    description:
      "Optional entry fees with Stripe. Prize pool distribution, penalty tracking, and secure escrow.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Customizable weigh-in reminders, leaderboard updates, achievement alerts, and weekly email digests.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Responsive interface with bottom navigation, touch-friendly charts, and PWA-ready architecture.",
  },
  {
    icon: TrendingDown,
    title: "Privacy Controls",
    description:
      "Hide exact weight, show percentages only, control photo visibility. Your data, your rules.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            The Ultimate
            <br />
            <span className="text-primary">Weight Contest</span> Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Compete with friends, track your progress with AI-powered analytics,
            earn achievements, and reach your goals together. The most complete
            weight contest app on the market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8">
                Start Free Contest
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8">
                See Features
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free to use. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">30+</p>
              <p className="text-muted-foreground">Achievements</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4</p>
              <p className="text-muted-foreground">Contest Types</p>
            </div>
            <div>
              <p className="text-3xl font-bold">5+</p>
              <p className="text-muted-foreground">Health Integrations</p>
            </div>
            <div>
              <p className="text-3xl font-bold">AI</p>
              <p className="text-muted-foreground">Powered Coaching</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Win</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From smart analytics to social features, WeightContest has every tool
              to keep you and your group motivated.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardContent className="p-6">
                  <feature.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Create or Join</h3>
              <p className="text-muted-foreground">
                Set up a contest in minutes or join one with an invite code. Choose your contest type
                and rules.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Log & Track</h3>
              <p className="text-muted-foreground">
                Weigh in daily or weekly. See your trend, earn streaks, and watch the leaderboard
                update in real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Win Together</h3>
              <p className="text-muted-foreground">
                Encourage each other, earn achievements, get AI coaching, and celebrate reaching your
                goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Competing?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Create your first contest in under a minute. Invite your friends and start your
            transformation journey together.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
