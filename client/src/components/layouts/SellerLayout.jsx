import { Outlet } from "react-router-dom";
import SellerSidebar from "../seller/SellerSidebar";

export default function SellerLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
