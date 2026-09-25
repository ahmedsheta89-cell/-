/**
 * @file AudioModelRegistryService.ts
 * @module application/recitation
 * @description Catalog and audit registry of speech and alignment models.
 * Strictly distinguishes benchmarked deterministic components from unbenchmarked/experimental neural models.
 */

import {
  IAudioModelRegistry,
  AudioModelEntry,
} from '../../domain/recitation/modelRegistryTypes.ts';
import { AudioModelRegistryImpl } from './AudioModelRegistryImpl.ts';

const registryInstance = new AudioModelRegistryImpl();

export const CANONICAL_AUDIO_MODELS: AudioModelEntry[] = registryInstance.getAllModels();

export class AudioModelRegistryService implements IAudioModelRegistry {
  private readonly delegate = registryInstance;

  getAllModels(): AudioModelEntry[] {
    return this.delegate.getAllModels();
  }

  getModel(modelId: string): AudioModelEntry | undefined {
    return this.delegate.getModel(modelId);
  }

  getActiveAlignmentModel(): AudioModelEntry {
    return this.delegate.getActiveAlignmentModel();
  }

  getActiveVadModel(): AudioModelEntry {
    return this.delegate.getActiveVadModel();
  }
}
