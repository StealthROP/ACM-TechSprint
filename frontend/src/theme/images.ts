/**
 * BelongED Image Assets
 * Centralized registry for all imported images, supporting standard, autistic, and dyslexic cognitive styles.
 */

export const IMAGES = {
  // Standard (Default) assets
  standard: {
    book: require('../../assets/book.png'),
    camera: require('../../assets/camera.png'),
    girlStudying: require('../../assets/girl_studying.png'),
    guyThinkingModule: require('../../assets/guy_thinking_module.png'),
    libraryHeader: require('../../assets/library_header.png'),
    settings: require('../../assets/settings.png'),
  },

  // Autistic cognitive style assets
  autistic: {
    book: require('../../assets/autistic/book_au.png'),
    camera: require('../../assets/camera.png'), // Falls back to standard camera
    girlStudying: require('../../assets/autistic/girl_studying_au.png'),
    guyThinkingModule: require('../../assets/autistic/guy_thinking_module_au.png'),
    libraryHeader: require('../../assets/autistic/library_header_au.png'),
    settings: require('../../assets/autistic/settings_au.png'),
  },

  // Dyslexic cognitive style assets
  dyslexic: {
    book: require('../../assets/dyslexic/book_ds.png'),
    camera: require('../../assets/camera.png'), // Falls back to standard camera
    girlStudying: require('../../assets/dyslexic/girl_studying_ds.png'),
    guyThinkingModule: require('../../assets/dyslexic/guy_thinking_module_ds.png'),
    libraryHeader: require('../../assets/dyslexic/library_header_ds.png'),
    settings: require('../../assets/dyslexic/settings_ds.png'),
  },
};

export type ImageKey = 'book' | 'camera' | 'girlStudying' | 'guyThinkingModule' | 'libraryHeader' | 'settings';
export type CognitiveStyle = 'standard' | 'autistic' | 'dyslexic';

/**
 * Helper function to retrieve the appropriate image asset based on user's cognitive profile or active theme settings.
 */
export const getImageAsset = (key: ImageKey, style: CognitiveStyle = 'standard') => {
  const selectedStyle = IMAGES[style] || IMAGES.standard;
  return selectedStyle[key] || IMAGES.standard[key];
};
