import { useRef, useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/**
 * Viewer-side WebRTC hook. Announces itself as ready to receive, then waits
 * for an offer from the seller's browser and answers it.
 */
export function useViewer(liveSessionId) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("connecting"); // connecting | connected | ended | error
  const pcRef = useRef(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    if (!liveSessionId) return undefined;

    async function handleOffer({ fromSocketId, sdp }) {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setConnectionState("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", { targetSocketId: fromSocketId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          setConnectionState("ended");
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { targetSocketId: fromSocketId, sdp: answer });
      } catch (err) {
        console.error("Failed to answer offer:", err);
        setConnectionState("error");
      }
    }

    async function handleIceCandidate({ candidate }) {
      if (!pcRef.current || !candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    }

    function handleSessionStatus({ status }) {
      if (status === "ended") setConnectionState("ended");
    }

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("session-status", handleSessionStatus);

    // Tell the room "I'm here, send me the stream" — the seller's
    // useBroadcaster hook responds to this by creating an offer for us.
    socket.emit("webrtc-ready", { liveSessionId });

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("session-status", handleSessionStatus);
      cleanup();
    };
  }, [liveSessionId, cleanup]);

  return { remoteStream, connectionState };
}
