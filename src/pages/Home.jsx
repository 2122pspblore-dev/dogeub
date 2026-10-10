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
      <Widgets />
      <DesktopPerformanceWidget />
      <QuickLinks cls="w-full max-w-[40rem] mx-auto mt-6" />
      <PopularActivityWidgets />
      <Footer />
    </>
  );
});

Home.displayName = 'Home';
export default Home;
