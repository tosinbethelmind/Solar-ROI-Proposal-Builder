'use client';

import * as React from 'react';

export function CopyrightYear() {
  const [year, setYear] = React.useState(2026);
  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <>{year}</>;
}
