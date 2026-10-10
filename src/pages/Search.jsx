import Tabs from '/src/components/loader/Tabs';
import Omnibox from '/src/components/loader/Omnibox';
import Viewer from '/src/components/loader/Viewer';
import Menu from '/src/components/loader/Menu';
import FloatingWindows from '/src/components/loader/FloatingWindows';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '../utils/optionsContext';
import { useEffect } from 'react';

export default function Loader({ config = {} }) {
  const { url, ui = true, zoom, alerts = false } = config;
  const { options } = useOptions();
  const tabs = loaderStore((state) => state.tabs);
  const updateUrl = loaderStore((state) => state.updateUrl);
  const barStyle = {
    backgroundColor: options.barColor || '#09121e',
  };

  useEffect(() => {
    if (url && tabs.length > 0) {
      //only 1 tab on initial load so tabs[0]
      const tab = tabs[0];
      const processedUrl = process(url, false, options.prType || 'auto', options.engine || 'https://www.bing.com/search?q=');
      if (processedUrl && tab.url !== processedUrl) {
        updateUrl(tab.id, processedUrl);
      }
    }
  }, [url, tabs, updateUrl, options.prType]);

  useEffect(() => {
    loaderStore.getState().clearStore({ showTb: options.showTb ?? true });
  }, []);

  return (
    <div className="relative flex flex-col w-full h-screen">
      {ui && (
        <>
          <div
            className="flex flex-col w-full"
            style={barStyle}
            onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
          >
            <div className="flex h-8 items-center gap-2 border-b border-white/5 px-3 sm:px-4" style={{ backgroundColor: options.barColor || '#09121e' }}>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-violet-500 text-[10px] font-black text-white shadow-sm">D</span>
              <span className="select-none text-[11px] font-bold tracking-[0.2em] text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DOGEUB OS</span>
              <span className="ml-auto text-[9px] font-medium tracking-wider text-white/35">BROWSER</span>
            </div>
            <Tabs />
            <Omnibox />
          </div>
          <Menu />
        </>
      )}
      <div
        className="flex-1 w-full min-h-0"
        onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
      >
        <Viewer conf={{ zoom: zoom, alerts: alerts }} />
      </div>
      <FloatingWindows />
    </div>
  );
}
