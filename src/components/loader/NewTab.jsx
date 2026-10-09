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
    <div className="min-h-[calc(100%-100px)] w-full flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center w-full">
          <Logo options="w-[15.8rem] h-30 mr-5 mb-2" />
        </div>
        <Search nav={false} logo={false} cls="-mt-3 absolute z-50" navigating={navigating} />
        <QuickLinks cls="mt-16" nav={false} navigating={navigating} />
        <Widgets cls="mt-6" />
      </div>
    </div>
  );
};

export default NewTab;
