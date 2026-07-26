import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Radio, Lightbulb } from "lucide-react";
import { liveSessionService } from "../../services/liveSessionService";
import { aiService } from "../../services/aiService";
import { Spinner } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";

export default function PrepCoach() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [talkingPoints, setTalkingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    liveSessionService.getById(id).then(async (data) => {
      setSession(data);
      if (data.status === "live") {
        navigate(`/seller/live/${id}/studio`, { replace: true });
        return;
      }
      const productIds = (data.productIds || []).map((p) => p._id);
      if (productIds.length) {
        const { talkingPoints } = await aiService.prepCoach(productIds);
        setTalkingPoints(talkingPoints);
      }
      setLoading(false);
    });
  }, [id, navigate]);

  async function handleGoLive() {
    setStarting(true);
    try {
      await liveSessionService.start(id);
      navigate(`/seller/live/${id}/studio`);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Link to="/seller/live" className="text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold text-gray-900">Prep & Coach</h1>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Session</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{session.title}</p>
          <p className="text-sm text-gray-500">{(session.productIds || []).length} products ready to showcase</p>

          <div className="mt-3 flex gap-2 overflow-x-auto thin-scrollbar">
            {(session.productIds || []).map((p) => (
              <img key={p._id} src={p.images?.[0]} alt={p.name} className="h-16 w-13 flex-shrink-0 rounded-lg object-cover" />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-brand-700">
            <Sparkles className="h-4 w-4" /> AI talking points
          </div>
          {talkingPoints.length === 0 ? (
            <p className="text-sm text-gray-500">
              Add products to this session to get AI-generated talking-point prompts.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {talkingPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-brand-800">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={handleGoLive} loading={starting}>
          <Radio className="h-5 w-5" /> Start Going Live
        </Button>
        <p className="mt-2 text-center text-xs text-gray-400">
          You'll be asked to allow camera and microphone access on the next screen.
        </p>
      </div>
    </div>
  );
}
