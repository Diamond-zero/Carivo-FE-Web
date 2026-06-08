export const mockServicePackages: Record<string, string> = {
  'pkg-wash-car-basic': 'Rửa xe ô tô cơ bản',
  'pkg-wash-car-premium': 'Rửa xe ô tô cao cấp',
  'pkg-wash-bike-basic': 'Rửa xe máy cơ bản',
  'pkg-wash-bike-premium': 'Rửa xe máy cao cấp',
}

export function getServicePackageName(id: string) {
  return mockServicePackages[id] ?? id
}
