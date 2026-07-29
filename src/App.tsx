import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchPanel } from './components/SearchPanel';
import { ResultsSection } from './components/ResultsSection';
import { useInitiativeSearch } from './hooks/useInitiativeSearch';

function App() {
  const {
    postcodeInput,
    setPostcodeInput,
    radiusKm,
    setRadiusKm,
    activePostcode,
    search,
    clearSearch,
    initiatives,
    selectedCategories,
    toggleCategory,
    loading,
    error,
  } = useInitiativeSearch();

  return (
    <>
      <Header />
      <Hero />
      <SearchPanel
        postcodeInput={postcodeInput}
        onPostcodeChange={setPostcodeInput}
        onSubmit={search}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        showRadius={Boolean(activePostcode)}
        error={error}
      />
      <ResultsSection
        initiatives={initiatives}
        loading={loading}
        activePostcode={activePostcode}
        radiusKm={radiusKm}
        onClearFilter={clearSearch}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
      />
    </>
  );
}

export default App;
