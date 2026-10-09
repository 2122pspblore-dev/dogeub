import Routing from './Routing';
import ReactGA from 'react-ga4';
import Search from './pages/Search';
import lazyLoad from './lazyWrapper';
import NotFound from './pages/NotFound';
import { useEffect, useMemo, memo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Popunder from './components/Popunder';
import PanicButton from './components/PanicButton';
import Taskbar from './components/Taskbar';
import PatchLogs from './components/PatchLogs';
import LockScreen from './components/LockScreen';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { initPreload } from './utils/preload';
import { designConfig as bgDesign } from './utils/config';
import useReg from './utils/hooks/loader/useReg';
import usePopunderStore from './utils/hooks/popunder/usePopunderStore';
import { validateAdKey } from './utils/hooks/popunder/validateAdKey';
import './index.css';
import 'nprogress/nprogress.css';

const importHome = () => import('./pages/Home');
const importApps = () => import('./pages/Apps');
const importGms = () => import('./pages/Apps2');
const importSettings = () => import('./pages/Settings');

const Home = lazyLoad(importHome);
const Apps = lazyLoad(importApps);
const Apps2 = lazyLoad(importGms);
const Settings = lazyLoad(importSettings);
const Player = lazyLoad(() => import('./pages/Player'));

initPreload('/materials', importApps);
initPreload('/docs', importGms);
initPreload('/settings', importSettings);
initPreload('/', importHome);

function useTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
}

const ThemedApp = memo(() => {
  const { options, updateOption } = useOptions();
  const popunderEnabled = POPUNDER_ENABLED === 'true';
  const [customBackground, setCustomBackground] = useState(() => {
    try { return window.localStorage.getItem('dogeub-site-background') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const body = document.body;
    if (customBackground) {
      body.style.setProperty('background-image', `url("${customBackground}")`, 'important');
      body.style.setProperty('background-size', 'cover', 'important');
      body.style.setProperty('background-position', 'center center', 'important');
      body.style.setProperty('background-repeat', 'no-repeat', 'important');
      body.style.setProperty('background-attachment', 'fixed', 'important');
      body.style.setProperty('background-color', options.bgColor || '#111827', 'important');
    } else {
      body.style.removeProperty('background-image');
      body.style.removeProperty('background-size');
      body.style.removeProperty('background-position');
      body.style.removeProperty('background-repeat');
      body.style.removeProperty('background-attachment');
      body.style.removeProperty('background-color');
    }
  }, [customBackground, options.bgColor]);

  useEffect(() => {
    const syncBackground = () => {
      try { setCustomBackground(window.localStorage.getItem('dogeub-site-background') || ''); } catch { setCustomBackground(''); }
    };
    window.addEventListener('dogeub-background-change', syncBackground);
    return () => window.removeEventListener('dogeub-background-change', syncBackground);
  }, []);
  const adKeyPassed = usePopunderStore((state) => state.adKeyPassed);
  const setAdKeyPassed = usePopunderStore((state) => state.setAdKeyPassed);
  useReg();
  useTracking();

  useEffect(() => {
    let cancaled = false;

    const run = async () => {
      const jocc =
        typeof options.adKeyInput === 'string' && options.adKeyInput.trim()
          ? options.adKeyInput.trim()
          : typeof options.adKey === 'string' && options.adKey.trim()
            ? options.adKey.trim()
            : '';

      if (!jocc) {
        if (!cancaled) setAdKeyPassed(false);
        return;
      }

      const valid = await validateAdKey(jocc);
      if (cancaled) return;

      setAdKeyPassed(valid);

      if (valid && (options.adKey !== jocc || options.adKeyInput !== jocc)) {
        updateOption({ adKey: jocc, adKeyInput: jocc });
      }
    };

    run();

    return () => {
      cancaled = true;
    };
  }, [options.adKey, options.adKeyInput, setAdKeyPassed, updateOption]);

  const pages = useMemo(
    () => [
      { path: '/', element: <Home /> },
      { path: '/materials', element: <Apps /> },
      { path: '/docs', element: <Apps2 /> },
      { path: '/docs/r', element: <Player /> },
      { path: '/search', element: <Search />},
      { path: '/settings', element: <Settings /> },
      { path: '/portal/k12/*', element: <NotFound /> },
      { path: '/ham/*', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
    [],
  );

  const backgroundStyle = useMemo(() => {
    const bgDesignConfig =
      options.bgDesign === 'None'
        ? 'none'
        : (
            bgDesign.find((d) => d.value.bgDesign === options.bgDesign) || bgDesign[0]
          ).value.getCSS?.(options.bgDesignColor || '102, 105, 109') || 'none';

    return `
      body {
        color: ${options.siteTextColor || '#a0b0c8'};
        background-image: ${customBackground ? `url("${customBackground}")` : bgDesignConfig};
        background-size: ${customBackground ? 'cover' : 'auto'};
        background-position: ${customBackground ? 'center center' : 'initial'};
        background-repeat: ${customBackground ? 'no-repeat' : 'repeat'};
        background-attachment: ${customBackground ? 'fixed' : 'scroll'};
        background-color: ${options.bgColor || '#111827'};
      }
    `;
  }, [options.siteTextColor, options.bgDesign, options.bgDesignColor, options.bgColor, customBackground]);

  return (
    <>
      <PanicButton />
      <PatchLogs />
      <Routing pages={pages} />
      <Taskbar />
      <LockScreen />
      {popunderEnabled && !adKeyPassed ? <Popunder /> : null}
      <style>{backgroundStyle}</style>
    </>
  );
});

ThemedApp.displayName = 'ThemedApp';

const App = () => (
  <OptionsProvider>
    <ThemedApp />
  </OptionsProvider>
);

export default App;
