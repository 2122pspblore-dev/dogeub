import Nav from '../layouts/Nav';
import Search from '../components/SearchContainer';
import Footer from '../components/Footer';
import QuickLinks from '../components/QuickLinks';
import Widgets from '../components/Widgets';
import PopularActivityWidgets from '../components/PopularActivityWidgets';
import DesktopPerformanceWidget from '../components/DesktopPerformanceWidget';
import { memo } from 'react';

const Home = memo(() => {
  return (
    <>
      <Nav />
      <Search />
      <div className="mx-auto mt-6 grid w-full max-w-7xl grid-cols-1 items-start gap-4 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,2fr)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1"><PopularActivityWidgets only="games" /></div>
        <div className="order-1 min-w-0 lg:order-2"><Widgets cls="mt-0" /></div>
        <div className="order-3 min-w-0"><PopularActivityWidgets only="sites" /></div>
      </div>
      <DesktopPerformanceWidget />
      <QuickLinks cls="w-full max-w-[40rem] mx-auto mt-6" />
      <Footer />
    </>
  );
});

Home.displayName = 'Home';
export default Home;
