
/**
 * Normalize a "customers" metadata value into an array of strings.
 * Accepts arrays, objects (uses values), or comma-separated strings.
 * Throws a TypeError for unsupported input shapes so callers can decide response codes.
 */
export function normalizeCustomersToArray(customers: unknown): string[] {
  if (Array.isArray(customers)) {
    return customers.map((customer: unknown) => String(customer))
  }

  if (typeof customers === 'object' && customers !== null) {
    const values = Object.values(customers as Record<string, unknown>)
    return values.map((customer: unknown) => String(customer))
  }

  if (typeof customers === 'string') {
    return customers
      .split(',')
      .map((customer: string) => customer.trim())
      .filter((customer: string) => customer.length > 0)
  }

  throw new TypeError('Invalid customers format')
}


