import { useRef, useState, useCallback, useEffect } from "react";
import socket from "../services/socket";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/**
 * Seller-side WebRTC hook. Captures the seller's camera/mic once, then opens
 * one RTCPeerConnection per viewer (a simple mesh — fine for the small
 * audience sizes this prototype targets) and streams to each.
 */
export function useBroadcaster(liveSessionId) {
  const [localStream, setLocalStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const peersRef = useRef(new Map()); // viewerSocketId -> RTCPeerConnection
  const localStreamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      setError(
        "Could not access camera/mic. Check your browser's camera permissions for this site and that no other app is using the camera."
      );
      console.error("getUserMedia failed:", err);
      return null;
    }
  }, []);

  const createPeerForViewer = useCallback(
    (viewerSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(viewerSocketId, pc);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", { targetSocketId: viewerSocketId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          pc.close();
          peersRef.current.delete(viewerSocketId);
        }
      };

      return pc;
    },
    []
  );

  useEffect(() => {
    if (!liveSessionId) return undefined;

    async function handleViewerWantsStream({ viewerSocketId }) {
      const pc = createPeerForViewer(viewerSocketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { targetSocketId: viewerSocketId, sdp: offer });
      } catch (err) {
        console.error("Failed to create offer for viewer:", err);
      }
    }

    async function handleAnswer({ fromSocketId, sdp }) {
      const pc = peersRef.current.get(fromSocketId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("Failed to set remote description (answer):", err);
      }
    }

    async function handleIceCandidate({ fromSocketId, candidate }) {
      const pc = peersRef.current.get(fromSocketId);
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    }

    function handleViewerLeft({ viewerSocketId }) {
      const pc = peersRef.current.get(viewerSocketId);
      if (pc) {
        pc.close();
        peersRef.current.delete(viewerSocketId);
      }
    }

    socket.on("viewer-wants-stream", handleViewerWantsStream);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("viewer-left", handleViewerLeft);

    return () => {
      socket.off("viewer-wants-stream", handleViewerWantsStream);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("viewer-left", handleViewerLeft);
    };
  }, [liveSessionId, createPeerForViewer]);

  // Seller feature: flip between front/back camera mid-broadcast. Requests a
  // fresh video-only stream with the opposite facingMode, then hot-swaps the
  // track on every existing peer connection (RTCRtpSender.replaceTrack) so
  // viewers see the switch with no renegotiation/reconnect needed.
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || isSwitchingCamera) return;
    setIsSwitchingCamera(true);
    const nextFacingMode = facingMode === "user" ? "environment" : "user";

    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacingMode } },
        audio: false,
      });
      const newTrack = newVideoStream.getVideoTracks()[0];
      const oldTrack = localStreamRef.current.getVideoTracks()[0];

      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(newTrack);
      });

      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(localStreamRef.current);
      setFacingMode(nextFacingMode);
    } catch (err) {
      console.error("switchCamera failed (device may only have one camera):", err);
      setError("Could not switch camera — this device may only have one.");
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [facingMode, isSwitchingCamera]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    }
  }, []);

  const stopBroadcast = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  useEffect(() => stopBroadcast, [stopBroadcast]);

  return {
    localStream,
    error,
    startCamera,
    stopBroadcast,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    facingMode,
    switchCamera,
    isSwitchingCamera,
  };
}
