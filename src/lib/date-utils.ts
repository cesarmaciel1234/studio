
import { format } from "date-fns";

export const safeFormat = (dateValue: any, formatStr: string) => {
  try {
    if (!dateValue) return 'Ahora'
    let date: Date
    
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate()
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue)
    } else if (dateValue instanceof Date) {
      date = dateValue
    } else {
      return 'Ahora'
    }
    
    if (isNaN(date.getTime())) return 'Ahora'
    return format(date, formatStr)
  } catch (e) {
    return 'Ahora'
  }
}
