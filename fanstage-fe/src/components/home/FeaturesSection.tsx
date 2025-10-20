import { Coins, Trophy, Users, Zap } from 'lucide-react';

const features = [
  {
    icon: Coins,
    title: 'Fan Tokens & NFTs',
    description: 'Purchase artist tokens and receive exclusive NFTs with real utility and benefits.',
  },
  {
    icon: Trophy,
    title: 'Crowdfund Campaigns',
    description: 'Support albums, tours, and music videos while earning profit-sharing rewards.',
  },
  {
    icon: Zap,
    title: 'Stake & Earn Yield',
    description: 'Stake artist tokens to earn competitive yields and unlock exclusive perks.',
  },
  {
    icon: Users,
    title: 'Official Fan Clubs',
    description: 'Join exclusive communities with NFT membership passes and special access.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How <span className="text-primary">FanStage</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A revolutionary platform connecting artists and fans through Web3 technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-soft hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-accent group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
