import {
  useState
} from "react";

import {
  Outlet
} from "react-router-dom";

import {
  Header
} from "./Header";

import {
  Sidebar
} from "./Sidebar";

import "../../styles/workspace.css";

export function AppLayout() {
  const [
    sidebarOpen,
    setSidebarOpen
  ] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="app-main">
        <Header
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}