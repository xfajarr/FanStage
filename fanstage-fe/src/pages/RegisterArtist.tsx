import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { CheckCircle, Upload } from 'lucide-react';

export default function RegisterArtist() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    artistName: '',
    bio: '',
    tier: 'rising-star',
    twitter: '',
    instagram: '',
    spotify: '',
    portfolio: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      toast.success('Application submitted successfully! We will review it shortly.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Become an <span className="text-primary">Artist</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join FanStage and connect directly with your fans
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    step >= s
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 h-0.5 mx-2 transition-all ${
                      step > s ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

                  <div>
                    <Label htmlFor="artistName">Artist Name *</Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) =>
                        setFormData({ ...formData, artistName: e.target.value })
                      }
                      placeholder="Your stage name"
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself and your music"
                      required
                      className="rounded-lg min-h-32"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Artist Tier *</Label>
                    <RadioGroup
                      value={formData.tier}
                      onValueChange={(value) => setFormData({ ...formData, tier: value })}
                    >
                      <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary transition-colors">
                        <RadioGroupItem value="rising-star" id="rising-star" />
                        <div className="flex-1">
                          <Label htmlFor="rising-star" className="font-semibold cursor-pointer">
                            Rising Star
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Access seed capital for production and career development
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary transition-colors">
                        <RadioGroupItem value="senior" id="senior" />
                        <div className="flex-1">
                          <Label htmlFor="senior" className="font-semibold cursor-pointer">
                            Senior Artist
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Access to funds without label pressure, full creative control
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Social Media Links</h2>

                  <div>
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@yourusername"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      placeholder="@yourusername"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="spotify">Spotify Artist Profile</Label>
                    <Input
                      id="spotify"
                      value={formData.spotify}
                      onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
                      placeholder="Your Spotify artist name"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolio">Portfolio/Website</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      value={formData.portfolio}
                      onChange={(e) =>
                        setFormData({ ...formData, portfolio: e.target.value })
                      }
                      placeholder="https://yourwebsite.com"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Verification Documents</h2>

                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">
                      Upload identification document
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or PDF up to 10MB
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">Upload proof of artistry</p>
                    <p className="text-xs text-muted-foreground">
                      Previous releases, press coverage, or performance videos
                    </p>
                  </div>

                  <div className="bg-accent p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your application will be reviewed within 48 hours. You'll receive an
                      email notification once verified.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between mt-8 pt-8 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="rounded-lg"
                >
                  Previous
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg gradient-primary text-primary-foreground"
                >
                  {step === 3 ? 'Submit Application' : 'Continue'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
