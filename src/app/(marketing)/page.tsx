import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    emoji: "📉",
    title: "Smart Weigh-Ins",
    description: "EWMA trend smoothing, body fat, measurements, photo proof. Science meets simplicity.",
  },
  {
    emoji: "🏆",
    title: "Epic Contests",
    description: "Create or join challenges. % loss, absolute, body fat, custom. You pick the rules.",
  },
  {
    emoji: "📊",
    title: "Charts That Slap",
    description: "Predicted trajectory, weekly change, comparison overlays. Data is beautiful.",
  },
  {
    emoji: "🏅",
    title: "Live Leaderboard",
    description: "Real-time rankings, momentum indicators, anonymized base-100 index. Fair & private.",
  },
  {
    emoji: "🎖️",
    title: "30+ Badges",
    description: "From First Step to Year of Discipline. XP, levels, and confetti when you earn them.",
  },
  {
    emoji: "🤖",
    title: "AI Coach",
    description: "Claude-powered weekly insights, plateau detection, and personalized motivation.",
  },
  {
    emoji: "⚡",
    title: "Smart Scales",
    description: "Auto-sync from Withings. Step on the scale, see it in the app. Magic.",
  },
  {
    emoji: "💬",
    title: "Trash Talk",
    description: "Activity feed, reactions, comments, DMs. Encourage (or roast) your friends.",
  },
  {
    emoji: "💰",
    title: "Money on the Line",
    description: "Optional buy-in via Stripe. Nothing motivates like having skin in the game.",
  },
  {
    emoji: "🔔",
    title: "Never Miss a Day",
    description: "Customizable reminders, leaderboard alerts, weekly email digest.",
  },
  {
    emoji: "📱",
    title: "Phone-First",
    description: "Responsive design, bottom nav, tap-friendly. Weigh in from anywhere.",
  },
  {
    emoji: "🔒",
    title: "Your Weight, Your Rules",
    description: "Hide exact numbers, show only %. Nobody sees what you don't want them to.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" />
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: "3s" }}>🏋️</div>
        <div className="absolute top-20 right-20 text-5xl opacity-20 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>💪</div>
        <div className="absolute bottom-10 left-1/4 text-4xl opacity-20 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>🔥</div>
        <div className="absolute bottom-20 right-1/3 text-5xl opacity-20 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}>🏆</div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span>🎉</span> Free to use. No excuses.
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            Lose Weight.
            <br />
            Win Bragging Rights.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Challenge your friends, track progress with AI smarts,
            earn badges, and prove you have more willpower than them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg shadow-purple-500/25 border-0">
                🚀 Start a Contest
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8">
                See What&apos;s Inside
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof counters */}
      <section className="py-12 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">30+</p>
              <p className="text-muted-foreground mt-1">Badges to Earn</p>
            </div>
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">4</p>
              <p className="text-muted-foreground mt-1">Contest Modes</p>
            </div>
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">100</p>
              <p className="text-muted-foreground mt-1">Base Index</p>
            </div>
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">AI</p>
              <p className="text-muted-foreground mt-1">Powered Coach</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Dead Simple</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Three steps. That&apos;s it. No PhD required.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", emoji: "🎯", title: "Create or Join", desc: "Set up a contest in 60 seconds. Share the invite code. Done." },
              { step: "2", emoji: "⚖️", title: "Step on the Scale", desc: "Log manually or auto-sync from your smart scale. We handle the math." },
              { step: "3", emoji: "🥇", title: "Win (or Learn)", desc: "Watch the leaderboard. Earn badges. Get AI coaching. Repeat." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-3xl mb-4 shadow-lg shadow-purple-500/25">
                  {item.emoji}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Crush It</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We packed every feature that matters into one beautiful app.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full hover:shadow-lg hover:shadow-purple-500/5 transition-all hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{feature.emoji}</div>
                  <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-12 text-center text-white overflow-hidden">
            <div className="absolute top-4 left-8 text-4xl opacity-30">🏆</div>
            <div className="absolute bottom-4 right-8 text-4xl opacity-30">💪</div>
            <h2 className="text-3xl font-bold mb-4 relative">Ready to Prove Yourself?</h2>
            <p className="text-lg mb-8 max-w-xl mx-auto opacity-90 relative">
              Create your first contest. Invite your crew. Let the
              weigh-ins begin.
            </p>
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 bg-white text-purple-600 hover:bg-gray-100 shadow-xl border-0">
                🚀 Let&apos;s Go
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
