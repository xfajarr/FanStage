import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';
import { privyApiClient } from '@/services/privyAuth';
import { UserProfile } from '@/types';

export default function RegisterArtist() {
  const { authenticated } = usePrivy();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    artistName: '',
    bio: '',
    tier: 'rising-star',
    twitter: '',
    instagram: '',
    spotify: '',
    portfolio: '',
  });

  useEffect(() => {
    if (!authenticated) {
      navigate('/');
      return;
    }

    // Check if user is already an artist
    const checkUserStatus = async () => {
      try {
        const profile = await privyApiClient.getUserProfile();
        setUserProfile(profile);
        
        if (profile.role === 'artist') {
          toast.info('You are already registered as an artist!');
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        toast.error('Failed to load user profile');
        navigate('/');
      }
    };

    checkUserStatus();
  }, [authenticated, navigate]);

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.artistName.trim()) {
          toast.error('Artist name is required');
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error('Bio is required');
          return false;
        }
        if (formData.bio.length < 50) {
          toast.error('Bio must be at least 50 characters');
          return false;
        }
        return true;
      case 2:
        // Social media is optional, but validate URLs if provided
        if (formData.portfolio && !isValidUrl(formData.portfolio)) {
          toast.error('Please enter a valid portfolio URL');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const buildSocialMediaLinks = (): string => {
    const links: string[] = [];
    
    if (formData.twitter) {
      const twitterHandle = formData.twitter.replace('@', '');
      links.push(`https://twitter.com/@${twitterHandle}`);
    }
    
    if (formData.instagram) {
      links.push(`https://instagram.com/${formData.instagram.replace('@', '')}`);
    }
    
    if (formData.spotify) {
      links.push(`https://spotify.com/artist/${formData.spotify}`);
    }
    
    if (formData.portfolio) {
      links.push(formData.portfolio);
    }
    
    return links.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // Submit artist registration
    setIsSubmitting(true);
    
    try {
      const socialMediaLinks = buildSocialMediaLinks();
      
      await privyApiClient.registerAsArtist({
        artistCategory: formData.tier === 'rising-star' ? 'rising_star' : 'senior_star',
        bio: formData.bio,
        socialMediaLinks: socialMediaLinks || undefined,
        profileImageUrl: undefined, // Use undefined instead of null for optional fields
      });
      
      toast.success('Artist registration successful! Welcome to FanStage!');
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error: unknown) {
      let errorMessage = "Failed to register as artist";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { error?: string | { message?: string; name?: string } } } }).response?.data;
        if (response?.error) {
          // Handle ZodError or other error objects
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error?.message) {
            errorMessage = response.error.message;
          } else if (response.error?.name === 'ZodError') {
            // Extract Zod validation errors
            try {
              const zodErrors = JSON.parse(response.error.message);
              errorMessage = zodErrors.map((err: { message?: string }) => err.message || 'Validation error').join(', ');
            } catch {
              errorMessage = 'Validation error occurred';
            }
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
                  disabled={isSubmitting}
                  className="rounded-lg gradient-primary text-primary-foreground"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {step === 3 ? 'Submitting...' : 'Processing...'}
                    </>
                  ) : (
                    step === 3 ? 'Submit Application' : 'Continue'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
