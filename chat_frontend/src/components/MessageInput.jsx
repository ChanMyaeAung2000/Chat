import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Mic, Square } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Voice recording is not supported in this browser or requires HTTPS", {
        duration: 3000,
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreview(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        toast.error("Microphone permission denied. Please allow microphone in browser settings.", {
          duration: 4000,
        });
      } else if (err.name === "NotFoundError") {
        toast.error("No microphone found. Please connect a microphone.", {
          duration: 3000,
        });
      } else {
        toast.error("Could not access microphone: " + err.message, {
          duration: 3000,
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setAudioBlob(null);
    setAudioPreview(null);
    setRecordTime(0);
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
    setRecordTime(0);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let audioData = undefined;
      if (audioBlob) {
        const reader = new FileReader();
        audioData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioData,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setAudioPreview(null);
      setRecordTime(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 w-full">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioPreview && (
        <div className="mb-3 flex items-center gap-2 bg-base-300 rounded-lg p-3">
          <audio src={audioPreview} controls className="flex-1 h-8" />
          <button
            onClick={removeAudio}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-base-200
            flex items-center justify-center hover:bg-red-500/20"
            type="button"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 font-mono text-sm">{formatTime(recordTime)}</span>
          <span className="text-zinc-400 text-sm flex-1">Recording...</span>
          <button
            onClick={cancelRecording}
            className="btn btn-ghost btn-xs text-zinc-400"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="relative">
        <div className="flex items-center gap-0 input input-bordered rounded-full pr-2 pl-1 py-1 focus-within:ring-2 focus-within:ring-primary">
          {/* Emoji button */}
          <button
            type="button"
            className="flex-shrink-0 p-2 rounded-full hover:bg-base-300 transition-colors"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile size={20} className="text-zinc-400" />
          </button>

          {/* Text input */}
          <input
            type="text"
            className="flex-1 bg-transparent outline-none px-2 text-sm sm:text-base"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording}
          />

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* Image button */}
          {!isRecording && (
            <button
              type="button"
              className={`flex-shrink-0 p-2 rounded-full hover:bg-base-300 transition-colors ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
          )}

          {/* Mic / Stop button */}
          {isRecording ? (
            <button
              type="button"
              className="flex-shrink-0 p-2 rounded-full bg-red-500 text-white animate-pulse"
              onClick={stopRecording}
            >
              <Square size={20} />
            </button>
          ) : !audioPreview ? (
            <button
              type="button"
              className="flex-shrink-0 p-2 rounded-full hover:bg-base-300 transition-colors text-zinc-400"
              onClick={startRecording}
            >
              <Mic size={20} />
            </button>
          ) : null}

          {/* Send button */}
          <button
            type="submit"
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${text.trim() || imagePreview || audioBlob ? "text-primary hover:bg-primary/20" : "text-zinc-500"}`}
            disabled={!text.trim() && !imagePreview && !audioBlob}
          >
            <Send size={20} />
          </button>
        </div>

        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-0 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
