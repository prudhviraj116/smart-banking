import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const fontStylesheet = document.createElement('link');
fontStylesheet.rel = 'stylesheet';
fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Figtree:wght@400;500;600&display=swap';
document.head.appendChild(fontStylesheet);

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
