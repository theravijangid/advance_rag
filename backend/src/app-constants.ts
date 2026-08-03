export const RESET_TOKEN_EXPIRATION = '240h'

// Validate file size (5MB limit)
export const MAX_FILE_SIZE = 8 * 1024 * 1024
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 
export const MAX_PPT_SIZE = 10 * 1024 * 1024

export const ALLOWED_FILE_TYPES = {
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  pages: 'application/x-iwork-pages-sffpages',
  rtf: 'application/rtf',
  txt: 'text/plain',
  wpd: 'application/wordperfect',
  wps: 'application/vnd.ms-works',

  // Spreadsheets
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  gsheet: 'application/vnd.google-apps.spreadsheet',

  // Presentations
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
  key: 'application/x-iwork-keynote-sffkey',

  // Archives
  zip: 'application/zip',
  '7z': 'application/x-7z-compressed',
  rar: 'application/x-rar-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  gzip: 'application/gzip',
  xz: 'application/x-xz',
  z: 'application/x-compress',
  pem: 'application/x-x509-ca-cert',

  // Images
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  webp: 'image/webp',
}

// Helper function to get all allowed MIME types
export const getAllowedMimeTypes = () => Object.values(ALLOWED_FILE_TYPES)

// Helper function to get all allowed extensions
export const getAllowedExtensions = () => Object.keys(ALLOWED_FILE_TYPES)

export const DOWNLOAD_FORM_S3_KEY = 'documents/Voter_Absentee_ Information Letter_Sample_Guide_Registration Form.pdf'

export const CO_APPLICANT_CHECKLIST_KEY = '/WP-4ChecklistofCo-ParticipantResponsibilities'