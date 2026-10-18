import { createRoot } from 'react-dom/client';
import '@fontsource/zen-old-mincho/latin-700.css';
import '@fontsource/zen-old-mincho/latin-900.css';
import '@fontsource/zen-kaku-gothic-new/latin-500.css';
import '@fontsource/zen-kaku-gothic-new/latin-700.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
