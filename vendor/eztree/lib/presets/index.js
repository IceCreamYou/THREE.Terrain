import ashSmall from './ash_small.json' with { type: 'json' };
import ashMedium from './ash_medium.json' with { type: 'json' };
import ashLarge from './ash_large.json' with { type: 'json' };
import aspenSmall from './aspen_small.json' with { type: 'json' };
import aspenMedium from './aspen_medium.json' with { type: 'json' };
import aspenLarge from './aspen_large.json' with { type: 'json' };
import bush1 from './bush_1.json' with { type: 'json' };
import bush2 from './bush_2.json' with { type: 'json' };
import bush3 from './bush_3.json' with { type: 'json' };
import oakSmall from './oak_small.json' with { type: 'json' };
import oakMedium from './oak_medium.json' with { type: 'json' };
import oakLarge from './oak_large.json' with { type: 'json' };
import pineSmall from './pine_small.json' with { type: 'json' };
import pineMedium from './pine_medium.json' with { type: 'json' };
import pineLarge from './pine_large.json' with { type: 'json' };
import trellis from './trellis.json' with { type: 'json' };
import TreeOptions from '../options.js';

export const TreePreset = {
  'Ash Small': ashSmall,
  'Ash Medium': ashMedium,
  'Ash Large': ashLarge,
  'Aspen Small': aspenSmall,
  'Aspen Medium': aspenMedium,
  'Aspen Large': aspenLarge,
  'Bush 1': bush1,
  'Bush 2': bush2,
  'Bush 3': bush3,
  'Oak Small': oakSmall,
  'Oak Medium': oakMedium,
  'Oak Large': oakLarge,
  'Pine Small': pineSmall,
  'Pine Medium': pineMedium,
  'Pine Large': pineLarge,
  'Trellis': trellis,
};

/**
 * @param {string} name The name of the preset to load
 * @returns {TreeOptions}
 */
export function loadPreset(name) {
  const preset = TreePreset[name];
  return preset ? structuredClone(preset) : new TreeOptions();
}
