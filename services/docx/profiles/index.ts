import type { DocumentProfileId } from '../layout/types';
import { LEGACY_DOCUMENT_PROFILE } from './legacy';
import { createPublisherDocumentProfile } from './publisher';

export type {
  CalloutKind,
  CalloutStyleToken,
  DocumentStyleProfile,
  FontFamilySet,
  HeadingStyleToken,
  ParagraphStyleToken,
  TableStyleToken,
} from './types';

export const getDocumentProfile = (id: DocumentProfileId) =>
  id === 'technical-legacy'
    ? LEGACY_DOCUMENT_PROFILE
    : createPublisherDocumentProfile(id);
