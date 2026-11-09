import { jwtDecode } from 'jwt-decode';
export function getFirstAccess(token, response) {
  if (typeof response.firstAccess === 'boolean') return response.firstAccess;
  if (typeof response.entity?.firstAccess === 'boolean') return response.entity.firstAccess;
  try {
    const claims = jwtDecode(token);
    const value = claims.FirstAccess ?? claims.firstAccess ?? claims.first_access;
    if (value === true || value === 'True' || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'False' || value === 'false' || value === 0 || value === '0') return false;
  } catch (_) {}
  // Never silently assume that address registration is complete.
  return null;
}
