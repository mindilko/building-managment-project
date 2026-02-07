import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateBuilding from './pages/CreateBuilding';
import BuildingView from './pages/BuildingView';
import FloorPlan from './pages/FloorPlan';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateBuilding />} />
        <Route path="/building/:buildingId/edit" element={<CreateBuilding />} />
        <Route path="/building/:buildingId" element={<BuildingView />} />
        <Route path="/building/:buildingId/floor/:floorNumber" element={<FloorPlan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
