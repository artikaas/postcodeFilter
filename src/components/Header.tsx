export function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <div className="logo" aria-label="Zelf Zorgen, Samen Doen">
          <div className="logo-row">
            <span className="logo-bubble pink">zelf</span>
            <span className="logo-bubble maroon">zorgen</span>
          </div>
          <div className="logo-row">
            <span className="logo-bubble maroon">samen</span>
            <span className="logo-bubble pink">doen</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Hoofdnavigatie">
          <a href="#">Veranderende zorg</a>
          <a href="#">Wat kun jij doen</a>
          <a href="#" className="active" aria-current="page">
            In jouw buurt
          </a>
        </nav>

        <button type="button" className="btn-cta">
          Doe mee
        </button>
      </div>
    </header>
  );
}
