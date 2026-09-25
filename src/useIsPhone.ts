import { useEffect, useState } from 'react';

/** The width at which the layout becomes one column: keep in step with the 760px rules in styles.css. */
const PHONE = '(max-width: 760px)';

/** Whether the screen is phone-sized, updated as it turns or resizes. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
}
