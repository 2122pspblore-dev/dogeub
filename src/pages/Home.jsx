import Nav from '../layouts/Nav';
import Search from '../components/SearchContainer';
import Footer from '../components/Footer';
import QuickLinks from '../components/QuickLinks';
import Widgets from '../components/Widgets';
import StudySprint from '../components/StudySprint';
import { memo } from 'react';

const Home = memo(() => {
  return (
    <>
      <Nav />
      <Search />
      <Widgets />
      <QuickLinks cls="w-full max-w-[40rem] mx-auto mt-6" />
      <StudySprint />
      <Footer />
    </>
  );
});

Home.displayName = 'Home';
export default Home;
