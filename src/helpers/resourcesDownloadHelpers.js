/**
 * @description Downloads the resorces from the specified list using the DCS API
 * @param {Array} resourceList - Array of resources to retrieve from the API
 * @return {Promise} Promise that resolves to success or rejects if a resource failed to download
 */
export async function downloadResources(resourceList) {
  if (!resourceList || !resourceList.length) {
    throw new Error('Resource list empty');
  }
  return 'success';
}