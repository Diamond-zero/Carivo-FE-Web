import { getGarageByIdApi, getMyStaffProfileApi } from '../../api/staff.api'
import { mapApiGarage, mapApiStaffProfile, mapApiUser } from './mapApiTypes'
import { MockLoginError, type StaffAuthSession } from './mockStaffLogin'

export async function buildStaffSessionFromProfile(): Promise<StaffAuthSession> {
  const profile = await getMyStaffProfileApi()

  if (!profile.is_active) {
    throw new MockLoginError('STAFF_INACTIVE')
  }

  if (!profile.user) {
    throw new MockLoginError('NO_STAFF_PROFILE')
  }

  const garage = profile.garage_id
    ? mapApiGarage(await getGarageByIdApi(profile.garage_id))
    : null

  return {
    user: mapApiUser(profile.user),
    staffProfile: mapApiStaffProfile(profile),
    garage,
  }
}
