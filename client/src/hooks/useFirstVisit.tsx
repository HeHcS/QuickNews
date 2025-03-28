import { useState, useEffect } from "react";

export default function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('quicknews-visited');
    if (hasVisitedBefore) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('quicknews-visited', 'true');
      setIsFirstVisit(true);
    }
  }, []);

  return isFirstVisit;
}
