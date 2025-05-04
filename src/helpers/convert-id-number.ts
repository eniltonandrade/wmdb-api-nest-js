export function convertIdNumber(id: string): number {
  const convertedNumber = Number(id)
  return isNaN(convertedNumber) ? 0 : convertedNumber
}
