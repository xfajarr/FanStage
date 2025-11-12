import { Loader2, Plus, Trash2, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
import useCreateCampaignFlow from '@/features/campaigns/useCreateCampaignFlow';

export default function CreateCampaign() {
  const {
    formState,
    tiers,
    updateFormField,
    updateTierField,
    addTier,
    removeTier,
    handleSubmit,
    resetForm,
    isUploadingToIPFS,
    isSubmitting,
    isPending,
    isConfirming,
    transactionHash,
    receipt,
    creationFee,
    fanSharePercent,
    artistSharePercent,
    isNetworkMismatched,
    userProfile,
    isProfileLoading,
    hasSufficientBalance,
    hasSufficientAllowance,
    handleApproveFee,
    isApprovePending,
    isApproveConfirming,
  } = useCreateCampaignFlow();

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-8">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm font-medium">Loading artist profile</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Preparing campaign builder...</h1>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-4">Artist access required</h1>
          <p className="text-muted-foreground">
            Please register as an artist before creating a campaign.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-bold mb-3">
              Launch a <span className="text-primary">New Campaign</span>
            </h1>
            <p className="text-muted-foreground">
              Share your story, set funding goals, and define supporter rewards to engage your fans.
            </p>
          </header>

          {isNetworkMismatched && (
            <div className="mb-6 rounded-lg border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-semibold">Wrong Network</p>
                  <p>Please switch to the Base Sepolia network before launching your campaign.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Campaign Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Introduce your project with a compelling summary to capture supporters’ attention.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(event) => updateFormField('title', event.target.value)}
                    placeholder="e.g., Debut Album: Moonlight Dreams"
                    required
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Short Summary *</Label>
                  <Textarea
                    id="summary"
                    value={formState.summary}
                    onChange={(event) => updateFormField('summary', event.target.value)}
                    placeholder="Describe your campaign in 2-3 sentences (max 256 characters)."
                    maxLength={256}
                    required
                    className="rounded-lg min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formState.summary.length}/256 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="story">Full Story</Label>
                  <Textarea
                    id="story"
                    value={formState.story}
                    onChange={(event) => updateFormField('story', event.target.value)}
                    placeholder="Share your inspiration, roadmap, and why fans should support you."
                    className="rounded-lg min-h-40"
                  />
                </div>

                <div>
                  <Label htmlFor="coverImageUrl">Cover Image</Label>
                  <ImageUpload
                    value={formState.coverImageUrl}
                    onChange={(url) => updateFormField('coverImageUrl', url)}
                    disabled={isSubmitting || isUploadingToIPFS}
                    maxSize={10}
                    id="cover-image-upload"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image or provide a URL. Automatically uploaded to IPFS for decentralized storage.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Funding & Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Define how much you aim to raise, when the campaign ends, and how revenue is shared.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="targetAmount">Funding Goal (IDRX) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.targetAmount}
                    onChange={(event) => updateFormField('targetAmount', event.target.value)}
                    placeholder="5000"
                    required
                    className="rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the total IDRX you aim to raise.
                  </p>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formState.deadline}
                    onChange={(event) => updateFormField('deadline', event.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="fanSharePercent">Supporter Share (%) *</Label>
                  <Input
                    id="fanSharePercent"
                    type="number"
                    min="1"
                    max="50"
                    value={formState.fanSharePercent}
                    onChange={(event) => updateFormField('fanSharePercent', event.target.value)}
                    className="rounded-lg"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supporters can receive up to 50% of future revenue.
                  </p>
                </div>

                <div>
                  <Label>Artist Share (%)</Label>
                  <Input value={artistSharePercent} readOnly className="rounded-lg bg-muted" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="artistTokenName">Artist Token Name *</Label>
                  <Input
                    id="artistTokenName"
                    value={formState.artistTokenName}
                    onChange={(event) => updateFormField('artistTokenName', event.target.value)}
                    placeholder="e.g., Moonlight Token"
                    required
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="campaignNftName">Campaign NFT Name *</Label>
                  <Input
                    id="campaignNftName"
                    value={formState.campaignNftName}
                    onChange={(event) => updateFormField('campaignNftName', event.target.value)}
                    placeholder="e.g., Moonlight Pass"
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Supporter Tiers</h2>
                  <p className="text-sm text-muted-foreground">
                    Define contribution thresholds and rewards. Thresholds and profit shares must
                    increase by tier.
                  </p>
                </div>
                <Button type="button" variant="outline" className="rounded-lg" onClick={addTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              <div className="space-y-6">
                {tiers.map((tier, index) => (
                  <Card key={index} className="p-4 border-2 border-dashed border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Tier {index + 1}</h3>
                      {tiers.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTier(index)}
                          className="rounded-lg text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Tier Name *</Label>
                        <Input
                          value={tier.name}
                          onChange={(event) => updateTierField(index, 'name', event.target.value)}
                          placeholder="e.g., Silver Supporter"
                          required
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <Label>Minimum Investment (IDRX) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.threshold}
                          onChange={(event) => updateTierField(index, 'threshold', event.target.value)}
                          placeholder="100"
                          required
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Profit Weight (%) *</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={tier.profitPercent}
                          onChange={(event) =>
                            updateTierField(index, 'profitPercent', event.target.value)
                          }
                          placeholder="5"
                          required
                          className="rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Percentage weight used to split supporter revenue pool.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Benefits *</Label>
                      <Textarea
                        value={tier.benefits}
                        onChange={(event) => updateTierField(index, 'benefits', event.target.value)}
                        placeholder="Describe the benefits supporters receive at this tier."
                        required
                        className="rounded-lg min-h-24"
                      />
                    </div>

                    <div>
                      <Label>Tier Badge Image</Label>
                      <ImageUpload
                        value={tier.imageUrl}
                        onChange={(url) => updateTierField(index, 'imageUrl', url)}
                        disabled={isSubmitting || isUploadingToIPFS}
                        maxSize={5}
                        id={`tier-image-${index}`}
                        compact={true}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload an image for this tier's NFT badge. Optional but recommended.
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Launch</h2>
              <p className="text-sm text-muted-foreground">
                Review your details carefully. You&apos;ll sign a transaction to deploy your
                campaign smart contract.
              </p>

              {transactionHash && (
                <div className="rounded-md border border-border bg-muted p-4 text-sm space-y-2">
                  <p className="font-medium">Transaction Submitted</p>
                  <p className="font-mono break-all text-xs">{transactionHash}</p>
                  {isConfirming ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Awaiting confirmation...
                    </div>
                  ) : null}
                  {receipt && (
                    <div className="text-xs text-emerald-600">
                      Confirmed in block {receipt.blockNumber?.toString() ?? 'unknown'}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {/* Show approval status if needed */}
                {!hasSufficientAllowance && Number(creationFee) > 0 && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Step 1: Approve Creation Fee
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      First, approve the Campaign Registry to spend {creationFee} IDRX for the creation fee.
                    </p>
                  </div>
                )}

                {hasSufficientAllowance && Number(creationFee) > 0 && (
                  <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3 text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                      <span className="text-green-600">✓</span> Fee Approved
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      You can now launch your campaign.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    onClick={resetForm}
                    disabled={isSubmitting || isApprovePending || isApproveConfirming}
                  >
                    Reset Form
                  </Button>

                  {/* Show Approve button if allowance is insufficient */}
                  {!hasSufficientAllowance && Number(creationFee) > 0 ? (
                    <Button
                      type="button"
                      onClick={handleApproveFee}
                      disabled={!hasSufficientBalance || isApprovePending || isApproveConfirming}
                      className="rounded-lg gradient-primary text-primary-foreground"
                    >
                      {isApprovePending || isApproveConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isApprovePending ? 'Approving...' : 'Confirming...'}
                        </>
                      ) : (
                        <>
                          Approve Fee ({creationFee} IDRX)
                        </>
                      )}
                    </Button>
                  ) : (
                    /* Show Launch button if allowance is sufficient */
                    <Button
                      type="submit"
                      disabled={isSubmitting || !hasSufficientBalance || !hasSufficientAllowance}
                      className="rounded-lg gradient-primary text-primary-foreground"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isUploadingToIPFS
                            ? 'Uploading metadata...'
                            : isPending
                            ? 'Submitting transaction...'
                            : isConfirming
                            ? 'Waiting for confirmation...'
                            : 'Processing...'}
                        </>
                      ) : (
                        'Launch Campaign'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
