import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, Sparkles, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { opportunityService } from "../../services/opportunityService";
import { businessHealthService } from "../../services/businessHealthService";
import { Spinner, EmptyState } from "../../components/ui/Primitives";
import WelcomeBanner from "../../components/seller/WelcomeBanner";
import BusinessHealthCard from "../../components/seller/BusinessHealthCard";
import OpportunityCard from "../../components/seller/OpportunityCard";
import Button from "../../components/ui/Button";

export default function SellerDashboard() {
  const { seller } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([opportunityService.getMine(), businessHealthService.getMine()])
      .then(([opps, healthData]) => {
        setOpportunities(opps);
        setHealth(healthData);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDismiss(id) {
    setOpportunities((prev) => prev.filter((o) => o._id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WelcomeBanner seller={seller} />
      <BusinessHealthCard health={health} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Sparkles className="h-4 w-4 text-brand-500" /> Opportunity Feed
          </div>
          <div className="flex items-center gap-3">
            <Link to="/seller/insights" className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-brand-600">
              <MapPin className="h-4 w-4" /> Regional Insights
            </Link>
            <Link to="/seller/live" className="flex items-center gap-1 text-sm font-semibold text-brand-600">
              <Radio className="h-4 w-4" /> Go Live
            </Link>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <EmptyState
            title="No active opportunities"
            subtitle="Your AI growth assistant will surface new opportunities here as demand signals come in."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard key={o._id} opportunity={o} onDismiss={handleDismiss} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center">
        <p className="text-sm text-gray-500">Ready to sell live?</p>
        <Link to="/seller/live">
          <Button className="mt-2">
            <Radio className="h-4 w-4" /> Start a Live Session
          </Button>
        </Link>
      </div>
    </div>
  );
}
