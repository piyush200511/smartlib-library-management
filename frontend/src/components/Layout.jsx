import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar'; // <-- Import this

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar /> {/* <-- Add this */}
        <div style={{ padding: '2rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}