export class CreateCampaignDto {
  name!: string;
  notes?: string;
  players?: string[];
  didTutorial?: boolean;
  startingKeywords?: string[];
}
