import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  CheckCircle,
  Edit3,
  ExternalLink,
  Instagram,
  Link2,
  Mail,
  Save,
  Shield,
  TrendingUp,
  Twitter,
  User,
  X,
} from 'lucide-react';
import { useProfilePage } from '@/features/profile/useProfilePage';

export default function Profile() {
  const {
    isAuthenticated,
    userProfile,
    formState,
    isLoading,
    isEditing,
    isSaving,
    verifyingTwitter,
    verifyingInstagram,
    twitterVerified,
    instagramVerified,
    canEdit,
    startEditing,
    handleInputChange,
    handleSaveProfile,
    handleCancelEdit,
    handleVerifyTwitter,
    handleVerifyInstagram,
    fetchUserProfile,
    formatWalletAddress,
    goHome,
    goToDashboard,
    goToRegisterArtist,
  } = useProfilePage();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Authentication Required</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Please connect your wallet</h1>
            <p className="text-muted-foreground mb-8">
              You need to connect your wallet to view your profile.
            </p>
            <Button onClick={goHome} className="rounded-xl gradient-primary">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm font-medium">Loading Profile</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Loading your profile...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile information and preferences.
            </p>
          </div>

          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={startEditing}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={!canEdit}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveProfile}
                      size="sm"
                      className="rounded-lg gradient-primary text-primary-foreground"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {userProfile?.profileImageUrl ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <img
                      src={userProfile.profileImageUrl}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-2 border-primary/20"
                    />
                  </div>
                </div>
              ) : null}

              {userProfile ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formState.username}
                          onChange={(event) => handleInputChange('username', event.target.value)}
                          placeholder="Enter your username"
                          className="rounded-lg"
                          maxLength={256}
                        />
                      ) : (
                        <p className="font-medium">
                          {userProfile.username || <span className="text-muted-foreground">Not set</span>}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formState.email}
                          onChange={(event) => handleInputChange('email', event.target.value)}
                          placeholder="Enter your email"
                          className="rounded-lg"
                        />
                      ) : (
                        <p className="font-medium">
                          {userProfile.email || <span className="text-muted-foreground">Not set</span>}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Role
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                          {userProfile.role === 'artist' ? 'Artist' : 'Fan'}
                        </span>
                        {userProfile.artistCategory && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            {userProfile.artistCategory.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Wallet Address
                      </Label>
                      <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg border">
                        {formatWalletAddress(userProfile.walletAddress)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        value={formState.bio}
                        onChange={(event) => handleInputChange('bio', event.target.value)}
                        placeholder="Tell us about yourself..."
                        className="rounded-lg resize-none"
                        rows={3}
                        maxLength={1000}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">
                        {userProfile.bio || <span className="text-muted-foreground">No bio added yet</span>}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Social Media
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                        {twitterVerified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={formState.twitter}
                              onChange={(event) => handleInputChange('twitter', event.target.value)}
                              placeholder="@username"
                              className="rounded-lg pr-16"
                              maxLength={50}
                            />
                            {twitterVerified && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleVerifyTwitter}
                            disabled={verifyingTwitter || !formState.twitter}
                            className="rounded-lg whitespace-nowrap"
                          >
                            {verifyingTwitter ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : twitterVerified ? (
                              'Verified'
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {formState.twitter ? (
                            <>
                              <a
                                href={`https://twitter.com/@${formState.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                              >
                                @{formState.twitter.replace('@', '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {twitterVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not connected</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                        {instagramVerified && <CheckCircle className="h-3 w-3 text-pink-500" />}
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={formState.instagram}
                              onChange={(event) => handleInputChange('instagram', event.target.value)}
                              placeholder="username"
                              className="rounded-lg pr-16"
                              maxLength={50}
                            />
                            {instagramVerified && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <CheckCircle className="h-4 w-4 text-pink-500" />
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleVerifyInstagram}
                            disabled={verifyingInstagram || !formState.instagram}
                            className="rounded-lg whitespace-nowrap"
                          >
                            {verifyingInstagram ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : instagramVerified ? (
                              'Verified'
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {formState.instagram ? (
                            <>
                              <a
                                href={`https://instagram.com/${formState.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                              >
                                @{formState.instagram}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {instagramVerified && <CheckCircle className="h-4 w-4 text-pink-500" />}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not connected</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Member since{' '}
                      {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Failed to load profile</p>
                  <Button onClick={fetchUserProfile} variant="outline" className="rounded-lg">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between items-center">
            <Button variant="outline" onClick={goToDashboard} className="rounded-lg">
              Back to Dashboard
            </Button>

            {userProfile?.role === 'fan' && (
              <Button onClick={goToRegisterArtist} className="rounded-lg gradient-primary">
                Become an Artist
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
