import { invoke } from '@tauri-apps/api/core';

/**
 * Convert a relative image path to a displayable data URL
 * @param relativePath - The relative path stored in the database (e.g., "assets/images/123_image.png")
 * @returns A data URL that can be used in img src attributes
 */
export async function getImageUrl(relativePath: string | undefined): Promise<string | undefined> {
  if (!relativePath) return undefined;

  try {
    const dataUrl = await invoke<string>('read_image_as_data_url', {
      relativePath,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return undefined;
  }
}
