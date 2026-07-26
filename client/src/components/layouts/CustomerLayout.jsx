import { Outlet } from "react-router-dom";
import CustomerNavbar from "../customer/CustomerNavbar";
import BottomNavigation from "../customer/BottomNavigation";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <CustomerNavbar />
      <main>
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
