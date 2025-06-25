import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { UserProvider } from './context/UserContext.jsx';
import { store } from './store/store.js';
import { Provider } from 'react-redux';
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Router>
    {/* <UserProvider> */}
    <Provider store={store}>
        <App />
    </Provider>
    {/* </UserProvider> */}
  </Router>
)
