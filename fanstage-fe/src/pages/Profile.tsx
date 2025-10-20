import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { privyApiClient } from '../services/privyAuth';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Link2, Calendar, Edit3, Save, X, Shield, TrendingUp, Twitter, Instagram, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/layout/Navigation';

export default function Profile() {
  const { authenticated, user } = usePrivy();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    twitter: '',
    instagram: '',
  });
  const [verifyingTwitter, setVerifyingTwitter] = useState(false);
  const [verifyingInstagram, setVerifyingInstagram] = useState(false);
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [instagramVerified, setInstagramVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await privyApiClient.getUserProfile();
      setUserProfile(profile);
      // Parse social media links from the existing format
      const socialLinks = profile.socialMediaLinks || '';
      const twitterMatch = socialLinks.match(/twitter\.com\/@?([^\\s\\n]+)/i);
      const instagramMatch = socialLinks.match(/instagram\.com\/([^\\s\\n]+)/i);
      
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        twitter: twitterMatch ? twitterMatch[1] : '',
        instagram: instagramMatch ? instagramMatch[1] : '',
      });
      
      setTwitterVerified(!!twitterMatch);
      setInstagramVerified(!!instagramMatch);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchUserProfile();
    } else {
      navigate('/');
    }
  }, [authenticated, navigate]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Validate email if provided
      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      // Combine social media links into the format expected by backend
      let socialMediaLinks = '';
      if (formData.twitter) {
        socialMediaLinks += `https://twitter.com/@${formData.twitter.replace('@', '')}\n`;
      }
      if (formData.instagram) {
        socialMediaLinks += `https://instagram.com/${formData.instagram}\n`;
      }

      const updatedProfile = await privyApiClient.updateProfile({
        username: formData.username || null,
        email: formData.email || null,
        bio: formData.bio || null,
        socialMediaLinks: socialMediaLinks.trim() || null,
      });

      setUserProfile(updatedProfile);
      setIsEditing(false);
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
      
      console.log('✅ Profile updated:', updatedProfile);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error) 
        : "Failed to update profile. Please try again.";
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      const socialLinks = userProfile.socialMediaLinks || '';
      const twitterMatch = socialLinks.match(/twitter\.com\/@?([^\\s\\n]+)/i);
      const instagramMatch = socialLinks.match(/instagram\.com\/([^\\s\\n]+)/i);
      
      setFormData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        bio: userProfile.bio || '',
        twitter: twitterMatch ? twitterMatch[1] : '',
        instagram: instagramMatch ? instagramMatch[1] : '',
      });
    }
    setIsEditing(false);
  };

  const handleVerifyTwitter = async () => {
    setVerifyingTwitter(true);
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTwitterVerified(true);
      toast({
        title: "Twitter Verified!",
        description: "Your Twitter account has been successfully verified.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify your Twitter account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingTwitter(false);
    }
  };

  const handleVerifyInstagram = async () => {
    setVerifyingInstagram(true);
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setInstagramVerified(true);
      toast({
        title: "Instagram Verified!",
        description: "Your Instagram account has been successfully verified.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify your Instagram account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingInstagram(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!authenticated) {
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
            <p className="text-muted-foreground mb-8">You need to connect your wallet to view your profile</p>
            <Button onClick={() => navigate('/')} className="rounded-xl gradient-primary">
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your profile information and preferences</p>
          </div>

          {/* Profile Card */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-medium">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="sm"
                      className="rounded-lg gradient-primary"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
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
            
            <CardContent className="p-6">
              {userProfile ? (
                <div className="space-y-6">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
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

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                          className="rounded-lg"
                        />
                      ) : (
                        <p className="font-medium">
                          {userProfile.email || <span className="text-muted-foreground">Not set</span>}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Role
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                          {userProfile.role === 'artist' ? '🎨 Artist' : '👤 Fan'}
                        </span>
                        {userProfile.artistCategory && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            {userProfile.artistCategory.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Wallet Address */}
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

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
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

                  {/* Social Media Links */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Social Media
                    </Label>
                    
                    {/* Twitter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                        {twitterVerified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={formData.twitter}
                              onChange={(e) => handleInputChange('twitter', e.target.value)}
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
                            disabled={verifyingTwitter || !formData.twitter}
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
                          {formData.twitter ? (
                            <>
                              <a
                                href={`https://twitter.com/@${formData.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                              >
                                @{formData.twitter.replace('@', '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {twitterVerified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not connected</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                        {instagramVerified && (
                          <CheckCircle className="h-3 w-3 text-pink-500" />
                        )}
                      </Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={formData.instagram}
                              onChange={(e) => handleInputChange('instagram', e.target.value)}
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
                            disabled={verifyingInstagram || !formData.instagram}
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
                          {formData.instagram ? (
                            <>
                              <a
                                href={`https://instagram.com/${formData.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                              >
                                @{formData.instagram}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {instagramVerified && (
                                <CheckCircle className="h-4 w-4 text-pink-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not connected</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Image */}
                  {userProfile.profileImageUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Profile Image</Label>
                      <div className="flex items-center gap-4">
                        <img 
                          src={userProfile.profileImageUrl} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
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

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="rounded-lg"
            >
              ← Back to Dashboard
            </Button>
            
            {userProfile?.role === 'fan' && (
              <Button 
                onClick={() => navigate('/register-artist')} 
                className="rounded-lg gradient-primary"
              >
                Become an Artist →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}