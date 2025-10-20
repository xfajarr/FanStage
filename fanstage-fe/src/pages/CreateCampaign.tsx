import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function CreateCampaign() {
  const [rewards, setRewards] = useState([
    { name: '', minInvestment: '', benefits: [''] },
  ]);

  const handleAddReward = () => {
    setRewards([...rewards, { name: '', minInvestment: '', benefits: [''] }]);
  };

  const handleRemoveReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const handleAddBenefit = (rewardIndex: number) => {
    const newRewards = [...rewards];
    newRewards[rewardIndex].benefits.push('');
    setRewards(newRewards);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Campaign created successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Create <span className="text-primary">Campaign</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Launch a crowdfunding campaign to bring your project to life
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Debut Album: Moonlight Dreams"
                    required
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your campaign and what you plan to create..."
                    required
                    className="rounded-lg min-h-32"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select required>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="album">Album</SelectItem>
                        <SelectItem value="concert">Concert</SelectItem>
                        <SelectItem value="tour">Tour</SelectItem>
                        <SelectItem value="music-video">Music Video</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="goal">Funding Goal (USD) *</Label>
                    <Input
                      id="goal"
                      type="number"
                      placeholder="50000"
                      required
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input id="endDate" type="date" required className="rounded-lg" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cover">Cover Image *</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">Upload campaign cover image</p>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG up to 5MB, recommended 1200x600px
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profit Sharing */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Profit Sharing</h2>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define how profits will be distributed between you and your supporters
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fanShare">Supporter Share (%) *</Label>
                    <Input
                      id="fanShare"
                      type="number"
                      placeholder="30"
                      min="0"
                      max="100"
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="artistShare">Artist Share (%) *</Label>
                    <Input
                      id="artistShare"
                      type="number"
                      placeholder="70"
                      min="0"
                      max="100"
                      required
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Reward Tiers */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Reward Tiers</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddReward}
                  className="rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              <div className="space-y-6">
                {rewards.map((reward, index) => (
                  <Card key={index} className="p-4 border-2">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold">Tier {index + 1}</h3>
                      {rewards.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveReward(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tier Name *</Label>
                          <Input
                            placeholder="e.g., Supporter"
                            required
                            className="rounded-lg"
                          />
                        </div>
                        <div>
                          <Label>Minimum Investment (USD) *</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            required
                            className="rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Benefits</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddBenefit(index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {reward.benefits.map((_, benefitIndex) => (
                            <Input
                              key={benefitIndex}
                              placeholder="Enter benefit..."
                              className="rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" className="rounded-lg">
                Save as Draft
              </Button>
              <Button
                type="submit"
                className="rounded-lg gradient-primary text-primary-foreground"
              >
                Launch Campaign
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
