'use client';
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/socketContext';

interface VideoCallProps {
  workspaceId: string;
  onClose: () => void;
}

export default function VideoCall({ workspaceId, onClose }: VideoCallProps) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        socket?.emit('joinVideoRoom', workspaceId);
      });

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
      socket?.emit('leaveVideoRoom', workspaceId);
    };
  }, [workspaceId]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-4xl mx-4">
        {/* Screen Share Display */}
        {isScreenSharing && (
          <div className="w-full aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <video 
              ref={screenVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Local Video */}
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white bg-gray-800">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-4">
          <button 
            onClick={toggleMute} 
            className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button 
            onClick={toggleVideo} 
            className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80`}
          >
            {isVideoOff ? '📵' : '📹'}
          </button>
          <button 
            onClick={toggleScreenShare} 
            className={`p-4 rounded-full ${isScreenSharing ? 'bg-green-600' : 'bg-gray-700'} hover:opacity-80`}
            title="Share Screen"
          >
            🖥️
          </button>
          <button 
            onClick={onClose} 
            className="p-4 rounded-full bg-red-600 hover:bg-red-500"
            title="End Call"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
