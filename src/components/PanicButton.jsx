import { useEffect } from 'react';

const PANIC_URL = 'https://classroom.google.com/';

const PanicButton = () => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        (event.key === 'c' || event.key === 'C')
      ) {
        event.preventDefault();
        window.location.href = PANIC_URL;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
};

export default PanicButton;
