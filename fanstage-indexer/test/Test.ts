import assert from "assert";
import { 
  TestHelpers,
  CampaignRegistry_CampaignCreated
} from "generated";
const { MockDb, CampaignRegistry } = TestHelpers;

describe("CampaignRegistry contract CampaignCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for CampaignRegistry contract CampaignCreated event
  const event = CampaignRegistry.CampaignCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("CampaignRegistry_CampaignCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await CampaignRegistry.CampaignCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualCampaignRegistryCampaignCreated = mockDbUpdated.entities.CampaignRegistry_CampaignCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedCampaignRegistryCampaignCreated: CampaignRegistry_CampaignCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      campaignId: event.params.campaignId,
      artist: event.params.artist,
      campaignContract: event.params.campaignContract,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualCampaignRegistryCampaignCreated, expectedCampaignRegistryCampaignCreated, "Actual CampaignRegistryCampaignCreated should be the same as the expectedCampaignRegistryCampaignCreated");
  });
});
