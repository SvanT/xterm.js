/**
 * Copyright (c) 2017 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { generateConfig, configEquals } from './CharAtlasUtils';
import { WebglCharAtlas } from './WebglCharAtlas';
import { ICharAtlasConfig } from './Types';
import { Terminal } from 'xterm';
import { IColorSet } from 'browser/Types';

interface ICharAtlasCacheEntry {
  atlas: WebglCharAtlas;
  config: ICharAtlasConfig;
  ownedBy: WeakRef<Terminal>[];
}

const charAtlasCache: ICharAtlasCacheEntry[] = [];

/**
 * Acquires a char atlas, either generating a new one or returning an existing
 * one that is in use by another terminal.
 * @param terminal The terminal.
 * @param colors The colors to use.
 */
export function acquireCharAtlas(
  terminal: Terminal,
  colors: IColorSet,
  scaledCellWidth: number,
  scaledCellHeight: number,
  scaledCharWidth: number,
  scaledCharHeight: number
): WebglCharAtlas {
  const newConfig = generateConfig(scaledCellWidth, scaledCellHeight, scaledCharWidth, scaledCharHeight, terminal, colors);

  // Check to see if the terminal already owns this config
  for (let i = 0; i < charAtlasCache.length; i++) {
    const entry = charAtlasCache[i];
    const ownedByIndex = entry.ownedBy.findIndex(entry => entry.deref() === terminal);
    if (ownedByIndex >= 0) {
      if (configEquals(entry.config, newConfig)) {
        return entry.atlas;
      }
      // The configs differ, release the terminal from the entry
      if (entry.ownedBy.length === 1) {
        entry.atlas.dispose();
        charAtlasCache.splice(i, 1);
      } else {
        entry.ownedBy.splice(ownedByIndex, 1);
      }
      break;
    }
  }

  // Try match a char atlas from the cache
  for (let i = 0; i < charAtlasCache.length; i++) {
    const entry = charAtlasCache[i];
    if (configEquals(entry.config, newConfig)) {
      // Add the terminal to the cache entry and return
      entry.ownedBy.push(new WeakRef(terminal));
      return entry.atlas;
    }
  }

  const newEntry: ICharAtlasCacheEntry = {
    atlas: new WebglCharAtlas(document, newConfig),
    config: newConfig,
    ownedBy: [new WeakRef(terminal)]
  };
  charAtlasCache.push(newEntry);
  return newEntry.atlas;
}

/**
 * Removes a terminal reference from the cache, allowing its memory to be freed.
 * @param terminal The terminal to remove.
 */
export function removeTerminalFromCache(terminal: Terminal): void {
  for (let i = 0; i < charAtlasCache.length; i++) {
    // Clear out any garbage collected weak references as well as the removed terminal
    charAtlasCache[i].ownedBy = charAtlasCache[i].ownedBy.filter(entry => ![undefined, terminal].includes(entry.deref()));

    if (charAtlasCache[i].ownedBy.length === 0) {
      // Remove the cache entry as it no longer have any references
      charAtlasCache[i].atlas.dispose();
      charAtlasCache.splice(i, 1);
    }
  }
}
