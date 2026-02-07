import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import CreateBuilding from './pages/CreateBuilding';
import BuildingView from './pages/BuildingView';
import FloorPlan from './pages/FloorPlan';
import logo from './assets/logo.png';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <Link to="/" className="app-logo-link" aria-label="Go to home">
          <img src={logo} alt="" className="app-logo" />
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBuilding />} />
          <Route path="/building/:buildingId/edit" element={<CreateBuilding />} />
          <Route path="/building/:buildingId" element={<BuildingView />} />
          <Route path="/building/:buildingId/floor/:floorNumber" element={<FloorPlan />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
