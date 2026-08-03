export function normalizeName(name: string): string {
  if (!name) return ''; // Handle null/empty string edge cases
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric characters with '-'
    .replace(/(^-|(?<=-)-+|-$)/g, '')  // Remove leading, trailing, and multiple hyphens
    .substring(0, 255);  // Ensure the length doesn't exceed 255 characters
}

export function normalizeFileName(fileName: string): string {
  // remove all special characters except ., _ and -
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '')
}

