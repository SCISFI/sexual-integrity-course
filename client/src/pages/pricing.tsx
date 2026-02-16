import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, BookOpen, Shield } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">The Integrity Protocol</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Sign In</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. Our 16-week program combines proven 
            CBT and ACT techniques to support your journey toward sexual integrity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="relative" data-testid="card-pricing-therapist">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <Badge variant="secondary">For Mentors</Badge>
              </div>
              <CardTitle className="text-2xl">Mentor Access</CardTitle>
              <CardDescription>
                Full platform access to manage and monitor your clients' progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Unlimited client management</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Real-time progress monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Client check-in data access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Unique access code for client registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/register/therapist" className="w-full">
                <Button className="w-full" size="lg" data-testid="button-register-therapist">
                  Get Started as Mentor
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="relative" data-testid="card-pricing-client">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <Badge variant="secondary">For Clients</Badge>
              </div>
              <CardTitle className="text-2xl">Client Access</CardTitle>
              <CardDescription>
                Weekly access to the 16-week Integrity Protocol curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">$14.99</span>
                <span className="text-muted-foreground">/week</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>16 weeks of structured content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>CBT techniques (weeks 1-8)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>ACT exercises (weeks 9-16)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Daily self-monitoring tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>Mentor-guided progress tracking</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/register/client" className="w-full">
                <Button className="w-full" size="lg" variant="outline" data-testid="button-register-client">
                  Get Started as Client
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto" data-testid="card-special-pricing">
            <CardHeader>
              <CardTitle>Special Pricing Available</CardTitle>
              <CardDescription>
                We offer discounted rates for qualifying organizations and individuals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have a promo code or qualify for special pricing (non-profits, 
                group practices, or financial hardship), enter your code during checkout 
                or contact us to learn more about available discounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button variant="outline" data-testid="button-have-code">
                    I Have a Promo Code
                  </Button>
                </Link>
                <a href="mailto:support@example.com">
                  <Button variant="ghost" data-testid="button-contact-pricing">
                    Contact for Special Pricing
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How does the 16-week program work?</h3>
              <p className="text-muted-foreground">
                Each week, a new module unlocks 7 days after the previous one becomes available. 
                This pacing ensures you have time to fully engage with each lesson before moving on.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do I need a mentor to participate?</h3>
              <p className="text-muted-foreground">
                Yes, clients register using an access code provided by their mentor. This ensures 
                you have dedicated support throughout your journey.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can my mentor waive the weekly fees?</h3>
              <p className="text-muted-foreground">
                Yes, your mentor or administrator can request fee waivers for specific weeks or 
                the entire program based on your circumstances.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and Apple Pay/Google Pay through 
                our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>The Integrity Protocol - Supporting your journey toward wholeness</p>
        </div>
      </footer>
    </div>
  );
}
