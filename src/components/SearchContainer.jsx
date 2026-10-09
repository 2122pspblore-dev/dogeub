import clsx from 'clsx';
import { useState, useEffect, useRef, useCallback, useMemo, memo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideSearch, Earth } from 'lucide-react';
import { GlowWrapper } from '../utils/Glow';
import { useOptions } from '../utils/optionsContext';
import { searchConfig } from '../utils/config';
import Logo from '../components/Logo';
import theme from '../styles/theming.module.css';
import 'movement.css';

const QUICK_ENGINES = ['Bing', 'DuckDuckGo', 'Brave', 'Yahoo', 'Startpage', 'Ecosia', 'Kagi'];

const SearchContainer = memo(function SearchContainer({ logo = true, cls, nav = true, navigating }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);
  const latestQuery = useRef('');
  const navigate = useNavigate();
  const { options, updateOption } = useOptions();
  const [pickerOpen, setPickerOpen] = useState(false);
  const quickEngines = useMemo(
    () => searchConfig.filter((c) => QUICK_ENGINES.includes(c.option)),
    [],
  );

  const fetchResults = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    latestQuery.current = searchQuery;
    try {
      const response = await fetch('/return?q=' + encodeURIComponent(searchQuery));
      if (!response.ok) return setResults([]);

      const data = await response.json();
      if (latestQuery.current !== searchQuery) return;
      const list = Array.isArray(data) ? data.filter((i) => i.phrase).slice(0, 4) : [];
      startTransition(() => setResults(list));
    } catch {
      if (latestQuery.current === searchQuery) setResults([]);
    }
  }, []);

  const go = (strin) => {
    if (nav) {
      navigate("/search", {
        state: {
          url: strin,
        }
      });
    } else {
      const processedUrl = navigating.process(strin);
      if (processedUrl) {
        navigating.go(navigating.id, processedUrl);
      }
    }
  }

  const handleInputChange = useCallback(
    (e) => {
      const newQuery = e.target.value;
      setQuery(newQuery);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!newQuery.trim()) {
        latestQuery.current = '';
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => fetchResults(newQuery), 300);
    },
    [fetchResults],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter') return;
      const trimmed = query.trim();
      if (!trimmed) return;
      go(trimmed);
    },
    [query, go],
  );

  const handleResultClick = useCallback(
    (phrase) => {
      go(phrase);
    },
    [go],
  );

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  const placeholder = useMemo(
    () => `Search ${options.engineName || 'Bing'} or type URL`,
    [options.engineName],
  );

  const iconSrc = useMemo(
    () =>
      options.engineIcon ??
      'https://www.bing.com/favicon.ico',
    [options.engineIcon],
  );

  return (
    <div
      className={clsx(
        !cls ? 'absolute w-full px-20 py-4 flex flex-col items-center mt-8 z-50' : cls,
      )}
      data-m={!cls && 'bounce-up'}
      data-m-duration={!cls && '0.8'}
    >
      {logo && (
        <div className="flex flex-col items-center">
          <Logo options="w-[15.8rem] h-30" />
          <div className="mt-2 text-sm tracking-wide opacity-80 select-none">Advik Kumar</div>
        </div>
      )}
      <GlowWrapper
        glowOptions={{ color: options.glowWrapperColor || '255, 255, 255', size: 70, opacity: 0.2 }}
      >
        <div className="w-[40.625rem]">
          <div
            id="search-div"
            className={clsx(
              'flex items-center gap-3 shadow-xl pl-4 pr-4 w-full h-[3.41rem]',
              results.length || pickerOpen ? 'rounded-t-[14px] rounded-b-none' : 'rounded-[14px]',
              theme[`searchBarColor`],
              theme[`theme-${options.theme || 'default'}`],
            )}
          >
            <button
              type="button"
              className="shrink-0 cursor-pointer"
              title="Change search engine"
              aria-label="Change search engine"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((v) => !v)}
            >
              {iconSrc ? (
                <img src={iconSrc} className="w-5 h-5" alt="Search engine" loading="lazy" />
              ) : (
                <Earth size={22} />
              )}
            </button>

            <input
              type="text"
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-hidden text-[16.5px] leading-[20px] placeholder:font-[Inter] placeholder:font-medium"
              autoComplete="off"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            <LucideSearch className="w-[1.08rem] h-[1.08rem] shrink-0" />
          </div>

          {pickerOpen && (
            <div
              className={clsx(
                'shadow-xl mt-0 p-2 text-[14px] w-full rounded-b-[14px] flex flex-wrap gap-2',
                theme[`searchResultStyle`],
                theme[`theme-${options.theme || 'default'}`],
              )}
            >
              {quickEngines.map((c) => {
                const active = (options.engine || searchConfig[0].value.engine) === c.value.engine;
                return (
                  <button
                    type="button"
                    key={c.option}
                    className={clsx(
                      'flex items-center gap-2 rounded-[9px] h-9 px-3 cursor-pointer duration-100 ease-in hover:bg-[#d4d4d418]',
                      active && 'bg-[#d4d4d424]',
                    )}
                    onClick={() => {
                      updateOption(c.value);
                      setPickerOpen(false);
                    }}
                  >
                    <img src={c.value.engineIcon} className="w-4 h-4" alt="" loading="lazy" />
                    <span>{c.option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!pickerOpen && results.length > 0 && (
            <div
              className={clsx(
                'shadow-xl mt-0 p-2 text-[14px] w-full rounded-b-[14px] space-y-1',
                theme[`searchResultStyle`],
                theme[`theme-${options.theme || 'default'}`],
              )}
            >
              {results.map((result) => (
                <div
                  key={result.phrase}
                  className="rounded-[9px] w-full h-11 hover:bg-[#d4d4d418] cursor-pointer duration-100 ease-in px-3 pl-2.5 flex items-center"
                  onClick={() => handleResultClick(result.phrase)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '12px' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <span className="text-[15px]">{result.phrase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlowWrapper>
    </div>
  );
});

export default SearchContainer;
