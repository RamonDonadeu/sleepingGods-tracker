import { KnowledgeEntryType, LocationStatus } from '@prisma/client';

export class VisitOptionDto {
  label!: string;
  outcomes!: string[];
  chosen?: boolean;
}

export class RegisterVisitDto {
  status?: LocationStatus;
  requiredKeyword?: string;
  notes?: string;
  options?: VisitOptionDto[];
  keywordsDiscovered?: string[];
  totemsFound?: string[];
  resources?: string[];
  combats?: string[];
}
