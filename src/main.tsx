import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store/store';
import { bewaarPaginaBron } from './export/bestanden';
import './styles.css';

// De pagina wordt vastgelegd vóórdat React iets rendert. In de gebouwde versie
// zit de hele app in dit ene HTML-bestand, waardoor er later een werkende
// kopie mét gegevens van weggeschreven kan worden.
bewaarPaginaBron();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
