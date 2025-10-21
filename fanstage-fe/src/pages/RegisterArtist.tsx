import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Upload, AlertCircle } from 'lucide-react';
import { useArtistRegistration } from '@/features/artistRegistration/useArtistRegistration';

const STEP_LABELS = [
  { step: 1, title: 'Artist Information', description: 'Tell us about yourself' },
  { step: 2, title: 'Social Presence', description: 'Share your social links' },
  { step: 3, title: 'Verification', description: 'Upload supporting documents' },
];

export default function RegisterArtist() {
  const {
    step,
    formData,
    updateFormField,
    goToPreviousStep,
    handleSubmit,
    isSubmitting,
    isUploadingToIPFS,
    isPending,
    isConfirming,
    transactionHash,
    receipt,
    profileImagePreview,
    hasProfileImage,
    handleProfileImageSelection,
    handleProfileImageUploadClick,
    handleRemoveProfileImage,
    profileImageInputRef,
    showNetworkWarning,
    targetNetworkName,
  } = useArtistRegistration();

  const NetworkWarning = () => {
    if (!showNetworkWarning) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            Please switch to {targetNetworkName} network to register as an artist.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Become a FanStage Artist</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join the next generation of fan-powered artists. Mint your on-chain identity,
            engage with supporters, and unlock new funding opportunities.
          </p>
        </div>

        <Card className="p-8 shadow-xl backdrop-blur bg-background/80 border border-border/40">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid gap-6 md:grid-cols-3">
              {STEP_LABELS.map(({ step: stepNumber, title, description }) => {
                const isActive = step === stepNumber;
                const isCompleted = step > stepNumber;

                return (
                  <div
                    key={title}
                    className={`rounded-xl border p-4 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : isCompleted
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isActive
                              ? 'border border-primary text-primary'
                              : 'border border-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                      </span>
                      <span className="text-xs uppercase text-muted-foreground tracking-wide">
                        Step {stepNumber}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                );
              })}
            </div>

            <NetworkWarning />

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Artist Essentials</h2>
                  <p className="text-muted-foreground">
                    Craft your public profile so fans instantly recognise your brand.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(event) => updateFormField('artistName', event.target.value)}
                      placeholder="Stage name or band name"
                      className="rounded-lg"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      This name is stored on-chain and must be unique.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Official Website (optional)</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      value={formData.portfolio}
                      onChange={(event) => updateFormField('portfolio', event.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Artist Biography</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(event) => updateFormField('bio', event.target.value)}
                    placeholder="Share your story, achievements, and artistic vision..."
                    rows={5}
                    className="rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aim for at least 50 characters so fans understand your identity.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Artist Tier</Label>
                  <RadioGroup
                    className="grid gap-4 md:grid-cols-2"
                    value={formData.tier}
                    onValueChange={(value) =>
                      updateFormField('tier', value as 'rising-star' | 'senior-star')
                    }
                  >
                    <div
                      className={`rounded-lg border p-5 transition-colors ${
                        formData.tier === 'rising-star'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <RadioGroupItem value="rising-star" className="mr-2" />
                          <span className="font-semibold">Rising Star</span>
                        </div>
                        <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                          Emerging talent
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ideal if you&apos;re building momentum with early releases and fan support.
                      </p>
                    </div>

                    <div
                      className={`rounded-lg border p-5 transition-colors ${
                        formData.tier === 'senior-star'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <RadioGroupItem value="senior-star" className="mr-2" />
                          <span className="font-semibold">Senior Star</span>
                        </div>
                        <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                          Established
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Perfect for experienced artists ready to scale fan investment.
                      </p>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Social Presence</h2>
                  <p className="text-muted-foreground">
                    Share the channels where you connect with your community.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(event) => updateFormField('twitter', event.target.value)}
                      placeholder="@yourusername"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(event) => updateFormField('instagram', event.target.value)}
                      placeholder="@yourusername"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spotify">Spotify Artist Profile</Label>
                    <Input
                      id="spotify"
                      value={formData.spotify}
                      onChange={(event) => updateFormField('spotify', event.target.value)}
                      placeholder="Your Spotify artist name"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Verification & Branding</h2>
                  <p className="text-muted-foreground">
                    Upload assets that will be embedded in your on-chain artist identity.
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Artist Profile Image
                  </Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {profileImagePreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <img
                          src={profileImagePreview}
                          alt="Artist profile preview"
                          className="h-32 w-32 rounded-full object-cover border-4 border-primary/30 shadow-md"
                        />
                        <p className="text-sm font-medium">
                          This image will appear on your artist identity NFT.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm font-medium mb-1">Upload a profile image</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or WebP up to 5MB</p>
                      </>
                    )}

                    <div className="mt-4 flex justify-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleProfileImageUploadClick}
                        className="rounded-lg"
                      >
                        {hasProfileImage ? 'Change Image' : 'Upload Image'}
                      </Button>
                      {hasProfileImage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveProfileImage}
                          className="rounded-lg"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={profileImageInputRef}
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProfileImageSelection}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    A high-quality image builds trust and recognition among new fans.
                  </p>
                </div>

                {/* <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">Upload proof of artistry (optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Share press coverage, performance clips, or demo reels to speed up review.
                  </p>
                </div> */}

                {/* <div className="bg-accent p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Your application will be reviewed within 48 hours. You&apos;ll receive an
                    email notification once verified.
                  </p>
                </div> */}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-8 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
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
                    {isUploadingToIPFS
                      ? 'Uploading to IPFS...'
                      : isPending
                        ? 'Submitting transaction...'
                        : isConfirming
                          ? 'Confirming transaction...'
                          : 'Processing...'}
                  </>
                ) : (
                  step === 3 ? 'Register on Blockchain' : 'Continue'
                )}
              </Button>
            </div>

            {transactionHash && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Transaction Status</p>
                <p className="text-xs text-muted-foreground mb-2 break-all">
                  Hash: {transactionHash}
                </p>
                {isConfirming ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    <span className="text-xs">Waiting for confirmation...</span>
                  </div>
                ) : null}
                {receipt && (
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                    <span className="text-xs text-green-600">
                      Transaction confirmed! Block: {receipt.blockNumber}
                    </span>
                  </div>
                )}
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
