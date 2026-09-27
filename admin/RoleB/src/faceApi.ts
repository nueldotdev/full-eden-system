// modern-face-api's browser bundle does not ship TypeScript declarations
// for this deep import, so we intentionally treat the bundle as untyped.
 // @ts-expect-error - no declaration file is provided for the browser bundle
import faceapi from 'modern-face-api/dist/modern-face-api.min.js';

export default faceapi;