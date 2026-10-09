import Search from '../SearchContainer';
import QuickLinks from '../QuickLinks';
import Logo from '../Logo';
import Widgets from '../Widgets';

import { process } from '/src/utils/hooks/loader/utils';

const NewTab = ({ id, updateFn, options = {} }) => {
  const navigating = {
    id: id,
    go: updateFn,
    process: (input) => process(input, false, options.prType || 'auto', options.engine || undefined),
  };
  return (
    <div className="w-full min-h-full flex flex-col items-center p-6">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="flex justify-center w-full">
          <Logo options="w-[15.8rem] h-30 mr-5 mb-2" />
        </div>
        <Search nav={false} logo={false} cls="w-full -mt-3 relative z-50" navigating={navigating} />
        <Widgets cls="mt-6" />
        <a
          href="https://studylive.up.railway.app/"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg ring-2 ring-blue-400/70 transition hover:bg-blue-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Go to StudyLive home page"
        >
          🏠 Go to StudyLive Home
          <span className="ml-2" aria-hidden="true">→</span>
        </a>
        <QuickLinks cls="w-full mt-6" nav={false} navigating={navigating} />
      </div>
    </div>
  );
};

export default NewTab;
