import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react"; // ✅ library import

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅ emoji picker toggle
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    // if (!file.type.startsWith("image/")) {
    //   toast.error("Please select an image file");
    //   return;
    // }

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji); // ✅ emoji ကို text ထဲ append
    setShowEmojiPicker(false); // ✅ optional: auto close
  };

  return (
    <div className="p-4 w-full">
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

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
        <div className="flex-1 flex gap-2 items-center">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* Emoji button */}
          <button
            type="button"
            className="btn  btn-primary btn-sm sm:btn-md"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile size={22} />
          </button>

          {/* Image button */}
          <button
            type="button"
            className={` sm:flex btn btn-primary btn-sm sm:btn-md
                     ${imagePreview ? "text-emerald-500" : "text-primary-content"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm sm:btn-md"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>

        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-0 z-50 ">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
